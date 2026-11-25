import { jwtVerify, SignJWT } from "jose";

// Só o que usa jose: o middleware (Edge) importa este arquivo e não o auth.ts (que tem bcrypt/cookies).

export const SESSION_COOKIE = "session";
export const SESSION_SECONDS = 60 * 60 * 24 * 7; // 7 dias

// Lido a cada chamada (e não ao importar) para o segredo poder mudar nos testes.
const secretKey = () => new TextEncoder().encode(process.env.SESSION_SECRET ?? "");

export function hasSessionSecret(): boolean {
  return (process.env.SESSION_SECRET ?? "").length >= 32;
}

export async function createSession(): Promise<string> {
  // Sem segredo forte, qualquer um poderia forjar o cookie: falha fechado.
  if (!hasSessionSecret()) throw new Error("SESSION_SECRET ausente ou curto demais");
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("admin")
    .setExpirationTime("7d")
    .sign(secretKey());
}

export async function readSession(token?: string): Promise<boolean> {
  if (!token || !hasSessionSecret()) return false;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    return payload.sub === "admin";
  } catch {
    return false;
  }
}
