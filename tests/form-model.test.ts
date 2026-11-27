// @vitest-environment node
import { describe, expect, it } from "vitest";
import { fieldNames, FORMS } from "@/lib/formModel";
import { parseForm, schemaFor } from "@/lib/formSchema";

const fd = (fields: Record<string, string>) => Object.fromEntries(Object.entries(fields));

// Os mesmos campos que o rascunho e as actions já usavam (antes estavam escritos à mão em adminDraft.ts).
const OLD_FIELDS = {
  profile: ["name", "role", "roleEn", "summary", "summaryEn", "email", "githubUrl", "linkedinUrl", "openToWork",
    "fullName", "location", "locationEn", "phone", "cvClosing", "cvClosingEn"],
  project: ["title", "titleEn", "description", "descriptionEn", "stack", "stackEn", "url", "metric", "metricEn", "visible"],
  experience: ["role", "roleEn", "company", "location", "locationEn", "period", "periodEn", "bullets", "bulletsEn", "current", "visible"],
  skill: ["name", "nameEn", "group", "groupEn", "level", "visible"],
  education: ["course", "courseEn", "school", "period", "periodEn", "note", "noteEn", "visible"],
  language: ["name", "nameEn", "level", "levelEn", "proficiency", "visible"],
} as const;

describe("modelo de formulários", () => {
  it.each(Object.keys(OLD_FIELDS) as (keyof typeof OLD_FIELDS)[])("%s: mesmos campos de antes", (kind) => {
    expect([...fieldNames(kind)].sort()).toEqual([...OLD_FIELDS[kind]].sort());
  });

  it("todo formulário tem seção com título e campos com rótulo", () => {
    for (const sections of Object.values(FORMS)) {
      for (const s of sections) {
        expect(s.title).toBeTruthy();
        for (const f of s.fields) expect(f.label).toBeTruthy();
      }
    }
  });
});

describe("esquema gerado do modelo", () => {
  it("obrigatório vazio e acima do limite dão a mensagem certa; inglês vazio vira null", () => {
    expect(parseForm(schemaFor("project"), fd({ title: " ", description: "D" }))).toEqual({ errors: { title: "Campo obrigatório" } });
    const long = "x".repeat(121);
    expect(parseForm(schemaFor("project"), fd({ title: long, description: "D" }))).toEqual({ errors: { title: "Até 120 caracteres" } });
    const ok = parseForm(schemaFor("project"), fd({ title: " Requests ", titleEn: "", description: "D", stack: "PHP\n\n MySQL ", url: "" }));
    expect("data" in ok && ok.data).toMatchObject({ title: "Requests", titleEn: null, stack: '["PHP","MySQL"]', stackEn: null, url: null, visible: false });
  });

  it("link só aceita http/https", () => {
    const r = parseForm(schemaFor("project"), fd({ title: "T", description: "D", url: "javascript:alert(1)" }));
    expect(r).toEqual({ errors: { url: "Link inválido: comece com https://" } });
    const p = parseForm(schemaFor("profile"), fd({ name: "N", role: "R", summary: "S", email: "a@b.co", githubUrl: "ftp://x", linkedinUrl: "https://l.co" }));
    expect("errors" in p && p.errors.githubUrl).toBe("Link inválido: comece com https://");
  });

  it("e-mail, nível de competência e barra do idioma", () => {
    const p = parseForm(schemaFor("profile"), fd({ name: "N", role: "R", summary: "S", email: "xx", githubUrl: "https://g.co", linkedinUrl: "https://l.co" }));
    expect("errors" in p && p.errors.email).toBe("E-mail inválido");
    expect(parseForm(schemaFor("skill"), fd({ name: "N", group: "G", level: "expert" }))).toEqual({ errors: { level: "Nível inválido" } });
    const s = parseForm(schemaFor("skill"), fd({ name: "N", group: "G", level: "" }));
    expect("data" in s && s.data.level).toBeNull();
    expect(parseForm(schemaFor("language"), fd({ name: "N", level: "L", proficiency: "7" }))).toEqual({ errors: { proficiency: "Nível de 1 a 5" } });
    const l = parseForm(schemaFor("language"), fd({ name: "N", level: "L", proficiency: "4", visible: "on" }));
    expect("data" in l && [l.data.proficiency, l.data.visible]).toEqual([4, true]);
  });
});
