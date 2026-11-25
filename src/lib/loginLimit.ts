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

// Conta a tentativa ANTES de conferir a senha e diz se ela passou do limite. Cada tentativa ganha
// uma posição (o id), então pedidos em paralelo não passam todos: só as 5 primeiras da janela.
export async function registerAttempt(ip: string, now = new Date()): Promise<boolean> {
  const { id } = await db.loginAttempt.create({ data: { ip, createdAt: now } });
  const since = new Date(now.getTime() - WINDOW_MS);
  const rank = await db.loginAttempt.count({ where: { ip, createdAt: { gte: since }, id: { lte: id } } });
  return rank > MAX_FAILURES;
}

export async function recordFailure(ip: string): Promise<void> {
  await db.loginAttempt.create({ data: { ip } });
}

export async function clearFailures(ip: string): Promise<void> {
  await db.loginAttempt.deleteMany({ where: { ip } });
}
