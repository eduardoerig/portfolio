// Cria as tabelas num banco libSQL remoto vazio, a partir do schema do Prisma.
// Uso: npm run db:remote:init  (lê REMOTE_DATABASE_URL e REMOTE_DATABASE_AUTH_TOKEN do .env)
import { execSync } from "node:child_process";
import { createClient } from "@libsql/client";

async function main() {
  const url = process.env.REMOTE_DATABASE_URL;
  if (!url) throw new Error("Defina REMOTE_DATABASE_URL no .env");
  const sql = execSync("npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script", {
    encoding: "utf8",
  });
  const db = createClient({ url, authToken: process.env.REMOTE_DATABASE_AUTH_TOKEN });
  try {
    await db.executeMultiple(sql);
  } finally {
    db.close();
  }
  console.log("Tabelas criadas no banco remoto.");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
