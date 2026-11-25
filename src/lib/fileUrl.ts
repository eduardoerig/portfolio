// Formato das chaves que nós mesmos geramos: UUID + extensão permitida. Nada mais vai para *Path.
export const STORED_KEY = /^[0-9a-f-]{36}\.(jpg|jpeg|png|webp|pdf)$/;

// URL pública de um arquivo guardado. Roda no servidor e no navegador (variável NEXT_PUBLIC_).
// O banco guarda só a chave: trocar de endereço (ex.: domínio próprio) é mudar uma variável.
export function fileUrl(key: string | null | undefined): string | null {
  if (!key || !STORED_KEY.test(key)) return null;
  return `${process.env.NEXT_PUBLIC_FILES_URL}/${key}`;
}
