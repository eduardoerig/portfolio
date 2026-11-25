import { PrismaClient } from "@prisma/client";

// Uma única instância (o hot reload do Next criaria várias em dev).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
