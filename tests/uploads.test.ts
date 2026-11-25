// @vitest-environment node
import { describe, expect, it } from "vitest";
import { checkFileSize, fileErrors } from "@/lib/uploadLimits";
import { validateUpload } from "@/lib/uploads";

const MB = 1024 * 1024;
const file = (name: string, type: string, size: number) => new File([new Uint8Array(size)], name, { type });
const TYPE_ERROR = "Tipo de arquivo não permitido";
const SIZE_ERROR = "Arquivo maior que o limite";

describe("validateUpload", () => {
  it("aceita PNG de 100 KB como imagem", () => {
    expect(validateUpload(file("foto.png", "image/png", 100 * 1024), "image")).toEqual({ ok: true });
  });
  it("recusa .exe como imagem", () => {
    expect(validateUpload(file("a.exe", "application/octet-stream", 10), "image")).toEqual({ ok: false, error: TYPE_ERROR });
  });
  it("recusa PNG como pdf", () => {
    expect(validateUpload(file("foto.png", "image/png", 10), "pdf")).toEqual({ ok: false, error: TYPE_ERROR });
  });
  it("recusa SVG", () => {
    expect(validateUpload(file("a.svg", "image/svg+xml", 10), "image")).toEqual({ ok: false, error: TYPE_ERROR });
  });
  it("tipo forjado como __proto__ vira erro de validação, não TypeError", () => {
    expect(validateUpload(file("a.png", "__proto__", 10), "image")).toEqual({ ok: false, error: TYPE_ERROR });
  });
  it("recusa extensão que não bate com o tipo", () => {
    expect(validateUpload(file("foto.exe", "image/png", 10), "image")).toEqual({ ok: false, error: TYPE_ERROR });
  });
  it("recusa imagem de 4 MB e PDF de 6 MB, aceita PDF de 5 MB", () => {
    expect(validateUpload(file("a.png", "image/png", 4 * MB), "image")).toEqual({ ok: false, error: SIZE_ERROR });
    expect(validateUpload(file("a.pdf", "application/pdf", 6 * MB), "pdf")).toEqual({ ok: false, error: SIZE_ERROR });
    expect(validateUpload(file("a.pdf", "application/pdf", 5 * MB), "pdf")).toEqual({ ok: true });
  });
});

describe("limites no navegador", () => {
  it("checkFileSize devolve o mesmo erro do servidor para arquivos grandes", () => {
    expect(checkFileSize(file("a.png", "image/png", 4 * MB), "image")).toBe(SIZE_ERROR);
    expect(checkFileSize(file("a.pdf", "application/pdf", 6 * MB), "pdf")).toBe(SIZE_ERROR);
    expect(checkFileSize(file("a.pdf", "application/pdf", 5 * MB), "pdf")).toBeNull();
  });
  it("fileErrors aponta só os campos grandes demais", () => {
    const data = new FormData();
    data.set("photo", file("a.png", "image/png", 4 * MB));
    data.set("cv", file("a.pdf", "application/pdf", 1));
    expect(fileErrors(data, { photo: "image", cv: "pdf" })).toEqual({ photo: SIZE_ERROR });
  });
});
