// @vitest-environment node
import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Banco separado só para os testes (nunca toca no dev.db).
process.env.DATABASE_URL = "file:./test.db";

type Db = typeof import("@/lib/db").db;
type GetPortfolio = typeof import("@/lib/portfolio").getPortfolio;
let db: Db;
let getPortfolio: GetPortfolio;

const run = (cmd: string) => execSync(cmd, { stdio: "pipe", env: process.env });

beforeAll(async () => {
  // Apaga o arquivo em vez de usar --force-reset (o Prisma bloqueia reset quando chamado por IA).
  rmSync("prisma/test.db", { force: true });
  run("npx prisma db push --skip-generate");
  run("npx prisma db seed");
  db = (await import("@/lib/db")).db;
  getPortfolio = (await import("@/lib/portfolio")).getPortfolio;
}, 60_000);

afterAll(() => db?.$disconnect());

describe("getPortfolio", () => {
  it("devolve os 4 projetos na ordem do seed", async () => {
    const { projects } = await getPortfolio("pt");
    expect(projects.map((p) => p.title)).toEqual([
      "Requests",
      "Dolce Delícias",
      "Automação do Instagram",
      "Gestão de Serviços de Topografia",
    ]);
    expect(projects[0].stack).toEqual(["PHP", "JavaScript", "MySQL"]);
  });

  it("chave guardada vira URL pública; caminho antigo vira null", async () => {
    process.env.NEXT_PUBLIC_FILES_URL = "https://pub.test";
    await db.profile.update({ where: { id: 1 }, data: { photoPath: "0b1e7f5c-1d2a-4c3b-9e8f-7a6b5c4d3e2f.png" } });
    const { profile } = await getPortfolio("pt");
    expect(profile.photoPath).toBe("https://pub.test/0b1e7f5c-1d2a-4c3b-9e8f-7a6b5c4d3e2f.png");
    await db.profile.update({ where: { id: 1 }, data: { photoPath: null } });
  });

  it("esconde itens com visible = false", async () => {
    await db.project.update({ where: { id: 2 }, data: { visible: false } });
    expect((await getPortfolio("pt")).projects).toHaveLength(3);
    await db.project.update({ where: { id: 2 }, data: { visible: true } });
  });

  it("marca React, Next.js e TypeScript como em aprendizado", async () => {
    const { skills } = await getPortfolio("pt");
    const learning = skills.filter((s) => s.level === "learning").map((s) => s.name);
    expect(learning).toEqual(["React", "Next.js", "TypeScript"]);
  });

  it("marca PHP, Node.js e APIs REST como intermediário", async () => {
    const { skills } = await getPortfolio("pt");
    const intermediate = skills.filter((s) => s.level === "intermediate").map((s) => s.name);
    expect(intermediate).toEqual(["PHP", "Node.js", "APIs REST"]);
  });

  it("em inglês usa o nome da competência em inglês e cai no português sem nameEn", async () => {
    const rest = async () => (await getPortfolio("en")).skills.find((s) => s.id === 10)?.name;
    expect(await rest()).toBe("REST APIs");
    await db.skill.update({ where: { id: 10 }, data: { nameEn: null } });
    expect(await rest()).toBe("APIs REST");
    await db.skill.update({ where: { id: 10 }, data: { nameEn: "REST APIs" } });
  });

  it("em inglês usa a stack em inglês e cai no português sem stackEn", async () => {
    const stack = async () => (await getPortfolio("en")).projects.find((p) => p.id === 3)?.stack;
    expect(await stack()).toEqual(["n8n", "AI agents", "Cloudflare Workers"]);
    await db.project.update({ where: { id: 3 }, data: { stackEn: null } });
    expect(await stack()).toEqual(["n8n", "Agentes de IA", "Cloudflare Workers"]);
    await db.project.update({ where: { id: 3 }, data: { stackEn: '["n8n","AI agents","Cloudflare Workers"]' } });
  });

  it("em inglês usa os campos En", async () => {
    const pt = await getPortfolio("pt");
    const en = await getPortfolio("en");
    expect(en.profile.summary).not.toBe(pt.profile.summary);
    expect(en.experiences[0].bullets.length).toBeGreaterThan(0);
  });

  it("em inglês cai no português quando summaryEn é null", async () => {
    await db.profile.update({ where: { id: 1 }, data: { summaryEn: null } });
    const pt = await getPortfolio("pt");
    const en = await getPortfolio("en");
    expect(en.profile.summary).toBe(pt.profile.summary);
  });

  it("stack malformado vira lista vazia e a página ainda carrega", async () => {
    await db.project.update({ where: { id: 1 }, data: { stack: "{quebrado" } });
    const { projects } = await getPortfolio("pt");
    expect(projects[0].stack).toEqual([]);
    expect(projects).toHaveLength(4);
    await db.project.update({ where: { id: 1 }, data: { stack: '["PHP","JavaScript","MySQL"]' } });
  });

  it("rodar o seed de novo não sobrescreve edições nem recria itens apagados", async () => {
    await db.profile.update({ where: { id: 1 }, data: { summary: "Resumo editado" } });
    await db.project.delete({ where: { id: 4 } });
    run("npx prisma db seed");
    const { profile, projects } = await getPortfolio("pt");
    expect(profile.summary).toBe("Resumo editado");
    expect(projects.map((p) => p.id)).not.toContain(4);
  }, 30_000); // roda `npx prisma db seed` de verdade: passa de 5 s com a suíte inteira em paralelo
});
