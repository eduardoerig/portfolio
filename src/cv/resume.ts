// Transforma o portfólio de um idioma no que o currículo em PDF desenha. Sem banco, sem React: só dados.
import type { Locale } from "@/i18n/locales";
import type { Portfolio, Skill } from "@/lib/types";

export type CvLanguage = { name: string; level: string; proficiency: number };
export type CvExtras = { fullName: string | null; location: string | null; phone: string | null; closing: string | null; languages: CvLanguage[] };
export type Segment = { text: string; bold: boolean };
export type SkillGroup = { group: string; items: { name: string; learning: boolean }[] };
export type Resume = Portfolio & {
  cv: {
    fullName: string;
    nameLines: [string, string];
    initials: string;
    location: string | null;
    phone: string | null;
    closing: Segment[];
    languages: CvLanguage[];
    skillGroups: SkillGroup[];
    hasLearning: boolean;
    locale: Locale;
  };
};

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean);

// Primeira metade das palavras (arredondada para cima) na linha pesada, o resto na leve.
export function splitName(full: string): [string, string] {
  const w = words(full);
  const cut = Math.ceil(w.length / 2);
  return [w.slice(0, cut).join(" "), w.slice(cut).join(" ")];
}

export function initials(full: string): string {
  const w = words(full);
  if (w.length === 0) return "";
  return (w[0][0] + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase();
}

// "a **b** c" -> trechos alternando normal/negrito (os ímpares do split são os de dentro dos **).
export function parseBold(text: string | null): Segment[] {
  if (!text) return [];
  return text.split("**").map((t, i) => ({ text: t, bold: i % 2 === 1 })).filter((s) => s.text);
}

export function groupSkills(skills: Skill[]): SkillGroup[] {
  const groups = new Map<string, SkillGroup>();
  for (const s of skills) {
    if (!groups.has(s.group)) groups.set(s.group, { group: s.group, items: [] });
    groups.get(s.group)!.items.push({ name: s.name, learning: s.level === "learning" });
  }
  return [...groups.values()];
}

export function buildResume(p: Portfolio, x: CvExtras, locale: Locale): Resume {
  const fullName = x.fullName?.trim() || p.profile.name;
  return {
    ...p,
    cv: {
      fullName,
      nameLines: splitName(fullName),
      initials: initials(fullName),
      location: x.location,
      phone: x.phone,
      closing: parseBold(x.closing),
      languages: x.languages,
      skillGroups: groupSkills(p.skills),
      hasLearning: p.skills.some((s) => s.level === "learning"),
      locale,
    },
  };
}

const plain = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

export function cvFilename(fullName: string, locale: Locale, simple: boolean): string {
  // Vai num cabeçalho HTTP: só ASCII simples, senão a resposta falha.
  const w = words(plain(fullName)).map((x) => x.replace(/[^A-Za-z0-9-]/g, "")).filter(Boolean);
  const name = w.length > 1 ? [w[0], w[w.length - 1]] : w;
  return ["CV", ...name, locale.toUpperCase()].join("_") + (simple ? "_simples" : "") + ".pdf";
}

export const linkLabel = (url: string) => url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");

// O PDF só quebra linha em espaço; link longo ganha uma quebra depois da última "/" que cabe em `max`.
export function wrapLink(label: string, max: number): string {
  if (label.length <= max) return label;
  const cut = label.lastIndexOf("/", max - 1);
  return cut > 0 ? `${label.slice(0, cut + 1)}\n${label.slice(cut + 1)}` : label;
}
