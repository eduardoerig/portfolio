import { randomUUID } from "node:crypto";

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

// Nome novo no armazenamento: <uuid>.<ext>, com a extensão tirada do tipo (nunca do nome enviado).
export function newKey(kind: UploadKind, contentType: string): string {
  return `${randomUUID()}.${RULES[kind].types[contentType][0]}`;
}

export function isStoredKey(s: unknown): s is string {
  return typeof s === "string" && STORED_KEY.test(s);
}

// O servidor confere tudo de novo: tipo, extensão do nome e tamanho (o navegador pode mentir).
export function validateUpload(file: Pick<File, "type" | "size" | "name">, kind: UploadKind): { ok: true } | { ok: false; error: string } {
  const rule = RULES[kind];
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  // hasOwn: um tipo forjado como "__proto__" não pode achar nada na herança do objeto.
  if (!Object.hasOwn(rule.types, file.type) || !rule.types[file.type].includes(ext)) return { ok: false, error: "Tipo de arquivo não permitido" };
  const sizeError = checkFileSize(file, kind);
  if (sizeError) return { ok: false, error: sizeError };
  return { ok: true };
}
