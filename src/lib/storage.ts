// Acesso ao bucket R2 (API compatível com S3). Só servidor: usa as chaves secretas.
// Os clientes nascem no primeiro uso, então o build roda sem as variáveis.
import { AwsClient } from "aws4fetch";

const EXPIRES_SECONDS = 300;

function config() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) throw new Error("Armazenamento não configurado");
  return {
    client: new AwsClient({ accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY, service: "s3", region: "auto" }),
    base: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}`,
  };
}

// URL de envio (PUT) que vale 5 min. Tipo e tamanho entram na assinatura: o R2 recusa qualquer outro.
export async function presignPut(key: string, contentType: string, size: number): Promise<string> {
  const { client, base } = config();
  const req = await client.sign(`${base}/${key}?X-Amz-Expires=${EXPIRES_SECONDS}`, {
    method: "PUT",
    headers: { "content-type": contentType, "content-length": String(size) },
    aws: { signQuery: true, allHeaders: true },
  });
  return req.url;
}

// Tamanho e tipo do objeto guardado, ou null se ele não existe.
export async function headObject(key: string): Promise<{ size: number; contentType: string } | null> {
  const { client, base } = config();
  const res = await client.fetch(`${base}/${key}`, { method: "HEAD" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Falha ao consultar o arquivo (${res.status})`);
  return { size: Number(res.headers.get("content-length")), contentType: res.headers.get("content-type") ?? "" };
}

// Apaga o objeto. Já não existir não é erro.
export async function deleteObject(key: string): Promise<void> {
  const { client, base } = config();
  const res = await client.fetch(`${base}/${key}`, { method: "DELETE" });
  if (!res.ok && res.status !== 404) throw new Error(`Falha ao apagar o arquivo (${res.status})`);
}

export type StoredObject = { key: string; size: number; lastModified: Date };

// Lista os arquivos do bucket (ListObjectsV2).
// shortcut: lê só a primeira página (1000 arquivos); paginar com continuation-token se um dia passar disso.
export async function listObjects(): Promise<StoredObject[]> {
  const { client, base } = config();
  const res = await client.fetch(`${base}?list-type=2`);
  if (!res.ok) throw new Error(`Falha ao listar os arquivos (${res.status})`);
  const xml = await res.text();
  const tag = (block: string, name: string) => block.match(new RegExp(`<${name}>([^<]*)</${name}>`))?.[1] ?? "";
  return [...xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)].map(([, b]) => ({
    key: tag(b, "Key"),
    size: Number(tag(b, "Size")),
    lastModified: new Date(tag(b, "LastModified")),
  }));
}
