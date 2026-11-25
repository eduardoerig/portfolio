// @vitest-environment node
import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Banco próprio (outro arquivo, para rodar em paralelo com os outros testes).
process.env.DATABASE_URL = "file:./test-backfill-stack.db";

type Db = typeof import("@/lib/db").db;
let db: Db;
let backfill: typeof import("../prisma/backfill-stack-en").backfillStackEn;

beforeAll(async () => {
  rmSync("prisma/test-backfill-stack.db", { force: true });
  execSync("npx prisma db push --skip-generate", { stdio: "pipe", env: process.env });
  execSync("npx prisma db seed", { stdio: "pipe", env: process.env });
  db = (await import("@/lib/db")).db;
  backfill = (await import("../prisma/backfill-stack-en")).backfillStackEn;
}, 60_000);

afterAll(() => db?.$disconnect());

describe("backfillStackEn", () => {
  it("preenche só onde stackEn é null e não sobrescreve o que já existe", async () => {
    await db.project.updateMany({ data: { stackEn: null } }); // banco de antes da coluna
    await db.project.update({ where: { id: 1 }, data: { stackEn: '["Editado"]' } });

    await backfill(db);
    const stack = async (id: number) => (await db.project.findUniqueOrThrow({ where: { id } })).stackEn;
    expect(await stack(3)).toBe('["n8n","AI agents","Cloudflare Workers"]');
    expect(await stack(1)).toBe('["Editado"]');

    expect(await backfill(db)).toContain("em 0 projeto"); // rodar de novo não faz nada
  });
});
