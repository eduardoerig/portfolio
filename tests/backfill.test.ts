// @vitest-environment node
import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Banco próprio (outro arquivo, para rodar em paralelo com os outros testes).
process.env.DATABASE_URL = "file:./test-backfill.db";

type Db = typeof import("@/lib/db").db;
let db: Db;
let backfill: typeof import("../prisma/backfill-skill-level").backfillSkillLevel;

beforeAll(async () => {
  rmSync("prisma/test-backfill.db", { force: true });
  execSync("npx prisma db push --skip-generate", { stdio: "pipe", env: process.env });
  execSync("npx prisma db seed", { stdio: "pipe", env: process.env });
  db = (await import("@/lib/db")).db;
  backfill = (await import("../prisma/backfill-skill-level")).backfillSkillLevel;
}, 60_000);

afterAll(() => db?.$disconnect());

describe("backfillSkillLevel", () => {
  it("migra um banco antigo e, ao rodar de novo, não desfaz o que o painel limpou", async () => {
    // Simula o banco de antes: só a coluna learning, sem level nem nameEn.
    await db.skill.updateMany({ data: { level: null, nameEn: null } });
    await db.skill.updateMany({ where: { name: { in: ["React", "Next.js", "TypeScript"] } }, data: { learning: true } });

    await backfill(db);
    const php = () => db.skill.findFirstOrThrow({ where: { name: "PHP" } });
    expect((await php()).level).toBe("intermediate");
    expect((await php()).nameEn).toBe("PHP");
    expect((await db.skill.findFirstOrThrow({ where: { name: "React" } })).level).toBe("learning");
    expect((await db.skill.findFirstOrThrow({ where: { name: "APIs REST" } })).nameEn).toBe("REST APIs");

    // O painel limpa o nível e o nome em inglês; rodar de novo não pode restaurar.
    await db.skill.update({ where: { id: (await php()).id }, data: { level: null, nameEn: null } });
    await backfill(db);
    expect((await php()).level).toBeNull();
    expect((await php()).nameEn).toBeNull();
  });
});
