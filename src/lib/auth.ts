import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { readSession, SESSION_COOKIE } from "@/lib/session";

// Login do painel: uma senha (hash bcrypt no .env) e um cookie com JWT assinado.

export { createSession, hasSessionSecret, readSession, SESSION_COOKIE, SESSION_SECONDS } from "@/lib/session";

// Hash vazio = senha não configurada: nunca pode virar "sem senha".
export function hasPasswordConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD_HASH);
}

export async function verifyPassword(plain: string): Promise<boolean> {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

// Toda Server Action do painel chama isto primeiro (o middleware sozinho não basta).
export async function requireAdmin(): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!(await readSession(token))) throw new Error("Não autorizado");
}
