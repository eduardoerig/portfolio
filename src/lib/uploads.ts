import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { STORED_KEY } from "@/lib/fileUrl";
import { checkFileSize, type UploadKind } from "@/lib/uploadLimits";

export type { UploadKind };

// Tipos aceitos por categoria, com as extensões permitidas para cada tipo. SVG fica de fora de propósito (pode carregar script).
const RULES: Record<UploadKind, { types: Record<string, string[]> }> = {
  image: {
    types: { "image/jpeg": ["jpg", "jpeg"], "image/png": ["png"], "image/webp": ["webp"] },
  },
  pdf: { types: { "application/pdf": ["pdf"] } },
};

// Tipo de resposta de cada extensão guardada (usado pela rota /files).
export const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
};

export const UPLOAD_DIR = path.join(process.cwd(), "storage", "uploads");

// Nomes que nós mesmos geramos: UUID + extensão permitida. Qualquer outra coisa não é servida.
const STORED_NAME = /^[0-9a-f-]{36}\.(jpg|jpeg|png|webp|pdf)$/;

// Nome novo no armazenamento: <uuid>.<ext>, com a extensão tirada do tipo (nunca do nome enviado).
export function newKey(kind: UploadKind, contentType: string): string {
  return `${randomUUID()}.${RULES[kind].types[contentType][0]}`;
}

export function isStoredKey(s: unknown): s is string {
  return typeof s === "string" && STORED_KEY.test(s);
}

// O servidor confere tudo de novo: tipo, extensão do nome e tamanho (o navegador pode mentir).
export function validateUpload(file: File, kind: UploadKind): { ok: true } | { ok: false; error: string } {
  const rule = RULES[kind];
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  // hasOwn: um tipo forjado como "__proto__" não pode achar nada na herança do objeto.
  if (!Object.hasOwn(rule.types, file.type) || !rule.types[file.type].includes(ext)) return { ok: false, error: "Tipo de arquivo não permitido" };
  const sizeError = checkFileSize(file, kind);
  if (sizeError) return { ok: false, error: sizeError };
  return { ok: true };
}

// Grava em storage/uploads/<uuid>.<ext> e devolve o caminho público (/files/<uuid>.<ext>).
// Pressupõe validateUpload já aprovado: a extensão vem do tipo, nunca do nome enviado.
export async function saveUpload(file: File, kind: UploadKind): Promise<string> {
  const ext = RULES[kind].types[file.type][0];
  const name = `${randomUUID()}.${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  return `/files/${name}`;
}

// Caminho no disco para os pedaços da URL, ou null se não for um arquivo nosso dentro de storage/uploads.
export function resolveUpload(segments: string[]): string | null {
  if (segments.length !== 1 || !STORED_NAME.test(segments[0])) return null;
  const full = path.resolve(UPLOAD_DIR, segments[0]);
  return full.startsWith(UPLOAD_DIR + path.sep) ? full : null;
}

// Apaga o arquivo de um caminho público. Ignora caminhos estranhos e arquivos que já não existem.
export async function deleteUpload(publicPath: string): Promise<void> {
  const full = resolveUpload(publicPath.replace(/^\/files\//, "").split("/"));
  if (full) await unlink(full).catch(() => {});
}
