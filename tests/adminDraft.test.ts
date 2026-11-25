import { describe, expect, it, vi } from "vitest";
import { draftToFormData, itemPreview, profilePreview, rowToDraft, type Draft } from "@/lib/adminDraft";

const project = (o: Draft = {}): Draft => ({
  id: "1", title: "Pedidos", titleEn: "", description: "d", descriptionEn: "", stack: ["PHP"], stackEn: [],
  url: "", metric: "", metricEn: "", visible: true, ...o,
});

describe("rowToDraft", () => {
  it("converte listas JSON, nulos e strings", () => {
    const d = rowToDraft({ id: 1, stack: '["PHP","MySQL"]', stackEn: null, url: null, visible: 1 }, "project");
    expect(d.stack).toEqual(["PHP", "MySQL"]);
    expect(d.stackEn).toEqual([]);
    expect(d.url).toBe("");
    expect(d.visible).toBe(true);
  });
  it("item novo vem visível, sem id e com os campos vazios", () => {
    const d = rowToDraft(null, "project");
    expect(d.visible).toBe(true);
    expect(d.id).toBe("");
    expect(d.stack).toEqual([]);
    expect(d.title).toBe("");
    expect(rowToDraft(null, "profile").openToWork).toBe(false);
  });
});

describe("draftToFormData", () => {
  it("usa as mesmas chaves das actions", () => {
    const f = draftToFormData({ id: "", stack: ["A", "B"], visible: true, current: false }, {}, ["image"]);
    expect(f.get("stack")).toBe("A\nB");
    expect(f.get("visible")).toBe("on");
    expect(f.has("current")).toBe(false);
    expect(f.get("remove_image")).toBe("on");
    expect(f.has("image")).toBe(false);
  });
  it("lista vazia vira texto vazio", () => {
    expect(draftToFormData({ stack: [] }, {}, []).get("stack")).toBe("");
  });
  it("envia a chave do arquivo guardado em <campo>Key, nunca o arquivo", () => {
    const f = draftToFormData({}, { image: "0b1e7f5c-1d2a-4c3b-9e8f-7a6b5c4d3e2f.png" }, []);
    expect(f.get("imageKey")).toBe("0b1e7f5c-1d2a-4c3b-9e8f-7a6b5c4d3e2f.png");
    expect(f.has("image")).toBe(false);
  });
});

describe("previews", () => {
  it("chave guardada vira URL pública na prévia", () => {
    vi.stubEnv("NEXT_PUBLIC_FILES_URL", "https://pub.test");
    expect(profilePreview({ name: "A", photoPath: "0b1e7f5c-1d2a-4c3b-9e8f-7a6b5c4d3e2f.png" }, "pt").photoPath).toBe("https://pub.test/0b1e7f5c-1d2a-4c3b-9e8f-7a6b5c4d3e2f.png");
    expect(itemPreview("project", { title: "T", imagePath: "0b1e7f5c-1d2a-4c3b-9e8f-7a6b5c4d3e2f.png" }, "pt").imagePath).toBe("https://pub.test/0b1e7f5c-1d2a-4c3b-9e8f-7a6b5c4d3e2f.png");
    vi.unstubAllEnvs();
  });
  it("cai no português sem inglês e usa o inglês quando existe", () => {
    const pt = itemPreview("project", project(), "en");
    expect(pt.title).toBe("Pedidos");
    expect(pt.stack).toEqual(["PHP"]);
    expect(itemPreview("project", project({ titleEn: "Requests" }), "en").title).toBe("Requests");
  });
  it("nível vazio vira null e id novo vira -1", () => {
    const s = itemPreview("skill", { id: "", name: "a", group: "g", level: "" }, "pt");
    expect(s.level).toBeNull();
    expect(s.id).toBe(-1);
  });
  it("experiência cai nos bullets em português e mantém current", () => {
    const e = itemPreview("experience", { id: "2", role: "Dev", company: "X", location: "SP", period: "2020", bullets: ["a", "b"], bulletsEn: [], current: true }, "en");
    expect(e.bullets).toEqual(["a", "b"]);
    expect(e.current).toBe(true);
  });
  it("formação: nota vazia em inglês cai no português", () => {
    const base = { id: "3", course: "C", school: "S", period: "p", note: "nota" };
    expect(itemPreview("education", { ...base, noteEn: "" }, "en").note).toBe("nota");
    expect(itemPreview("education", { ...base, noteEn: "note" }, "en").note).toBe("note");
  });
  it("photoUrl substitui photoPath", () => {
    const d = rowToDraft(null, "profile");
    expect(profilePreview({ ...d, photoPath: "/u/a.png" }, "pt").photoPath).toBeNull(); // caminho que não é chave nossa
    expect(profilePreview(d, "pt", "blob:x").photoPath).toBe("blob:x");
  });
});
