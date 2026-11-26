import { afterEach, describe, expect, it, vi } from "vitest";
import { shrinkImage } from "@/lib/shrinkImage";

const MB = 1024 * 1024;
const fileOf = (size: number, type = "image/jpeg", name = "foto.jpg") => new File([new Uint8Array(size)], name, { type });

// jsdom não desenha: finge o decodificador e o canvas, e confere o tamanho pedido.
function fakeCanvas(width: number, height: number, outSize = 300_000, outType?: string) {
  const close = vi.fn();
  vi.stubGlobal("createImageBitmap", vi.fn(async () => ({ width, height, close })));
  const drawn: number[][] = [];
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ({ drawImage: (_b: unknown, x: number, y: number, w: number, h: number) => drawn.push([x, y, w, h]) }),
    toBlob: (cb: (b: Blob) => void, type: string) => cb(new Blob([new Uint8Array(outSize)], { type: outType ?? type })),
  };
  const real = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation((tag: string) => (tag === "canvas" ? (canvas as never) : real(tag)));
  return { drawn, close };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("shrinkImage", () => {
  it("arquivo pequeno volta igual", async () => {
    const f = fileOf(500_000);
    expect(await shrinkImage(f)).toBe(f);
  });

  it("foto grande de celular vira JPEG de no máximo 2000 px", async () => {
    const { drawn, close } = fakeCanvas(4000, 3000);
    const out = await shrinkImage(fileOf(5 * MB));
    expect(drawn).toEqual([[0, 0, 2000, 1500]]);
    expect(out.type).toBe("image/jpeg");
    expect(out.size).toBe(300_000);
    expect(out.name).toBe("foto.jpg");
    expect(close).toHaveBeenCalled();
  });

  it("PNG vira WebP (mantém a transparência)", async () => {
    fakeCanvas(3000, 3000);
    const out = await shrinkImage(fileOf(4 * MB, "image/png", "logo.png"));
    expect(out.type).toBe("image/webp");
    expect(out.name).toBe("logo.webp");
  });

  it("navegador que não gera WebP (devolve PNG): mantém o original", async () => {
    fakeCanvas(3000, 3000, 300_000, "image/png");
    const f = fileOf(4 * MB, "image/png", "logo.png");
    expect(await shrinkImage(f)).toBe(f);
  });

  it("não consegue ler a imagem: devolve o original (o limite de tamanho avisa)", async () => {
    vi.stubGlobal("createImageBitmap", vi.fn(async () => { throw new Error("formato"); }));
    const f = fileOf(5 * MB);
    expect(await shrinkImage(f)).toBe(f);
  });
});
