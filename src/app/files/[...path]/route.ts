import { readFile } from "node:fs/promises";
import { CONTENT_TYPES, resolveUpload } from "@/lib/uploads";

// Entrega os arquivos enviados pelo painel (foto, imagens, currículo).
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const file = resolveUpload(path);
  const body = file && (await readFile(file).catch(() => null));
  if (!file || !body) return new Response("Not found", { status: 404 });

  const ext = file.split(".").pop() as string;
  const headers: Record<string, string> = {
    "Content-Type": CONTENT_TYPES[ext],
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "public, max-age=31536000, immutable", // o nome é um UUID: trocar o arquivo muda o endereço
  };
  if (ext === "pdf") headers["Content-Disposition"] = 'inline; filename="curriculo-eduardo-erig.pdf"';
  return new Response(new Uint8Array(body), { headers });
}
