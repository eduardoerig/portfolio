import path from "node:path";

// O Prisma CLI lê "file:./x.db" relativo à pasta prisma/; o adaptador libSQL lê relativo ao cwd.
// Normaliza para o mesmo arquivo nos dois casos, assim o .env e os testes não mudam.
export function resolveDbUrl(url: string): string {
  if (!url.startsWith("file:")) return url;
  const file = url.slice("file:".length);
  return path.isAbsolute(file) ? url : `file:${path.join(process.cwd(), "prisma", file)}`;
}
