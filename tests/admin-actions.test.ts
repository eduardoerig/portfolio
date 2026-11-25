// @vitest-environment node
import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import { isStoredKey } from "@/lib/uploads";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// Banco separado só para estes testes (outro arquivo, para rodar em paralelo com portfolio.test.ts).
process.env.DATABASE_URL = "file:./test-admin.db";

const requireAdmin = vi.fn(async () => {});
vi.mock("@/lib/auth", () => ({ requireAdmin: () => requireAdmin() }));
const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({ revalidatePath: (p: string) => revalidatePath(p) }));
// Bucket em memória no lugar do R2: nenhum teste usa rede.
const bucket = new Map<string, { size: number; contentType: string }>();
const storage = {
  presignPut: vi.fn(async (key: string) => `https://r2.test/${key}?X-Amz-Expires=300`),
  headObject: vi.fn(async (key: string) => bucket.get(key) ?? null),
  deleteObject: vi.fn(async (key: string) => void bucket.delete(key)),
};
vi.mock("@/lib/storage", () => storage);

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
  Object.values(storage).forEach((f) => f.mockClear());
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

const uploadForm = (fields: Record<string, string | File>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
};
// Foto do que as actions de escrita poderiam mexer: tabelas inteiras e a pasta de uploads.
const snapshot = async () => ({
  profile: await db.profile.findMany(),
  projects: await db.project.findMany({ orderBy: { id: "asc" } }),
  bucket: [...bucket.keys()].sort(),
});

describe("deleteItem e autorização", () => {
  it("sem admin, deleteItem rejeita e a linha continua", async () => {
    requireAdmin.mockRejectedValue(new Error("Não autorizado"));
    await expect(actions.deleteItem("project", 3)).rejects.toThrow("Não autorizado");
    expect(await db.project.findUnique({ where: { id: 3 } })).not.toBeNull();
  });

  it.each([
    ["updateProfile", () => actions.updateProfile(uploadForm({ name: "Hacker", photoKey: `${crypto.randomUUID()}.png` }))],
    ["saveItem", () => actions.saveItem("project", uploadForm({ id: "", title: "Hack", description: "D", imageKey: `${crypto.randomUUID()}.png` }))],
    ["deleteItem", () => actions.deleteItem("project", 1)],
    ["toggleVisible", () => actions.toggleVisible("project", 1)],
    ["move", () => actions.move("project", 1, "down")],
  ])("%s exige admin, não muda o banco e não grava arquivo", async (_nome, chamar) => {
    // Chave no envio: se a action consultasse ou apagasse algo antes de checar a sessão, o bucket mudaria.
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

describe("uploads nas actions (por chave)", () => {
  const base = { name: "Eduardo", role: "Dev", summary: "Resumo", email: "a@b.co", githubUrl: "https://github.com/x", linkedinUrl: "https://linkedin.com/in/x" };
  const put = (ext: string, contentType: string, size = 50) => {
    const key = `${crypto.randomUUID()}.${ext}`;
    bucket.set(key, { size, contentType });
    return key;
  };

  it("requestUpload exige admin e não assina nada sem sessão", async () => {
    requireAdmin.mockRejectedValue(new Error("Não autorizado"));
    await expect(actions.requestUpload("image", "image/png", 10)).rejects.toThrow("Não autorizado");
    expect(storage.presignPut).not.toHaveBeenCalled();
  });

  it("requestUpload recusa SVG e PDF grande; aceita PNG", async () => {
    expect((await actions.requestUpload("image", "image/svg+xml", 10)).ok).toBe(false);
    expect((await actions.requestUpload("pdf", "application/pdf", 6 * 1024 * 1024)).ok).toBe(false);
    const ok = await actions.requestUpload("image", "image/png", 1000);
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(isStoredKey(ok.key)).toBe(true);
      expect(ok.url).toContain(ok.key);
    }
  });

  it("salva foto e currículo pela chave; a troca apaga a antiga", async () => {
    const photo = put("png", "image/png");
    const cv = put("pdf", "application/pdf");
    expect((await actions.updateProfile(form({ ...base, photoKey: photo, cvKey: cv }))).errors).toBeUndefined();
    const first = await db.profile.findUniqueOrThrow({ where: { id: 1 } });
    expect([first.photoPath, first.cvPath]).toEqual([photo, cv]);

    const photo2 = put("webp", "image/webp");
    await actions.updateProfile(form({ ...base, photoKey: photo2 }));
    const second = await db.profile.findUniqueOrThrow({ where: { id: 1 } });
    expect(second.photoPath).toBe(photo2);
    expect(second.cvPath).toBe(cv);
    expect(bucket.has(photo)).toBe(false);

    await actions.updateProfile(form({ ...base, remove_photo: "on", remove_cv: "on" }));
    const third = await db.profile.findUniqueOrThrow({ where: { id: 1 } });
    expect([third.photoPath, third.cvPath]).toEqual([null, null]);
    expect(bucket.has(photo2) || bucket.has(cv)).toBe(false);
  });

  it("chave forjada é recusada sem consultar nem apagar nada", async () => {
    const r = await actions.updateProfile(form({ ...base, role: "Mudou", photoKey: "../x.png" }));
    expect(r.errors?.photo).toBeTruthy();
    expect(storage.headObject).not.toHaveBeenCalled();
    expect(storage.deleteObject).not.toHaveBeenCalled();
    expect((await db.profile.findUniqueOrThrow({ where: { id: 1 } })).role).not.toBe("Mudou");
  });

  it("chave que não existe no bucket vira 'Arquivo não encontrado'", async () => {
    const r = await actions.updateProfile(form({ ...base, photoKey: `${crypto.randomUUID()}.png` }));
    expect(r.errors?.photo).toBe("Arquivo não encontrado");
  });

  it("objeto com tipo errado para o campo é recusado e apagado", async () => {
    const wrong = put("png", "application/pdf");
    const r = await actions.updateProfile(form({ ...base, photoKey: wrong }));
    expect(r.errors?.photo).toBe("Tipo de arquivo não permitido");
    expect(bucket.has(wrong)).toBe(false);
  });

  it("objeto maior que o limite é recusado e apagado", async () => {
    const big = put("png", "image/png", 4 * 1024 * 1024);
    const r = await actions.updateProfile(form({ ...base, photoKey: big }));
    expect(r.errors?.photo).toBeTruthy();
    expect(bucket.has(big)).toBe(false);
  });

  it("formulário inválido apaga o objeto recém-enviado", async () => {
    const photo = put("png", "image/png");
    const r = await actions.updateProfile(form({ ...base, email: "xx", photoKey: photo }));
    expect(r.errors?.email).toBeTruthy();
    expect(bucket.has(photo)).toBe(false);
  });

  it("chave que já está em uso não é apagada nem duplicada", async () => {
    const photo = put("png", "image/png");
    const cv = put("pdf", "application/pdf");
    await actions.updateProfile(form({ ...base, photoKey: photo, cvKey: cv }));

    // currículo em uso mandado como imagem de projeto: recusa sem apagar o currículo
    const r = await actions.saveItem("project", form({ id: "1", title: "Requests", description: "D", imageKey: cv }));
    expect(r.errors?.image).toBe("Arquivo inválido");
    expect(bucket.has(cv)).toBe(true);

    // mesma foto de novo: continua salva e não some do bucket
    await actions.updateProfile(form({ ...base, photoKey: photo }));
    expect((await db.profile.findUniqueOrThrow({ where: { id: 1 } })).photoPath).toBe(photo);
    expect(bucket.has(photo)).toBe(true);

    await actions.updateProfile(form({ ...base, remove_photo: "on", remove_cv: "on" }));
  });

  it("não aceita photoPath vindo do formulário", async () => {
    await actions.updateProfile(form({ ...base, photoPath: "x.png" }));
    expect((await db.profile.findUniqueOrThrow({ where: { id: 1 } })).photoPath).toBeNull();
  });

  it("imagem de projeto: salva pela chave, remover e excluir apagam do bucket", async () => {
    const img = put("jpg", "image/jpeg");
    await actions.saveItem("project", form({ id: "1", title: "Requests", description: "D", imageKey: img }));
    expect((await db.project.findUniqueOrThrow({ where: { id: 1 } })).imagePath).toBe(img);
    await actions.saveItem("project", form({ id: "1", title: "Requests", description: "D", remove_image: "on" }));
    expect((await db.project.findUniqueOrThrow({ where: { id: 1 } })).imagePath).toBeNull();
    expect(bucket.has(img)).toBe(false);

    const img2 = put("png", "image/png");
    await actions.saveItem("project", form({ id: "2", title: "Dolce", description: "D", imageKey: img2 }));
    await actions.deleteItem("project", 2);
    expect(bucket.has(img2)).toBe(false);
  });
});
