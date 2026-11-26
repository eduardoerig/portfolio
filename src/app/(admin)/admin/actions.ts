"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { moveItem } from "@/lib/reorder";
import { assertKind, ORDER, table, type Kind } from "@/lib/tables";
import { deleteObject, headObject, presignPut } from "@/lib/storage";
import { isStoredKey, newKey, validateUpload, type UploadKind } from "@/lib/uploads";

// Resultado dos formulários: erros por campo, em português, para mostrar ao lado do campo.
export type FormState = { ok?: boolean; errors?: Record<string, string> };

// ---------- Validação (zod) ----------
// Todos os campos chegam do FormData como texto; checkbox desmarcado simplesmente não vem.

const required = (nome: string) => z.string().trim().min(1, `${nome}: campo obrigatório`);
const optional = z.string().optional().transform((v) => v?.trim() || null);
const checkbox = z.string().optional().transform((v) => v === "on");
// Select do formulário: vazio = sem rótulo (null); qualquer outro valor fora da lista é rejeitado.
const level = z.string().optional().transform((v) => v || null)
  .pipe(z.enum(["learning", "intermediate"], "Nível inválido").nullable());
const email = z.string().trim().email("E-mail inválido");
// Só http/https: o z.url() sozinho aceita "javascript:", que viraria XSS num <a href>.
const isHttpUrl = (v: string) => z.url({ protocol: /^https?$/ }).safeParse(v).success;
const URL_ERROR = "Endereço inválido (use https://...)";
const url = z.string().trim().refine(isHttpUrl, URL_ERROR);
const optionalUrl = z.string().optional().transform((v) => v?.trim() || null)
  .refine((v) => v === null || isHttpUrl(v), URL_ERROR);

// Textarea "um por linha" -> array limpo (sem linhas vazias) guardado como JSON.
const toLines = (v: string) => v.split("\n").map((l) => l.trim()).filter(Boolean);
const list = z.string().optional().transform((v) => JSON.stringify(toLines(v ?? "")));
const listEn = z.string().optional().transform((v) => {
  const lines = toLines(v ?? "");
  return lines.length ? JSON.stringify(lines) : null; // vazio = cai no português
});

const profileSchema = z.object({
  name: required("Nome"),
  role: required("Cargo"),
  roleEn: optional,
  summary: required("Resumo"),
  summaryEn: optional,
  email,
  githubUrl: url,
  linkedinUrl: url,
  openToWork: checkbox,
  // Só no currículo em PDF.
  fullName: optional,
  location: optional,
  locationEn: optional,
  phone: optional,
  cvClosing: optional,
  cvClosingEn: optional,
});

const itemSchemas = {
  project: z.object({
    title: required("Título"),
    titleEn: optional,
    description: required("Descrição"),
    descriptionEn: optional,
    stack: list,
    stackEn: listEn,
    url: optionalUrl,
    metric: optional,
    metricEn: optional,
    visible: checkbox,
  }),
  experience: z.object({
    role: required("Cargo"),
    roleEn: optional,
    company: required("Empresa"),
    location: required("Local"),
    locationEn: optional,
    period: required("Período"),
    periodEn: optional,
    bullets: list,
    bulletsEn: listEn,
    current: checkbox,
    visible: checkbox,
  }),
  skill: z.object({
    name: required("Nome"),
    nameEn: optional,
    group: required("Grupo"),
    groupEn: optional,
    level,
    visible: checkbox,
  }),
  education: z.object({
    course: required("Curso"),
    courseEn: optional,
    school: required("Instituição"),
    period: required("Período"),
    periodEn: optional,
    note: optional,
    noteEn: optional,
    visible: checkbox,
  }),
  language: z.object({
    name: required("Idioma"),
    nameEn: optional,
    level: required("Nível"),
    levelEn: optional,
    proficiency: z.coerce.number().int("Nível de 1 a 5").min(1, "Nível de 1 a 5").max(5, "Nível de 1 a 5"),
    visible: checkbox,
  }),
};

function parse<T extends z.ZodType>(schema: T, form: FormData): { data: z.output<T> } | { errors: Record<string, string> } {
  const result = schema.safeParse(Object.fromEntries(form));
  if (result.success) return { data: result.data };
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) errors[String(issue.path[0])] ??= issue.message;
  return { errors };
}

const refresh = () => {
  revalidatePath("/");
  revalidatePath("/en");
};

// ---------- Uploads ----------
// O navegador envia o arquivo direto ao armazenamento (URL pré-assinada) e o formulário traz só a chave
// em <campo>Key. Os campos *Path nunca vêm do formulário (o zod os descarta): só recebem uma chave que
// existe no armazenamento com tipo e tamanho permitidos.

type Slot = { field: string; column: string; kind: UploadKind; current: string | null };
type UploadResult = { errors: Record<string, string>; created: string[] } | { changes: Record<string, string | null>; created: string[]; old: string[] };

// Confere cada chave enviada. Marcar "remover" (remove_<campo>) limpa o campo.
async function readUploads(form: FormData, slots: Slot[]): Promise<UploadResult> {
  const errors: Record<string, string> = {};
  const created: string[] = []; // chaves válidas que existem no armazenamento (apagadas se o salvamento falhar)
  const changes: Record<string, string | null> = {};
  for (const slot of slots) {
    const key = form.get(`${slot.field}Key`);
    if (key === null || key === "") continue; // nenhum arquivo novo
    if (!isStoredKey(key)) {
      errors[slot.field] = "Arquivo inválido";
      continue;
    }
    if (key === slot.current) continue; // o mesmo arquivo de antes: nada muda
    // Chave de um arquivo que já está em uso (outro campo ou item): nunca vira "novo", senão seria apagada.
    if (await isReferenced(key)) {
      errors[slot.field] = "Arquivo inválido";
      continue;
    }
    const stored = await headObject(key);
    if (!stored) {
      errors[slot.field] = "Arquivo não encontrado";
      continue;
    }
    created.push(key);
    // Mesmas regras de antes, agora sobre o que de fato está guardado.
    const check = validateUpload({ type: stored.contentType, size: stored.size, name: key }, slot.kind);
    if (check.ok) changes[slot.column] = key;
    else errors[slot.field] = check.error;
  }
  if (Object.keys(errors).length) return { errors, created };

  const old: string[] = [];
  for (const slot of slots) {
    if (slot.column in changes) {
      if (slot.current) old.push(slot.current); // trocado
    } else if (form.get(`remove_${slot.field}`) === "on" && slot.current) {
      changes[slot.column] = null;
      old.push(slot.current);
    }
  }
  return { changes, created, old };
}

async function isReferenced(key: string): Promise<boolean> {
  const [profiles, projects] = await Promise.all([
    db.profile.count({ where: { photoPath: key } }),
    db.project.count({ where: { imagePath: key } }),
  ]);
  return profiles + projects > 0;
}

// Só apaga o que é nosso; caminhos antigos (/files/...) não estão no armazenamento.
const removeStored = (keys: string[]) => Promise.all(keys.filter(isStoredKey).map(deleteObject));

// Os arquivos antigos só somem depois que o banco aceitou a mudança; se o banco falhar, some o novo.
async function commitUploads(up: { created: string[]; old: string[] }, saveToDb: () => Promise<unknown>) {
  try {
    await saveToDb();
  } catch (e) {
    await removeStored(up.created);
    throw e;
  }
  await removeStored(up.old);
}

// ---------- Actions (todas começam com requireAdmin) ----------

// Pede uma URL de envio direto ao armazenamento. Tipo e tamanho seguem as mesmas regras de sempre.
export async function requestUpload(
  kind: UploadKind,
  contentType: string,
  size: number,
): Promise<{ ok: true; key: string; url: string } | { ok: false; error: string }> {
  await requireAdmin();
  if (kind !== "image" && kind !== "pdf") return { ok: false, error: "Tipo de arquivo não permitido" };
  if (!Number.isInteger(size) || size <= 0) return { ok: false, error: "Arquivo inválido" };
  const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" }[contentType] ?? "x";
  const check = validateUpload({ type: contentType, size, name: `arquivo.${ext}` }, kind);
  if (!check.ok) return { ok: false, error: check.error };
  const key = newKey(kind, contentType);
  return { ok: true, key, url: await presignPut(key, contentType, size) };
}

export async function updateProfile(form: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parse(profileSchema, form);
  const current = await db.profile.findUniqueOrThrow({ where: { id: 1 } });
  const up = await readUploads(form, [
    { field: "photo", column: "photoPath", kind: "image", current: current.photoPath },
  ]);
  // Erros do formulário e dos arquivos aparecem juntos.
  const errors = { ...("errors" in parsed ? parsed.errors : {}), ...("errors" in up ? up.errors : {}) };
  if ("errors" in parsed || "errors" in up) {
    await removeStored(up.created); // o formulário falhou: não deixa arquivo órfão
    return { errors };
  }
  await commitUploads(up, () => db.profile.update({ where: { id: 1 }, data: { ...parsed.data, ...up.changes } }));
  refresh();
  return { ok: true };
}

export async function saveItem(kind: Kind, form: FormData): Promise<FormState> {
  await requireAdmin();
  assertKind(kind);
  const parsed = parse(itemSchemas[kind], form);
  const id = Number(form.get("id"));
  const t = table(kind);

  // Só projetos têm imagem.
  const slots: Slot[] = [];
  if (kind === "project") {
    const current = id ? await db.project.findUnique({ where: { id } }) : null;
    slots.push({ field: "image", column: "imagePath", kind: "image", current: current?.imagePath ?? null });
  }
  const up = await readUploads(form, slots);
  const errors = { ...("errors" in parsed ? parsed.errors : {}), ...("errors" in up ? up.errors : {}) };
  if ("errors" in parsed || "errors" in up) {
    await removeStored(up.created);
    return { errors };
  }

  const data: Record<string, unknown> = { ...parsed.data, ...up.changes };
  if (id) {
    await commitUploads(up, () => t.update({ where: { id }, data }));
  } else {
    // Os ids não são autoincrementais (o seed fixa os valores): próximo = maior + 1, e vai para o fim da lista.
    const rows = await t.findMany({ orderBy: ORDER });
    await commitUploads(up, () =>
      t.create({
        data: {
          ...data,
          id: Math.max(0, ...rows.map((r) => r.id)) + 1,
          order: Math.max(-1, ...rows.map((r) => r.order)) + 1,
        },
      }),
    );
  }
  refresh();
  return { ok: true };
}

export async function deleteItem(kind: Kind, id: number): Promise<void> {
  await requireAdmin();
  const project = kind === "project" ? await db.project.findUnique({ where: { id } }) : null;
  await table(kind).delete({ where: { id } });
  if (project?.imagePath) await removeStored([project.imagePath]); // não deixa a imagem órfã
  refresh();
}

export async function toggleVisible(kind: Kind, id: number): Promise<void> {
  await requireAdmin();
  const t = table(kind);
  const row = await t.findUnique({ where: { id } });
  if (!row) return;
  await t.update({ where: { id }, data: { visible: !row.visible } });
  refresh();
}

export async function move(kind: Kind, id: number, dir: "up" | "down"): Promise<void> {
  await requireAdmin();
  const t = table(kind);
  const reordered = moveItem(await t.findMany({ orderBy: ORDER }), id, dir);
  // Regrava a posição de todos (0, 1, 2...): também conserta empates antigos.
  await db.$transaction(
    reordered.map((row, order) => t.update({ where: { id: row.id }, data: { order } }) as ReturnType<typeof db.project.update>),
  );
  refresh();
}
