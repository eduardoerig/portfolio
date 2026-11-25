// @vitest-environment node
import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

// Banco só destes testes (nunca toca no dev.db).
process.env.DATABASE_URL = "file:./test-login.db";

type Limit = typeof import("@/lib/loginLimit");
let limit: Limit;
let db: typeof import("@/lib/db").db;

beforeAll(async () => {
  rmSync("prisma/test-login.db", { force: true });
  execSync("npx prisma db push --skip-generate", { stdio: "pipe", env: process.env });
  limit = await import("@/lib/loginLimit");
  db = (await import("@/lib/db")).db;
}, 60_000);

afterAll(() => db?.$disconnect());
beforeEach(async () => {
  await db.loginAttempt.deleteMany();
});

describe("limite de tentativas no login", () => {
  it("bloqueia a partir da 5ª falha em 15 minutos", async () => {
    for (let i = 0; i < 4; i++) await limit.recordFailure("1.2.3.4");
    expect(await limit.isBlocked("1.2.3.4")).toBe(false);
    await limit.recordFailure("1.2.3.4");
    expect(await limit.isBlocked("1.2.3.4")).toBe(true);
    expect(await limit.isBlocked("5.6.7.8")).toBe(false); // outro IP não é afetado
  });

  it("falhas com mais de 15 minutos não contam", async () => {
    const old = new Date(Date.now() - 16 * 60 * 1000);
    await db.loginAttempt.createMany({ data: Array.from({ length: 5 }, () => ({ ip: "1.2.3.4", createdAt: old })) });
    expect(await limit.isBlocked("1.2.3.4")).toBe(false);
  });

  it("login certo zera as falhas daquele IP", async () => {
    for (let i = 0; i < 5; i++) await limit.recordFailure("1.2.3.4");
    await limit.clearFailures("1.2.3.4");
    expect(await limit.isBlocked("1.2.3.4")).toBe(false);
  });

  it("10 tentativas em paralelo: no máximo 5 passam", async () => {
    const results = await Promise.all(Array.from({ length: 10 }, () => limit.registerAttempt("9.9.9.9")));
    expect(results.filter((blocked) => !blocked).length).toBeLessThanOrEqual(5);
  });

  it("clientIp usa o primeiro valor de x-forwarded-for, ou 'local'", () => {
    expect(limit.clientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("1.2.3.4");
    expect(limit.clientIp(new Headers())).toBe("local");
  });
});

describe("siteUrl", () => {
  it("vem de SITE_URL; sem ela, localhost", async () => {
    const { siteUrl } = await import("@/lib/site");
    process.env.SITE_URL = "https://ex.com";
    expect(siteUrl().toString()).toBe("https://ex.com/");
    delete process.env.SITE_URL;
    expect(siteUrl().toString()).toBe("http://localhost:3000/");
  });
});
