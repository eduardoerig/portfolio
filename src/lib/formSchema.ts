import { z } from "zod";
import type { EditorKind } from "@/lib/adminDraft";
import { allFields, type FieldDef } from "@/lib/formModel";

// Validação gerada do modelo (formModel). Roda no servidor (actions) e no navegador (ao sair do campo).
// Todos os campos chegam como texto (FormData); checkbox desmarcado simplesmente não vem.

const REQUIRED = "Campo obrigatório";
export const URL_ERROR = "Link inválido: comece com https://";
const tooLong = (max: number) => `Até ${max} caracteres`;

// Só http/https: o z.url() sozinho aceita "javascript:", que viraria XSS num <a href>.
export const isHttpUrl = (v: string) => z.url({ protocol: /^https?$/ }).safeParse(v).success;

// Textarea "um por linha" -> array limpo (sem linhas vazias) guardado como JSON.
const toLines = (v: string) => v.split("\n").map((l) => l.trim()).filter(Boolean);
const list = z.string().optional().transform((v) => JSON.stringify(toLines(v ?? "")));
const listEn = z.string().optional().transform((v) => {
  const lines = toLines(v ?? "");
  return lines.length ? JSON.stringify(lines) : null; // vazio = cai no português
});
const checkbox = z.string().optional().transform((v) => v === "on");

function required(f: FieldDef) {
  let s = z.string().trim().min(1, REQUIRED);
  if (f.max) s = s.max(f.max, tooLong(f.max));
  if (f.type === "email") return s.email("E-mail inválido");
  if (f.type === "url") return s.refine(isHttpUrl, URL_ERROR);
  return s;
}

function optional(f: FieldDef) {
  const s = z.string().optional().transform((v) => v?.trim() || null);
  const max = f.max;
  const capped = max ? s.refine((v) => v === null || v.length <= max, tooLong(max)) : s;
  return f.type === "url" ? capped.refine((v) => v === null || isHttpUrl(v), URL_ERROR) : capped;
}

function select(f: FieldDef) {
  if (f.numeric) {
    const { min, max, message } = f.numeric;
    return z.coerce.number().int(message).min(min, message).max(max, message);
  }
  const values = (f.options ?? []).map(([v]) => v).filter(Boolean) as [string, ...string[]];
  const pick = z.enum(values, f.invalid ?? "Valor inválido");
  return f.nullable
    ? z.string().optional().transform((v) => v || null).pipe(pick.nullable())
    : z.string().pipe(pick);
}

// Um campo do modelo -> as chaves do zod (o par En dos traduzíveis é sempre opcional).
function entries(f: FieldDef): [string, z.ZodType][] {
  switch (f.type) {
    case "image":
      return []; // vem pela chave do armazenamento, conferida em readUploads
    case "switch":
      return [[f.name, checkbox]];
    case "select":
      return [[f.name, select(f)]];
    case "tags":
    case "lines":
      return f.i18n ? [[f.name, list], [`${f.name}En`, listEn]] : [[f.name, list]];
    default: {
      const pt = f.required ? required(f) : optional(f);
      return f.i18n ? [[f.name, pt], [`${f.name}En`, optional({ ...f, required: false })]] : [[f.name, pt]];
    }
  }
}

const cache = new Map<EditorKind, z.ZodObject>();
export function schemaFor(kind: EditorKind): z.ZodObject {
  let s = cache.get(kind);
  if (!s) {
    s = z.object(Object.fromEntries(allFields(kind).flatMap(entries)));
    cache.set(kind, s);
  }
  return s;
}

// Primeiro erro de cada campo, em português, para mostrar ao lado dele.
export function parseForm<T extends z.ZodType>(
  schema: T,
  values: Record<string, unknown>,
): { data: z.output<T> } | { errors: Record<string, string> } {
  const result = schema.safeParse(values);
  if (result.success) return { data: result.data };
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) errors[String(issue.path[0])] ??= issue.message;
  return { errors };
}
