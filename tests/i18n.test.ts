import { describe, expect, it } from "vitest";
import { getFixturePortfolio } from "@/content/fixture";
import { getDictionary } from "@/i18n/dictionary";
import { localePath } from "@/i18n/locales";

// Lista todas as chaves de um objeto, inclusive as aninhadas ("hero.badge", ...).
function allKeys(obj: object, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) =>
    value && typeof value === "object" ? allKeys(value, `${prefix}${key}.`) : [`${prefix}${key}`],
  );
}

describe("localePath", () => {
  it("português fica em / e inglês em /en", () => {
    expect(localePath("pt")).toBe("/");
    expect(localePath("en")).toBe("/en");
  });
});

describe("getDictionary", () => {
  it("pt e en têm exatamente as mesmas chaves", () => {
    expect(allKeys(getDictionary("pt")).sort()).toEqual(allKeys(getDictionary("en")).sort());
  });
});

describe("getFixturePortfolio", () => {
  it("en tem a mesma quantidade de itens que pt", () => {
    const pt = getFixturePortfolio("pt");
    const en = getFixturePortfolio("en");
    expect(en.projects.length).toBe(pt.projects.length);
    expect(en.experiences.length).toBe(pt.experiences.length);
    expect(en.skills.length).toBe(pt.skills.length);
    expect(en.education.length).toBe(pt.education.length);
  });
});
