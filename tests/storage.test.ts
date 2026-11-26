// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fileUrl } from "@/lib/fileUrl";
import { isStoredKey, newKey } from "@/lib/uploads";

const KEY = "0b1e7f5c-1d2a-4c3b-9e8f-7a6b5c4d3e2f.png";
const R2 = { R2_ACCOUNT_ID: "acc", R2_ACCESS_KEY_ID: "id", R2_SECRET_ACCESS_KEY: "secret", R2_BUCKET: "bucket" };

describe("fileUrl", () => {
  beforeEach(() => vi.stubEnv("NEXT_PUBLIC_FILES_URL", "https://pub.example.r2.dev"));
  afterEach(() => vi.unstubAllEnvs());

  it("monta a URL pública a partir da chave", () => {
    expect(fileUrl(KEY)).toBe(`https://pub.example.r2.dev/${KEY}`);
  });
  it("caminho antigo do disco ou vazio vira null", () => {
    expect(fileUrl("/files/x.png")).toBeNull();
    expect(fileUrl("")).toBeNull();
    expect(fileUrl(null)).toBeNull();
  });
});

describe("chaves", () => {
  it("isStoredKey só aceita <uuid>.<ext permitida>", () => {
    expect(isStoredKey(KEY)).toBe(true);
    expect(isStoredKey("../a.png")).toBe(false);
    expect(isStoredKey(`${KEY}.svg`)).toBe(false);
  });
  it("newKey tira a extensão do tipo", () => {
    const key = newKey("pdf", "application/pdf");
    expect(key.endsWith(".pdf")).toBe(true);
    expect(isStoredKey(key)).toBe(true);
  });
});

describe("storage (R2)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });
  const withR2 = () => Object.entries(R2).forEach(([k, v]) => vi.stubEnv(k, v));

  it("importar sem variáveis não lança; usar lança mensagem clara", async () => {
    Object.keys(R2).forEach((k) => vi.stubEnv(k, ""));
    const storage = await import("@/lib/storage");
    await expect(storage.headObject(KEY)).rejects.toThrow("Armazenamento não configurado");
  });

  it("presignPut assina tipo e tamanho e vale 300 s", async () => {
    withR2();
    const { presignPut } = await import("@/lib/storage");
    const url = new URL(await presignPut(KEY, "image/png", 1234));
    expect(url.hostname).toBe("acc.r2.cloudflarestorage.com");
    expect(url.pathname).toBe(`/bucket/${KEY}`);
    expect(url.searchParams.get("X-Amz-Expires")).toBe("300");
    const signed = url.searchParams.get("X-Amz-SignedHeaders") ?? "";
    expect(signed).toContain("content-length");
    expect(signed).toContain("content-type");
  });

  it("headObject: 404 vira null; 200 devolve tamanho e tipo", async () => {
    withR2();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 200, headers: { "content-length": "1234", "content-type": "image/png" } }));
    vi.stubGlobal("fetch", fetchMock);
    const { headObject } = await import("@/lib/storage");
    expect(await headObject(KEY)).toBeNull();
    expect(await headObject(KEY)).toEqual({ size: 1234, contentType: "image/png" });
    expect(fetchMock.mock.calls[0][0].method ?? fetchMock.mock.calls[0][1]?.method).toBe("HEAD");
  });

  it("listObjects lê chave, tamanho e data de cada arquivo", async () => {
    withR2();
    const xml = `<?xml version="1.0" encoding="UTF-8"?><ListBucketResult><Name>bucket</Name>
      <Contents><Key>${KEY}</Key><LastModified>2026-11-20T10:00:00.000Z</LastModified><Size>1234</Size></Contents>
      <Contents><Key>b.pdf</Key><LastModified>2026-11-25T08:30:00.000Z</LastModified><Size>99</Size></Contents>
      <IsTruncated>false</IsTruncated></ListBucketResult>`;
    const fetchMock = vi.fn().mockResolvedValue(new Response(xml, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { listObjects } = await import("@/lib/storage");
    expect(await listObjects()).toEqual([
      { key: KEY, size: 1234, lastModified: new Date("2026-11-20T10:00:00.000Z") },
      { key: "b.pdf", size: 99, lastModified: new Date("2026-11-25T08:30:00.000Z") },
    ]);
    const req = fetchMock.mock.calls[0][0] as Request;
    expect(new URL(req.url).searchParams.get("list-type")).toBe("2");
  });

  it("deleteObject ignora 404", async () => {
    withR2();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 404 })));
    const { deleteObject } = await import("@/lib/storage");
    await expect(deleteObject(KEY)).resolves.toBeUndefined();
  });
});
