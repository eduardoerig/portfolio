import { parseList } from "@/lib/lists";
import type { Locale } from "@/i18n/locales";
import type { SkillLevel } from "@/lib/types";

// Usa o texto em inglês quando existir; senão cai no português.
export const pick = (locale: Locale, pt: string, en: string | null) =>
  locale === "en" && en ? en : pt;
export const pickNull = (locale: Locale, pt: string | null, en: string | null) =>
  locale === "en" && en ? en : pt;
export const pickList = (locale: Locale, pt: string, en: string | null): string[] => {
  const list = parseList(locale === "en" && en ? en : pt);
  return list.length === 0 ? parseList(pt) : list;
};

// A coluna é texto livre no banco; qualquer valor desconhecido vira "sem rótulo".
export const toLevel = (v: string | null): SkillLevel => (v === "learning" || v === "intermediate" ? v : null);
