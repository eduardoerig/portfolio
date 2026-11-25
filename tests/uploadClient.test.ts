import { afterEach, describe, expect, it, vi } from "vitest";
import { uploadFile } from "@/lib/uploadClient";

const KEY = "0b1e7f5c-1d2a-4c3b-9e8f-7a6b5c4d3e2f.png";
const png = () => new File([new Uint8Array(10)], "foto.png", { type: "image/png" });

afterEach(() => vi.unstubAllGlobals());

describe("uploadFile", () => {
  it("pede a URL e envia o arquivo com o tipo dele", async () => {
    const request = vi.fn().mockResolvedValue({ ok: true, key: KEY, url: "https://r2.test/put" });
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await uploadFile(png(), "image", request)).toEqual({ ok: true, key: KEY });
    expect(request).toHaveBeenCalledWith("image", "image/png", 10);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://r2.test/put");
    expect(init.method).toBe("PUT");
    expect(init.headers["content-type"]).toBe("image/png");
  });

  it("resposta de erro ou falha de rede vira erro, sem lançar", async () => {
    const request = vi.fn().mockResolvedValue({ ok: true, key: KEY, url: "https://r2.test/put" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 403 })));
    expect(await uploadFile(png(), "image", request)).toEqual({ ok: false, error: "Falha ao enviar o arquivo" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("CORS")));
    expect(await uploadFile(png(), "image", request)).toEqual({ ok: false, error: "Falha ao enviar o arquivo" });
  });

  it("recusa do servidor chega como erro", async () => {
    const request = vi.fn().mockResolvedValue({ ok: false, error: "Tipo de arquivo não permitido" });
    expect(await uploadFile(png(), "image", request)).toEqual({ ok: false, error: "Tipo de arquivo não permitido" });
  });
});
