// @vitest-environment node
import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import { extractText, getDocumentProxy } from "unpdf";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Locale } from "@/i18n/locales";

// Banco separado só para estes testes (nunca toca no dev.db).
process.env.DATABASE_URL = "file:./test-cv.db";

type Render = typeof import("@/cv/render");
type Data = typeof import("@/cv/data");
let render: Render;
let data: Data;
let disconnect: () => Promise<void>;

const run = (cmd: string) => execSync(cmd, { stdio: "pipe", env: process.env });

beforeAll(async () => {
  rmSync("prisma/test-cv.db", { force: true });
  run("npx prisma db push --skip-generate");
  run("npx prisma db seed");
  render = await import("@/cv/render");
  data = await import("@/cv/data");
  const { db } = await import("@/lib/db");
  disconnect = () => db.$disconnect();
}, 120_000);

afterAll(() => disconnect?.());

const pdfText = async (bytes: Uint8Array) => {
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  return { text: text.replace(/\s+/g, " "), pages: pdf.numPages };
};
const get = async (locale: Locale, url: string) => {
  const res = await render.resumeResponse(locale, new Request(url));
  return { res, bytes: new Uint8Array(await res.arrayBuffer()) };
};

describe("resumeResponse", () => {
  it("responde um PDF sem cache, com o nome do arquivo", async () => {
    const { res, bytes } = await get("pt", "http://x/curriculo.pdf");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(res.headers.get("content-disposition")).toContain('filename="CV_Eduardo_Erig_PT.pdf"');
    expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe("%PDF");
  }, 30_000);

  it("?modelo=simples muda o nome do arquivo", async () => {
    const { res } = await get("en", "http://x/en/resume.pdf?modelo=simples");
    expect(res.headers.get("content-disposition")).toContain('filename="CV_Eduardo_Erig_EN_simples.pdf"');
  }, 30_000);

  for (const locale of ["pt", "en"] as const) {
    for (const simple of [false, true]) {
      it(`texto selecionável: ${locale} ${simple ? "simples" : "visual"}`, async () => {
        const resume = await data.getResume(locale);
        const { text } = await pdfText(new Uint8Array(await render.renderResume(resume, simple)));
        expect(text).toContain(resume.cv.fullName);
        expect(text).toContain(resume.experiences[0].role);
        expect(text).toContain(resume.projects[0].title);
        expect(text).toContain(resume.cv.languages[0].name);
        if (locale === "pt") expect(text).toContain("manutenção"); // acento e cedilha saem certos
        if (simple) expect(text).toContain(locale === "pt" ? "COMPETÊNCIAS" : "SKILLS"); // títulos em maiúsculas, como no PDF original
      }, 30_000);
    }
  }

  it("muitos projetos passam para a página 2 sem sumir", async () => {
    const resume = await data.getResume("pt");
    const projects = Array.from({ length: 8 }, (_, i) => ({ ...resume.projects[0], id: 100 + i, title: `Projeto extra ${i + 1}` }));
    const { text, pages } = await pdfText(new Uint8Array(await render.renderResume({ ...resume, projects }, false)));
    expect(pages).toBeGreaterThanOrEqual(2);
    expect(text).toContain("Projeto extra 8");
  }, 30_000);

  // Várias quantidades: a sobra no fim da página muda com o conteúdo.
  it("páginas seguintes têm margem no topo e nenhuma página sai em branco", async () => {
    const resume = await data.getResume("pt");
    for (const [nExp, nProj] of [[7, 4], [3, 12], [8, 20]]) {
      const experiences = Array.from({ length: nExp }, (_, i) => ({ ...resume.experiences[0], id: 200 + i, role: `Cargo ${i + 1}` }));
      const projects = Array.from({ length: nProj }, (_, i) => ({ ...resume.projects[0], id: 100 + i, title: `Projeto ${i + 1}` }));
      const pdf = await getDocumentProxy(new Uint8Array(await render.renderResume({ ...resume, experiences, projects }, false)));
      for (let n = 1; n <= pdf.numPages; n++) {
        const page = await pdf.getPage(n);
        const height = page.view[3];
        const ys = (await page.getTextContent()).items.flatMap((it) => ("transform" in it && it.str.trim() ? [it.transform[5]] : []));
        expect(ys.length, `página ${n} de ${nExp}/${nProj} sem texto`).toBeGreaterThan(0);
        expect(Math.max(...ys), `página ${n} de ${nExp}/${nProj} colada no topo`).toBeLessThan(height - 24);
      }
    }
  }, 60_000);
});
