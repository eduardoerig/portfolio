import { db } from "@/lib/db";

const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;

// IP de quem tenta entrar: o primeiro de x-forwarded-for (posto pela hospedagem); sem ele, "local".
export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
}

export async function isBlocked(ip: string, now = new Date()): Promise<boolean> {
  const since = new Date(now.getTime() - WINDOW_MS);
  return (await db.loginAttempt.count({ where: { ip, createdAt: { gte: since } } })) >= MAX_FAILURES;
}

export async function recordFailure(ip: string): Promise<void> {
  await db.loginAttempt.create({ data: { ip } });
}

export async function clearFailures(ip: string): Promise<void> {
  await db.loginAttempt.deleteMany({ where: { ip } });
}
