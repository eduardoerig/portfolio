// Prepara um banco que já está no ar para o currículo gerado: só acrescenta, nunca apaga.
// Pode rodar mais de uma vez. Rode antes de publicar o código que lê estes campos.
// Uso: npm run db:remote:cv  (lê REMOTE_DATABASE_URL e REMOTE_DATABASE_AUTH_TOKEN do .env)
import { pathToFileURL } from "node:url";
import { createClient, type Client } from "@libsql/client";

const PROFILE_COLUMNS = ["fullName", "location", "locationEn", "phone", "cvClosing", "cvClosingEn"];

// Mesmo SQL que o Prisma gera para o modelo Language (prisma migrate diff).
const CREATE_LANGUAGE = `CREATE TABLE IF NOT EXISTS "Language" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "level" TEXT NOT NULL,
    "levelEn" TEXT,
    "proficiency" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true
)`;

export const DEFAULT_LANGUAGES = [
  { id: 1, name: "Português", nameEn: "Portuguese", level: "Nativo", levelEn: "Native", proficiency: 5 },
  {
    id: 2,
    name: "Inglês",
    nameEn: "English",
    level: "Intermediário: leitura técnica e documentação",
    levelEn: "Intermediate: technical reading and documentation",
    proficiency: 3,
  },
];

export async function applyCvSchema(c: Client): Promise<void> {
  const existing = new Set((await c.execute("PRAGMA table_info(Profile)")).rows.map((r) => String(r.name)));
  for (const col of PROFILE_COLUMNS) {
    if (!existing.has(col)) await c.execute(`ALTER TABLE "Profile" ADD COLUMN "${col}" TEXT`);
  }
  await c.execute(CREATE_LANGUAGE);
  if (Number((await c.execute("SELECT COUNT(*) AS n FROM Language")).rows[0].n) > 0) return;
  for (const [order, l] of DEFAULT_LANGUAGES.entries()) {
    await c.execute({
      sql: 'INSERT INTO Language (id, name, nameEn, level, levelEn, proficiency, "order", visible) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
      args: [l.id, l.name, l.nameEn, l.level, l.levelEn, l.proficiency, order],
    });
  }
}

async function main() {
  const url = process.env.REMOTE_DATABASE_URL;
  if (!url) throw new Error("Defina REMOTE_DATABASE_URL no .env");
  const c = createClient({ url, authToken: process.env.REMOTE_DATABASE_AUTH_TOKEN });
  try {
    await applyCvSchema(c);
  } finally {
    c.close();
  }
  console.log("Banco remoto atualizado.");
}

// Só roda quando chamado pelo npm script (o teste importa a função).
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
}
