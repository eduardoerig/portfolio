// Põe null nos caminhos de arquivo antigos (/files/...), do tempo em que os uploads ficavam no disco.
// Uso: npm run db:clear-legacy-paths  (no banco de DATABASE_URL). Rode só quando quiser: altera o banco.
import { createClient } from "@libsql/client";
import { resolveDbUrl } from "../src/lib/dbUrl";
import { clearLegacyPaths } from "./db-copy";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Defina DATABASE_URL no .env");
  const db = createClient({ url: resolveDbUrl(url), authToken: process.env.DATABASE_AUTH_TOKEN || undefined });
  try {
    await clearLegacyPaths(db);
  } finally {
    db.close();
  }
  console.log("Caminhos antigos limpos.");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
