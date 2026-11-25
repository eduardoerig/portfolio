import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";
import { resolveDbUrl } from "@/lib/dbUrl";

// Local: DATABASE_URL="file:./dev.db". Produção: "libsql://...turso.io" + DATABASE_AUTH_TOKEN.
export function createDb(url: string, authToken?: string): PrismaClient {
  return new PrismaClient({ adapter: new PrismaLibSQL({ url: resolveDbUrl(url), authToken }) });
}

// Um único cliente por processo (o hot reload do Next criaria vários em dev).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function client(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL não configurada");
    globalForPrisma.prisma = createDb(url, process.env.DATABASE_AUTH_TOKEN || undefined);
  }
  return globalForPrisma.prisma;
}

// Criado só no primeiro uso: o build roda sem variáveis de ambiente.
export const db = new Proxy({} as PrismaClient, {
  get: (_t, prop) => {
    const c = client();
    const value = Reflect.get(c, prop);
    return typeof value === "function" ? value.bind(c) : value;
  },
});
