// @vitest-environment node
import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/session", () => ({ SESSION_COOKIE: "s", readSession: async (t?: string) => t === "ok" }));
const { middleware } = await import("@/middleware");

const req = (init?: { method?: string; headers?: Record<string, string> }) => new NextRequest("http://x/admin/projetos", init);

describe("middleware do painel", () => {
  it("página sem sessão vai para o login", async () => {
    const res = await middleware(req());
    expect(res.headers.get("location")).toBe("http://x/admin/login");
  });

  // Redirecionar a gravação levaria o painel para o login e o texto digitado se perderia.
  it("gravação (server action) sem sessão passa: a própria action recusa e o painel avisa", async () => {
    const res = await middleware(req({ method: "POST", headers: { "next-action": "abc" } }));
    expect(res.headers.get("location")).toBeNull();
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });
});
