// Limites de upload sem nada de Node: o servidor (uploads.ts) e os formulários do navegador usam os mesmos números.
export type UploadKind = "image" | "pdf";

const MB = 1024 * 1024;
export const MAX_BYTES: Record<UploadKind, number> = { image: 3 * MB, pdf: 5 * MB };
export const SIZE_ERROR = "Arquivo maior que o limite";

// Devolve a mensagem de erro se o arquivo passa do limite, senão null.
export function checkFileSize(file: { size: number }, kind: UploadKind): string | null {
  return file.size > MAX_BYTES[kind] ? SIZE_ERROR : null;
}

// Confere os campos de arquivo de um FormData antes de enviar (campo -> tipo). Devolve erros por campo.
export function fileErrors(data: FormData, fields: Record<string, UploadKind>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [name, kind] of Object.entries(fields)) {
    const file = data.get(name);
    const error = file instanceof File ? checkFileSize(file, kind) : null;
    if (error) errors[name] = error;
  }
  return errors;
}
