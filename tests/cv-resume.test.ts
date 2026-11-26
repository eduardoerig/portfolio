import { describe, expect, it } from "vitest";
import { fixturePortfolio } from "@/content/fixture";
import { buildResume, cvFilename, groupSkills, initials, linkLabel, parseBold, splitName, wrapLink, type CvExtras } from "@/cv/resume";

const NONE: CvExtras = { fullName: null, location: null, phone: null, closing: null, languages: [] };

describe("nome", () => {
  it("divide na primeira metade arredondada para cima", () => {
    expect(splitName("Eduardo Felipe Storck Erig")).toEqual(["Eduardo Felipe", "Storck Erig"]);
    expect(splitName("Eduardo Felipe Erig")).toEqual(["Eduardo Felipe", "Erig"]);
    expect(splitName("Eduardo")).toEqual(["Eduardo", ""]);
  });
  it("monograma usa o primeiro e o último nome", () => {
    expect(initials("Eduardo Felipe Storck Erig")).toBe("EE");
    expect(initials("Eduardo")).toBe("E");
  });
});

describe("parseBold", () => {
  it("trecho entre ** vira negrito", () => {
    expect(parseBold("Aberto a **vagas remotas** de X.")).toEqual([
      { text: "Aberto a ", bold: false },
      { text: "vagas remotas", bold: true },
      { text: " de X.", bold: false },
    ]);
  });
  it("vazio vira lista vazia", () => {
    expect(parseBold(null)).toEqual([]);
    expect(parseBold("")).toEqual([]);
  });
});

describe("groupSkills", () => {
  it("mantém a ordem da primeira aparição e marca o que está em aprendizado", () => {
    const groups = groupSkills([
      { id: 1, name: "PHP", group: "Back", level: "intermediate" },
      { id: 2, name: "HTML", group: "Front", level: null },
      { id: 3, name: "React", group: "Front", level: "learning" },
      { id: 4, name: "SQL", group: "Back", level: null },
    ]);
    expect(groups).toEqual([
      { group: "Back", items: [{ name: "PHP", learning: false }, { name: "SQL", learning: false }] },
      { group: "Front", items: [{ name: "HTML", learning: false }, { name: "React", learning: true }] },
    ]);
  });
});

describe("buildResume", () => {
  it("sem nome completo usa o nome do site; extras vazios ficam nulos", () => {
    const r = buildResume(fixturePortfolio, NONE, "pt");
    expect(r.cv.fullName).toBe("Eduardo Erig");
    expect(r.cv.nameLines).toEqual(["Eduardo", "Erig"]);
    expect(r.cv.location).toBeNull();
    expect(r.cv.phone).toBeNull();
    expect(r.cv.closing).toEqual([]);
    expect(r.cv.languages).toEqual([]);
  });
  it("usa os extras e sabe se há competência em aprendizado", () => {
    const r = buildResume(fixturePortfolio, { ...NONE, fullName: "Eduardo Felipe Storck Erig", closing: "**Aberto**" }, "pt");
    expect(r.cv.initials).toBe("EE");
    expect(r.cv.closing).toEqual([{ text: "Aberto", bold: true }]);
    expect(r.cv.hasLearning).toBe(true);
    const semAprender = { ...fixturePortfolio, skills: fixturePortfolio.skills.map((s) => ({ ...s, level: null })) };
    expect(buildResume(semAprender, NONE, "pt").cv.hasLearning).toBe(false);
  });
});

describe("cvFilename e linkLabel", () => {
  it("nome do arquivo com primeiro e último nome, sem acento", () => {
    expect(cvFilename("Eduardo Felipe Storck Erig", "pt", false)).toBe("CV_Eduardo_Erig_PT.pdf");
    expect(cvFilename("Eduardo Felipe Storck Erig", "en", true)).toBe("CV_Eduardo_Erig_EN_simples.pdf");
    expect(cvFilename("João Érig", "pt", false)).toBe("CV_Joao_Erig_PT.pdf");
  });
  it("link sem protocolo nem barra final", () => {
    expect(linkLabel("https://github.com/eduardoerig/x/")).toBe("github.com/eduardoerig/x");
    expect(linkLabel("https://www.linkedin.com/in/eduardoerig")).toBe("linkedin.com/in/eduardoerig");
  });
});

describe("wrapLink", () => {
  it("link curto fica igual; longo quebra depois da última / que cabe", () => {
    expect(wrapLink("github.com/eduardoerig/Dolce-Delicias", 40)).toBe("github.com/eduardoerig/Dolce-Delicias");
    expect(wrapLink("github.com/eduardoerig/requests-institutional-management", 40)).toBe(
      "github.com/eduardoerig/\nrequests-institutional-management",
    );
    expect(wrapLink("exemplo.com/" + "a".repeat(50), 40)).toBe("exemplo.com/\n" + "a".repeat(50));
    expect(wrapLink("a".repeat(50), 40)).toBe("a".repeat(50)); // sem / não tem onde quebrar
  });
});
