// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const blocked = vi.fn();
const recordFailure = vi.fn();
const clearFailures = vi.fn();
const verifyPassword = vi.fn();
vi.mock("@/lib/loginLimit", () => ({
  clientIp: () => "1.2.3.4",
  isBlocked: () => blocked(),
  recordFailure: (ip: string) => recordFailure(ip),
  clearFailures: (ip: string) => clearFailures(ip),
}));
vi.mock("@/lib/auth", () => ({
  hasPasswordConfigured: () => true,
  hasSessionSecret: () => true,
  verifyPassword: (p: string) => verifyPassword(p),
  createSession: async () => "token",
  SESSION_COOKIE: "s",
  SESSION_SECONDS: 60,
}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
  cookies: async () => ({ set: vi.fn(), delete: vi.fn() }),
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const form = (password: string) => {
  const f = new FormData();
  f.set("password", password);
  return f;
};

beforeEach(() => vi.clearAllMocks());

describe("login com limite de tentativas", () => {
  it("IP bloqueado recebe o aviso sem conferir a senha", async () => {
    blocked.mockResolvedValue(true);
    const { login } = await import("@/app/(admin)/admin/login/actions");
    expect(await login({}, form("x"))).toEqual({ error: "Muitas tentativas. Tente de novo em alguns minutos." });
    expect(verifyPassword).not.toHaveBeenCalled();
  });

  it("senha errada registra a falha; certa limpa as falhas", async () => {
    blocked.mockResolvedValue(false);
    const { login } = await import("@/app/(admin)/admin/login/actions");
    verifyPassword.mockResolvedValue(false);
    await login({}, form("errada"));
    expect(recordFailure).toHaveBeenCalledWith("1.2.3.4");
    verifyPassword.mockResolvedValue(true);
    await login({}, form("certa"));
    expect(clearFailures).toHaveBeenCalledWith("1.2.3.4");
  });
});
