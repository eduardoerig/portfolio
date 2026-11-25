// @vitest-environment node
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { beforeAll, describe, expect, it, vi } from "vitest";

// requireAdmin lê o cookie da requisição; aqui simulamos uma requisição sem cookie.
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

const SENHA = "senha-de-teste";
process.env.SESSION_SECRET = "segredo-de-teste-com-mais-de-32-caracteres";

type Auth = typeof import("@/lib/auth");
let auth: Auth;

beforeAll(async () => {
  process.env.ADMIN_PASSWORD_HASH = await bcrypt.hash(SENHA, 4);
  auth = await import("@/lib/auth");
});

describe("verifyPassword", () => {
  it("aceita a senha certa", async () => {
    expect(await auth.verifyPassword(SENHA)).toBe(true);
  });

  it("recusa a senha errada", async () => {
    expect(await auth.verifyPassword("errada")).toBe(false);
  });

  it("recusa tudo quando o hash está vazio", async () => {
    const hash = process.env.ADMIN_PASSWORD_HASH;
    process.env.ADMIN_PASSWORD_HASH = "";
    expect(await auth.verifyPassword("")).toBe(false);
    expect(await auth.verifyPassword("qualquer")).toBe(false);
    process.env.ADMIN_PASSWORD_HASH = hash;
  });
});

describe("sessão", () => {
  it("aceita um token criado por createSession", async () => {
    expect(await auth.readSession(await auth.createSession())).toBe(true);
  });

  it("recusa lixo e token ausente", async () => {
    expect(await auth.readSession("lixo")).toBe(false);
    expect(await auth.readSession(undefined)).toBe(false);
  });

  it("recusa token assinado com outro segredo", async () => {
    const falso = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("admin")
      .setExpirationTime("7d")
      .sign(new TextEncoder().encode("outro-segredo-com-mais-de-32-caracteres"));
    expect(await auth.readSession(falso)).toBe(false);
  });
});

describe("segredo de sessão", () => {
  it("createSession recusa segredo ausente ou curto", async () => {
    const segredo = process.env.SESSION_SECRET;
    for (const ruim of ["", "curto"]) {
      process.env.SESSION_SECRET = ruim;
      await expect(auth.createSession()).rejects.toThrow();
    }
    process.env.SESSION_SECRET = segredo;
  });
});

describe("requireAdmin", () => {
  it("rejeita sem cookie", async () => {
    await expect(auth.requireAdmin()).rejects.toThrow("Não autorizado");
  });
});
