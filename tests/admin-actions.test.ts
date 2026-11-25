// @vitest-environment node
import { execSync } from "node:child_process";
import { existsSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// Banco separado só para estes testes (outro arquivo, para rodar em paralelo com portfolio.test.ts).
process.env.DATABASE_URL = "file:./test-admin.db";

const requireAdmin = vi.fn(async () => {});
vi.mock("@/lib/auth", () => ({ requireAdmin: () => requireAdmin() }));
const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({ revalidatePath: (p: string) => revalidatePath(p) }));

type Db = typeof import("@/lib/db").db;
type Actions = typeof import("@/app/(admin)/admin/actions");
let db: Db;
let actions: Actions;

const run = (cmd: string) => execSync(cmd, { stdio: "pipe", env: process.env });
const form = (fields: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
};
const projectForm = (extra: Record<string, string> = {}) =>
  form({ id: "", title: "Novo", description: "Descrição", stack: "A\n\n  B  \n", ...extra });

beforeAll(async () => {
  rmSync("prisma/test-admin.db", { force: true });
  run("npx prisma db push --skip-generate");
  run("npx prisma db seed");
  db = (await import("@/lib/db")).db;
  actions = await import("@/app/(admin)/admin/actions");
}, 60_000);

beforeEach(() => {
  requireAdmin.mockReset();
  requireAdmin.mockResolvedValue(undefined);
  revalidatePath.mockReset();
});

afterAll(() => db?.$disconnect());

describe("saveItem", () => {
  it("rejeita título vazio e não cria linha", async () => {
    const antes = await db.project.count();
    const r = await actions.saveItem("project", projectForm({ title: "" }));
    expect(r.errors?.title).toBeTruthy();
    expect(await db.project.count()).toBe(antes);
  });

  it("cria com lista JSON limpa, vai para o fim e revalida / e /en", async () => {
    const r = await actions.saveItem("project", projectForm({ titleEn: "New" }));
    expect(r.errors).toBeUndefined();
    const p = await db.project.findFirstOrThrow({ where: { title: "Novo" } });
    expect(p.stack).toBe('["A","B"]');
    expect(p.titleEn).toBe("New");
    expect(p.order).toBe((await db.project.aggregate({ _max: { order: true } }))._max.order);
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/en");
  });

  it("atualiza quando há id e limpa o inglês vazio", async () => {
    await actions.saveItem("project", projectForm({ id: "1", title: "Requests 2", titleEn: "" }));
    const p = await db.project.findUniqueOrThrow({ where: { id: 1 } });
    expect(p.title).toBe("Requests 2");
    expect(p.titleEn).toBeNull();
  });

  it("salva o nível e o checkbox de competência", async () => {
    await actions.saveItem("skill", form({ id: "", name: "Rust", group: "Backend", level: "intermediate" }));
    const s = await db.skill.findFirstOrThrow({ where: { name: "Rust" } });
    expect(s.level).toBe("intermediate");
    expect(s.visible).toBe(false); // checkbox de visible não veio marcado
  });

  it("nível vazio vira null", async () => {
    await actions.saveItem("skill", form({ id: "", name: "Go", group: "Backend", level: "" }));
    expect((await db.skill.findFirstOrThrow({ where: { name: "Go" } })).level).toBeNull();
  });

  it("rejeita nível inválido", async () => {
    const r = await actions.saveItem("skill", form({ id: "", name: "Zig", group: "Backend", level: "expert" }));
    expect(r.errors?.level).toBeDefined();
    expect(await db.skill.findFirst({ where: { name: "Zig" } })).toBeNull();
  });
});

describe("toggleVisible e move", () => {
  it("toggleVisible inverte visible", async () => {
    await actions.toggleVisible("project", 2);
    expect((await db.project.findUniqueOrThrow({ where: { id: 2 } })).visible).toBe(false);
    await actions.toggleVisible("project", 2);
    expect((await db.project.findUniqueOrThrow({ where: { id: 2 } })).visible).toBe(true);
  });

  it("move troca a ordem com o vizinho", async () => {
    const ids = async () => (await db.project.findMany({ orderBy: [{ order: "asc" }, { id: "asc" }] })).map((p) => p.id);
    const antes = await ids();
    await actions.move("project", antes[1], "up");
    const depois = await ids();
    expect(depois.slice(0, 2)).toEqual([antes[1], antes[0]]);
    expect(depois.slice(2)).toEqual(antes.slice(2));
  });
});

const png = () => new File([new Uint8Array(50)], "foto.png", { type: "image/png" });
const uploadForm = (fields: Record<string, string | File>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
};
// Foto do que as actions de escrita poderiam mexer: tabelas inteiras e a pasta de uploads.
const snapshot = async () => ({
  profile: await db.profile.findMany(),
  projects: await db.project.findMany({ orderBy: { id: "asc" } }),
  uploads: existsSync("storage/uploads") ? readdirSync("storage/uploads").sort() : [],
});

describe("deleteItem e autorização", () => {
  it("sem admin, deleteItem rejeita e a linha continua", async () => {
    requireAdmin.mockRejectedValue(new Error("Não autorizado"));
    await expect(actions.deleteItem("project", 3)).rejects.toThrow("Não autorizado");
    expect(await db.project.findUnique({ where: { id: 3 } })).not.toBeNull();
  });

  it.each([
    ["updateProfile", () => actions.updateProfile(uploadForm({ name: "Hacker", photo: png() }))],
    ["saveItem", () => actions.saveItem("project", uploadForm({ id: "", title: "Hack", description: "D", image: png() }))],
    ["deleteItem", () => actions.deleteItem("project", 1)],
    ["toggleVisible", () => actions.toggleVisible("project", 1)],
    ["move", () => actions.move("project", 1, "down")],
  ])("%s exige admin, não muda o banco e não grava arquivo", async (_nome, chamar) => {
    // Foto de verdade no envio: se a action gravasse antes de checar a sessão, apareceria em storage/uploads.
    const antes = await snapshot();
    requireAdmin.mockRejectedValue(new Error("Não autorizado"));
    await expect(chamar()).rejects.toThrow("Não autorizado");
    expect(await snapshot()).toEqual(antes);
  });

  it("recusa tipo inválido", async () => {
    const ruim = "user" as never;
    await expect(actions.saveItem(ruim, form({}))).rejects.toThrow("Tipo inválido");
    await expect(actions.deleteItem(ruim, 1)).rejects.toThrow("Tipo inválido");
    await expect(actions.toggleVisible(ruim, 1)).rejects.toThrow("Tipo inválido");
    await expect(actions.move(ruim, 1, "up")).rejects.toThrow("Tipo inválido");
  });

  it("com admin, apaga", async () => {
    await actions.deleteItem("project", 3);
    expect(await db.project.findUnique({ where: { id: 3 } })).toBeNull();
  });
});

describe("updateProfile", () => {
  const base = { name: "Eduardo", role: "Dev", summary: "Resumo", email: "a@b.co", githubUrl: "https://github.com/x", linkedinUrl: "https://linkedin.com/in/x" };

  it("salva perfil e openToWork", async () => {
    const r = await actions.updateProfile(form({ ...base, roleEn: "Developer", openToWork: "on" }));
    expect(r.errors).toBeUndefined();
    const p = await db.profile.findUniqueOrThrow({ where: { id: 1 } });
    expect(p.roleEn).toBe("Developer");
    expect(p.openToWork).toBe(true);
  });

  it("rejeita links javascript: no perfil e no projeto", async () => {
    const r = await actions.updateProfile(form({ ...base, githubUrl: "javascript:alert(1)" }));
    expect(r.errors?.githubUrl).toBeTruthy();
    const p = await actions.saveItem("project", projectForm({ url: "javascript:alert(1)" }));
    expect(p.errors?.url).toBeTruthy();
  });

  it("rejeita e-mail inválido", async () => {
    const r = await actions.updateProfile(form({ ...base, email: "xx" }));
    expect(r.errors?.email).toBeTruthy();
  });
});

describe("uploads nas actions", () => {
  const base = { name: "Eduardo", role: "Dev", summary: "Resumo", email: "a@b.co", githubUrl: "https://github.com/x", linkedinUrl: "https://linkedin.com/in/x" };
  const withFiles = (fields: Record<string, string>, files: Record<string, File>) => {
    const f = form(fields);
    for (const [k, v] of Object.entries(files)) f.set(k, v);
    return f;
  };
  const png = (name = "foto.png") => new File([new Uint8Array(50)], name, { type: "image/png" });
  const pdf = new File([new Uint8Array(50)], "cv.pdf", { type: "application/pdf" });
  const onDisk = (publicPath: string | null) => existsSync(path.join("storage", "uploads", publicPath!.replace("/files/", "")));
  const cleanup: (string | null)[] = [];
  afterEach(async () => {
    const { deleteUpload } = await import("@/lib/uploads");
    for (const p of cleanup.splice(0)) if (p) await deleteUpload(p);
  });

  it("salva foto e currículo, e a troca apaga o arquivo antigo", async () => {
    await actions.updateProfile(withFiles(base, { photo: png(), cv: pdf }));
    const first = await db.profile.findUniqueOrThrow({ where: { id: 1 } });
    cleanup.push(first.photoPath, first.cvPath); // antes dos expects: se falhar, o afterEach ainda limpa
    expect(first.photoPath).toMatch(/^\/files\/.+\.png$/);
    expect(first.cvPath).toMatch(/^\/files\/.+\.pdf$/);

    await actions.updateProfile(withFiles(base, { photo: png("outra.png") }));
    const second = await db.profile.findUniqueOrThrow({ where: { id: 1 } });
    cleanup.push(second.photoPath);
    expect(second.photoPath).not.toBe(first.photoPath);
    expect(onDisk(first.photoPath)).toBe(false);
    expect(onDisk(second.photoPath)).toBe(true);
    expect(second.cvPath).toBe(first.cvPath); // sem arquivo novo, mantém

    await actions.updateProfile(withFiles({ ...base, remove_photo: "on", remove_cv: "on" }, {}));
    const third = await db.profile.findUniqueOrThrow({ where: { id: 1 } });
    expect([third.photoPath, third.cvPath]).toEqual([null, null]);
    expect(onDisk(second.photoPath)).toBe(false);
    expect(onDisk(first.cvPath)).toBe(false);
  });

  it("arquivo inválido volta erro em português e não altera nada", async () => {
    const exe = new File([new Uint8Array(5)], "a.exe", { type: "application/octet-stream" });
    const r = await actions.updateProfile(withFiles({ ...base, role: "Mudou" }, { photo: exe, cv: png() }));
    expect(r.errors).toEqual({ photo: "Tipo de arquivo não permitido", cv: "Tipo de arquivo não permitido" });
    expect((await db.profile.findUniqueOrThrow({ where: { id: 1 } })).role).not.toBe("Mudou");
  });

  it("não aceita photoPath vindo do formulário", async () => {
    await actions.updateProfile(form({ ...base, photoPath: "/files/x.png" }));
    expect((await db.profile.findUniqueOrThrow({ where: { id: 1 } })).photoPath).toBeNull();
  });

  it("imagem de projeto: salva, e remover apaga o arquivo", async () => {
    await actions.saveItem("project", withFiles({ id: "1", title: "Requests", description: "D" }, { image: png() }));
    const p = await db.project.findUniqueOrThrow({ where: { id: 1 } });
    cleanup.push(p.imagePath);
    expect(onDisk(p.imagePath)).toBe(true);

    await actions.saveItem("project", form({ id: "1", title: "Requests", description: "D", remove_image: "on" }));
    expect((await db.project.findUniqueOrThrow({ where: { id: 1 } })).imagePath).toBeNull();
    expect(onDisk(p.imagePath)).toBe(false);
  });
});
