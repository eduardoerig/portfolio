// @vitest-environment node
import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { copyDatabase } from "../scripts/db-copy";
import { resolveDbUrl } from "@/lib/dbUrl";

// Dois bancos só destes testes: a origem recebe schema + seed; o destino, só o schema.
const SRC = "file:./test-copy-src.db";
const DST = "file:./test-copy-dst.db";
const push = (url: string, seed = false) => {
  const env = { ...process.env, DATABASE_URL: url };
  execSync("npx prisma db push --skip-generate", { stdio: "pipe", env });
  if (seed) execSync("npx prisma db seed", { stdio: "pipe", env });
};
const opened: ReturnType<typeof createClient>[] = [];
const sql = (url: string) => {
  const c = createClient({ url: resolveDbUrl(url) });
  opened.push(c);
  return c;
};

beforeAll(() => {
  for (const f of ["test-copy-src.db", "test-copy-dst.db"]) rmSync(path.join("prisma", f), { force: true });
  push(SRC, true);
  push(DST);
}, 120_000);

afterAll(() => {
  opened.forEach((c) => c.close()); // no Windows, arquivo aberto não pode ser apagado
  for (const f of ["test-copy-src.db", "test-copy-dst.db"]) rmSync(path.join("prisma", f), { force: true });
});

describe("resolveDbUrl", () => {
  it("file: relativo aponta para a pasta prisma, como o Prisma CLI faz", () => {
    expect(resolveDbUrl("file:./dev.db")).toBe(`file:${path.join(process.cwd(), "prisma", "dev.db")}`);
  });
  it("URL remota passa direto", () => {
    expect(resolveDbUrl("libsql://x.turso.io")).toBe("libsql://x.turso.io");
  });
});

describe("copyDatabase", () => {
  it("copia tudo e limpa caminhos /files/ só no destino", async () => {
    await sql(SRC).execute("UPDATE Profile SET photoPath = '/files/x.png' WHERE id = 1");
    const counts = await copyDatabase({ url: SRC }, { url: DST }, {});
    expect(counts.Project).toBe(4);
    expect(counts.Profile).toBe(1);

    const dst = await sql(DST).execute("SELECT photoPath FROM Profile WHERE id = 1");
    expect(dst.rows[0].photoPath).toBeNull();
    const src = await sql(SRC).execute("SELECT photoPath FROM Profile WHERE id = 1");
    expect(src.rows[0].photoPath).toBe("/files/x.png");
    const skills = await sql(DST).execute("SELECT count(*) AS n FROM Skill");
    const srcSkills = await sql(SRC).execute("SELECT count(*) AS n FROM Skill");
    expect(skills.rows[0].n).toBe(srcSkills.rows[0].n);
  });

  it("recusa destino com dados sem --force", async () => {
    await expect(copyDatabase({ url: SRC }, { url: DST }, {})).rejects.toThrow("Destino já tem dados");
  });
});

describe("db", () => {
  it("importar sem DATABASE_URL não lança", async () => {
    const saved = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      await expect(import("@/lib/db")).resolves.toBeDefined();
    } finally {
      process.env.DATABASE_URL = saved;
    }
  });
});
