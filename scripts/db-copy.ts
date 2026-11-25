// Copia todas as tabelas de um banco para outro (ex.: dev.db local -> banco remoto libSQL).
// Uso: npm run db:copy  (origem = DATABASE_URL; destino = REMOTE_DATABASE_URL + REMOTE_DATABASE_AUTH_TOKEN)
// A origem nunca é alterada. O destino precisa já ter o schema (npm run db:remote:init).
import { createClient, type Client, type InValue } from "@libsql/client";
import { resolveDbUrl } from "../src/lib/dbUrl";

export type DbTarget = { url: string; authToken?: string };

const connect = (t: DbTarget) => createClient({ url: resolveDbUrl(t.url), authToken: t.authToken });
const q = (name: string) => `"${name.replace(/"/g, '""')}"`;

// Caminhos de arquivo do tempo do disco local (/files/...) não existem no armazenamento novo.
export async function clearLegacyPaths(c: Client): Promise<void> {
  await c.execute("UPDATE Profile SET photoPath = NULL WHERE photoPath LIKE '/files/%'");
  await c.execute("UPDATE Profile SET cvPath = NULL WHERE cvPath LIKE '/files/%'");
  await c.execute("UPDATE Project SET imagePath = NULL WHERE imagePath LIKE '/files/%'");
}

export async function copyDatabase(from: DbTarget, to: DbTarget, opts: { force?: boolean }): Promise<Record<string, number>> {
  const src = connect(from);
  const dst = connect(to);
  try {
    return await copyAll(src, dst, opts);
  } finally {
    src.close(); // inclusive quando recusa: arquivo aberto fica travado no Windows
    dst.close();
  }
}

async function copyAll(src: Client, dst: Client, opts: { force?: boolean }): Promise<Record<string, number>> {
  const existing = await dst.execute("SELECT count(*) AS n FROM Profile");
  if (Number(existing.rows[0].n) > 0 && !opts.force) throw new Error("Destino já tem dados");

  const tables = await src.execute(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma%'",
  );
  const counts: Record<string, number> = {};
  for (const { name } of tables.rows) {
    const table = String(name);
    const rows = await src.execute(`SELECT * FROM ${q(table)}`);
    const cols = rows.columns;
    const stmts = rows.rows.map((r) => ({
      sql: `INSERT OR REPLACE INTO ${q(table)} (${cols.map(q).join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`,
      args: cols.map((c) => r[c] as InValue),
    }));
    if (stmts.length) await dst.batch(stmts, "write");
    counts[table] = stmts.length;
  }
  await clearLegacyPaths(dst);
  return counts;
}

async function main() {
  const from = process.env.DATABASE_URL;
  const to = process.env.REMOTE_DATABASE_URL;
  if (!from || !to) throw new Error("Defina DATABASE_URL (origem) e REMOTE_DATABASE_URL (destino) no .env");
  const counts = await copyDatabase({ url: from }, { url: to, authToken: process.env.REMOTE_DATABASE_AUTH_TOKEN }, {
    force: process.argv.includes("--force"),
  });
  console.log("Copiado:", counts);
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/db-copy.ts")) {
  main().catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
}
