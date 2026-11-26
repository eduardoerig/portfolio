// @vitest-environment node
import { rmSync } from "node:fs";
import path from "node:path";
import { createClient, type Client } from "@libsql/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyCvSchema } from "../scripts/db-remote-cv";

// Banco no formato de antes do currículo gerado (só a tabela Profile importa aqui).
const FILE = path.join("prisma", "test-remote-cv.db");
let c: Client;

beforeAll(async () => {
  rmSync(FILE, { force: true });
  c = createClient({ url: `file:${path.resolve(FILE)}` }); // abre só depois de apagar o arquivo antigo
  await c.execute(`CREATE TABLE "Profile" ("id" INTEGER NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "role" TEXT NOT NULL,
    "roleEn" TEXT, "summary" TEXT NOT NULL, "summaryEn" TEXT, "openToWork" BOOLEAN NOT NULL DEFAULT true, "email" TEXT NOT NULL,
    "githubUrl" TEXT NOT NULL, "linkedinUrl" TEXT NOT NULL, "photoPath" TEXT, "cvPath" TEXT)`);
  await c.execute(`INSERT INTO Profile (id, name, role, summary, email, githubUrl, linkedinUrl)
    VALUES (1, 'Eduardo Erig', 'Dev', 'Resumo', 'a@b.c', 'https://g', 'https://l')`);
});

afterAll(() => {
  c?.close();
  // No Windows o arquivo às vezes ainda está preso logo após fechar; a próxima execução apaga.
  try {
    rmSync(FILE, { force: true });
  } catch {}
});

describe("applyCvSchema", () => {
  it("adiciona as colunas e a tabela sem perder o perfil", async () => {
    await applyCvSchema(c);
    const p = (await c.execute("SELECT * FROM Profile WHERE id = 1")).rows[0];
    expect(p.name).toBe("Eduardo Erig");
    expect(p.fullName).toBeNull();
    for (const col of ["location", "locationEn", "phone", "cvClosing", "cvClosingEn"]) expect(p).toHaveProperty(col, null);
    const langs = (await c.execute('SELECT name, nameEn, level, levelEn, proficiency, "order", visible FROM Language ORDER BY "order"')).rows;
    expect(langs.map((r) => ({ ...r }))).toEqual([
      { name: "Português", nameEn: "Portuguese", level: "Nativo", levelEn: "Native", proficiency: 5, order: 0, visible: 1 },
      {
        name: "Inglês",
        nameEn: "English",
        level: "Intermediário: leitura técnica e documentação",
        levelEn: "Intermediate: technical reading and documentation",
        proficiency: 3,
        order: 1,
        visible: 1,
      },
    ]);
  });

  it("rodar duas vezes não dá erro nem duplica idiomas", async () => {
    await applyCvSchema(c);
    await applyCvSchema(c);
    expect((await c.execute("SELECT COUNT(*) AS n FROM Language")).rows[0].n).toBe(2);
  });
});
