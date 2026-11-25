// Idiomas do site. Português é o padrão e fica na raiz; inglês fica em /en.
export type Locale = "pt" | "en";

export const LOCALES: Locale[] = ["pt", "en"];

export function localePath(locale: Locale): string {
  return locale === "pt" ? "/" : "/en";
}
