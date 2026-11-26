"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { TITLE_KEY } from "@/lib/itemTitle";
import { moveItem } from "@/lib/reorder";
import { assertKind, ORDER, table, type Kind } from "@/lib/tables";
import { deleteObject, headObject, listObjects, presignPut } from "@/lib/storage";
import { isStoredKey, newKey, validateUpload, type UploadKind } from "@/lib/uploads";

// Resultado dos formulários: erros por campo, em português, para mostrar ao lado do campo.
export type FormState = { ok?: boolean; errors?: Record<string, string>; unauthorized?: true };

// Gravar do editor: sessão vencida volta como resposta (o painel avisa e guarda o texto) em vez de erro.
const authorized = () => requireAdmin().then(() => true, () => false);

// ---------- Validação (zod) ----------
// Todos os campos chegam do FormData como texto; checkbox desmarcado simplesmente não vem.

// O erro aparece embaixo do próprio campo: repetir o nome dele só alonga a mensagem.
const required = z.string().trim().min(1, "Campo obrigatório");
const optional = z.string().optional().transform((v) => v?.trim() || null);
const checkbox = z.string().optional().transform((v) => v === "on");
// Select do formulário: vazio = sem rótulo (null); qualquer outro valor fora da lista é rejeitado.
const level = z.string().optional().transform((v) => v || null)
  .pipe(z.enum(["learning", "intermediate"], "Nível inválido").nullable());
const email = z.string().trim().email("E-mail inválido");
// Só http/https: o z.url() sozinho aceita "javascript:", que viraria XSS num <a href>.
const isHttpUrl = (v: string) => z.url({ protocol: /^https?$/ }).safeParse(v).success;
const URL_ERROR = "Link inválido: comece com https://";
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
  name: required,
  role: required,
  roleEn: optional,
  summary: required,
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
    title: required,
    titleEn: optional,
    description: required,
    descriptionEn: optional,
    stack: list,
    stackEn: listEn,
    url: optionalUrl,
    metric: optional,
    metricEn: optional,
    visible: checkbox,
  }),
  experience: z.object({
    role: required,
    roleEn: optional,
    company: required,
    location: required,
    locationEn: optional,
    period: required,
    periodEn: optional,
    bullets: list,
    bulletsEn: listEn,
    current: checkbox,
    visible: checkbox,
  }),
  skill: z.object({
    name: required,
    nameEn: optional,
    group: required,
    groupEn: optional,
    level,
    visible: checkbox,
  }),
  education: z.object({
    course: required,
    courseEn: optional,
    school: required,
    period: required,
    periodEn: optional,
    note: optional,
    noteEn: optional,
    visible: checkbox,
  }),
  language: z.object({
    name: required,
    nameEn: optional,
    level: required,
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
type UploadResult = { errors: Record<string, string>; created: string[] } | { changes: Record<string, string | null>; created: string[] };

// Confere cada chave enviada. Marcar "remover" (remove_<campo>) limpa o campo.
async function readUploads(form: FormData, slots: Slot[]): Promise<UploadResult> {
  const errors: Record<string, string> = {};
  // Só o que foi recusado (tipo/tamanho) é apagado. Chave válida nunca: pode ser a imagem antiga que o Desfazer
  // reanexou; se o salvamento falhar, a limpeza de arquivos não usados apaga depois de 24 h.
  const created: string[] = [];
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
    // Mesmas regras de antes, agora sobre o que de fato está guardado.
    const check = validateUpload({ type: stored.contentType, size: stored.size, name: key }, slot.kind);
    if (check.ok) changes[slot.column] = key;
    else {
      errors[slot.field] = check.error;
      created.push(key);
    }
  }
  if (Object.keys(errors).length) return { errors, created };

  for (const slot of slots) {
    if (!(slot.column in changes) && form.get(`remove_${slot.field}`) === "on" && slot.current) changes[slot.column] = null;
  }
  return { changes, created };
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

const DAY_MS = 24 * 60 * 60 * 1000;

// Apaga do armazenamento o que nenhum registro usa. Só mexe em arquivo com mais de 24 h:
// um envio recém-feito pode estar esperando o formulário ser salvo.
// apply=false só conta (o painel mostra antes o que vai sair); true apaga.
export async function cleanStorage(apply: boolean): Promise<{ removed: number; freedBytes: number; totalBytes: number }> {
  await requireAdmin();
  const [objects, profile, projects] = await Promise.all([
    listObjects(),
    db.profile.findUnique({ where: { id: 1 }, select: { photoPath: true } }),
    db.project.findMany({ select: { imagePath: true } }),
  ]);
  const used = new Set([profile?.photoPath, ...projects.map((p) => p.imagePath)]);
  const cutoff = Date.now() - DAY_MS;
  const loose = objects.filter((o) => isStoredKey(o.key) && !used.has(o.key) && o.lastModified.getTime() < cutoff);
  if (apply === true) await removeStored(loose.map((o) => o.key));
  const freedBytes = loose.reduce((n, o) => n + o.size, 0);
  const totalBytes = objects.reduce((n, o) => n + o.size, 0) - freedBytes;
  return { removed: loose.length, freedBytes, totalBytes };
}

export async function updateProfile(form: FormData): Promise<FormState> {
  if (!(await authorized())) return { unauthorized: true };
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
  await db.profile.update({ where: { id: 1 }, data: { ...parsed.data, ...up.changes } });
  refresh();
  return { ok: true };
}

export async function saveItem(kind: Kind, form: FormData): Promise<FormState> {
  if (!(await authorized())) return { unauthorized: true };
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
    await t.update({ where: { id }, data });
  } else {
    // Os ids não são autoincrementais (o seed fixa os valores): próximo = maior + 1, e vai para o fim da lista.
    const rows = await t.findMany({ orderBy: ORDER });
    await t.create({
      data: {
        ...data,
        id: Math.max(0, ...rows.map((r) => r.id)) + 1,
        order: Math.max(-1, ...rows.map((r) => r.order)) + 1,
      },
    });
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

// Cópia oculta no fim da lista, para cadastrar itens parecidos sem redigitar PT e EN.
// Sem a imagem: excluir um dos dois apagaria o arquivo que o outro usa.
export async function duplicateItem(kind: Kind, id: number): Promise<void> {
  await requireAdmin();
  const t = table(kind);
  const row = await t.findUnique({ where: { id } });
  if (!row) throw new Error("Item não encontrado");
  const rows = await t.findMany({ orderBy: ORDER });
  const key = TITLE_KEY[kind];
  const data: Record<string, unknown> = {
    ...row,
    [key]: `${String(row[key] ?? "")} (cópia)`,
    visible: false,
    id: Math.max(0, ...rows.map((r) => r.id)) + 1,
    order: Math.max(-1, ...rows.map((r) => r.order)) + 1,
  };
  if (kind === "project") data.imagePath = null;
  await t.create({ data });
  refresh();
}

// Backup do conteúdo do painel (o banco remoto não faz backup sozinho). Fica fora: tentativas de login.
export async function exportContent() {
  await requireAdmin();
  const [profile, projects, experiences, skills, education, languages] = await Promise.all([
    db.profile.findUnique({ where: { id: 1 } }),
    db.project.findMany({ orderBy: ORDER }),
    db.experience.findMany({ orderBy: ORDER }),
    db.skill.findMany({ orderBy: ORDER }),
    db.education.findMany({ orderBy: ORDER }),
    db.language.findMany({ orderBy: ORDER }),
  ]);
  return { version: 1 as const, exportedAt: new Date().toISOString(), profile, projects, experiences, skills, education, languages };
}

export type LinkCheck = { label: string; url: string; state: "ok" | "broken" | "unknown"; status: number | null };

// 401/403/429/999: o site recusa robôs (o LinkedIn sempre); não quer dizer que o link está quebrado.
const BLOCKED = new Set([401, 403, 429, 999]);

async function probe(url: string): Promise<Pick<LinkCheck, "state" | "status">> {
  try {
    const opts = { redirect: "follow" as const, signal: AbortSignal.timeout(8000) };
    let res = await fetch(url, { ...opts, method: "HEAD" });
    if (res.status === 405 || res.status === 501) res = await fetch(url, { ...opts, method: "GET" });
    if (BLOCKED.has(res.status)) return { state: "unknown", status: res.status };
    return { state: res.status < 400 ? "ok" : "broken", status: res.status };
  } catch {
    return { state: "broken", status: null }; // fora do ar, domínio inexistente ou demorou mais de 8 s
  }
}

// Confere os links que aparecem no site (projetos, GitHub, LinkedIn). Só endereços já validados como http(s).
export async function checkLinks(): Promise<LinkCheck[]> {
  await requireAdmin();
  const [profile, projects] = await Promise.all([
    db.profile.findUnique({ where: { id: 1 }, select: { githubUrl: true, linkedinUrl: true } }),
    db.project.findMany({ orderBy: ORDER, select: { title: true, url: true } }),
  ]);
  const targets = [
    ...(profile ? [{ label: "GitHub", url: profile.githubUrl }, { label: "LinkedIn", url: profile.linkedinUrl }] : []),
    ...projects.flatMap((p) => (p.url ? [{ label: p.title, url: p.url }] : [])),
  ].filter((t, i, all) => all.findIndex((o) => o.url === t.url) === i);
  return Promise.all(targets.map(async (t) => ({ ...t, ...(await probe(t.url)) })));
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
