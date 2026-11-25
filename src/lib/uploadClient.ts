import { requestUpload } from "@/app/(admin)/admin/actions";
import type { UploadKind } from "@/lib/uploadLimits";

type Result = { ok: true; key: string } | { ok: false; error: string };

// Envia um arquivo direto ao armazenamento: o servidor confere a sessão e as regras e devolve uma URL
// de uso único; o arquivo não passa pelo servidor (que tem limite de tamanho por requisição).
export async function uploadFile(file: File, kind: UploadKind, request = requestUpload): Promise<Result> {
  const ticket = await request(kind, file.type, file.size);
  if (!ticket.ok) return ticket;
  try {
    const res = await fetch(ticket.url, { method: "PUT", body: file, headers: { "content-type": file.type } });
    if (!res.ok) return { ok: false, error: "Falha ao enviar o arquivo" };
  } catch {
    return { ok: false, error: "Falha ao enviar o arquivo" }; // rede, CORS ou URL vencida
  }
  return { ok: true, key: ticket.key };
}
