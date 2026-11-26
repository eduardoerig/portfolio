import type { Locale } from "@/i18n/locales";
import { fileUrl } from "@/lib/fileUrl";
import { parseList } from "@/lib/lists";
import { pick, pickList, pickNull, toLevel } from "@/lib/localize";
import type { Kind } from "@/lib/tables";
import type { Education, Experience, Profile, Project, Skill } from "@/lib/types";

export type EditorKind = "profile" | Kind;
// Os que aparecem no site (idiomas só vão para o currículo).
type SiteKind = Exclude<Kind, "language">;
export type Draft = Record<string, string | boolean | string[]>;

export const LIST_FIELDS = ["stack", "stackEn", "bullets", "bulletsEn"];
export const BOOL_FIELDS = ["visible", "current", "openToWork"];

// Os campos que a action de cada kind lê (ver os schemas em actions.ts).
const FIELDS: Record<EditorKind, string[]> = {
  profile: ["name", "role", "roleEn", "summary", "summaryEn", "email", "githubUrl", "linkedinUrl", "openToWork",
    "fullName", "location", "locationEn", "phone", "cvClosing", "cvClosingEn"],
  project: ["title", "titleEn", "description", "descriptionEn", "stack", "stackEn", "url", "metric", "metricEn", "visible"],
  experience: ["role", "roleEn", "company", "location", "locationEn", "period", "periodEn", "bullets", "bulletsEn", "current", "visible"],
  skill: ["name", "nameEn", "group", "groupEn", "level", "visible"],
  education: ["course", "courseEn", "school", "period", "periodEn", "note", "noteEn", "visible"],
  language: ["name", "nameEn", "level", "levelEn", "proficiency", "visible"],
};

const fieldValue = (k: string, v: unknown) =>
  LIST_FIELDS.includes(k) ? parseList(v as string | null) : BOOL_FIELDS.includes(k) ? Boolean(v) : String(v ?? "");

export function rowToDraft(row: Record<string, unknown> | null, kind: EditorKind): Draft {
  if (!row) {
    const d: Draft = { id: "" };
    for (const k of FIELDS[kind]) d[k] = fieldValue(k, null);
    if (kind !== "profile") d.visible = true;
    if (kind === "language") d.proficiency = "3"; // a barra começa no meio
    return d;
  }
  return Object.fromEntries(Object.entries(row).map(([k, v]) => [k, fieldValue(k, v)]));
}

// Mesmas chaves que as server actions leem: lista em linhas, checkbox "on"/ausente, remove_<campo>.
// keys: chave já guardada no armazenamento para cada campo de arquivo (o arquivo em si nunca vai junto).
export function draftToFormData(draft: Draft, keys: Record<string, string>, removed: string[]): FormData {
  const form = new FormData();
  for (const [k, v] of Object.entries(draft)) {
    if (v === true) form.set(k, "on");
    else if (typeof v === "string") form.set(k, v);
    else if (Array.isArray(v)) form.set(k, v.join("\n"));
  }
  for (const [k, key] of Object.entries(keys)) form.set(`${k}Key`, key);
  for (const name of removed) form.set(`remove_${name}`, "on");
  return form;
}

const str = (d: Draft, k: string) => (typeof d[k] === "string" ? (d[k] as string) : "");
const strOrNull = (d: Draft, k: string) => str(d, k) || null;
const bool = (d: Draft, k: string) => d[k] === true;
const arr = (d: Draft, k: string) => (Array.isArray(d[k]) ? (d[k] as string[]) : []);
// pickList espera JSON (o formato do banco); inglês vazio vira null e cai no português.
const jsonList = (d: Draft, k: string) => JSON.stringify(arr(d, k));
const jsonListEn = (d: Draft, k: string) => (arr(d, `${k}En`).length ? jsonList(d, `${k}En`) : null);
const id = (d: Draft) => Number(d.id) || -1;

export function profilePreview(d: Draft, locale: Locale, photoUrl?: string | null): Profile {
  return {
    name: str(d, "name"),
    role: pick(locale, str(d, "role"), strOrNull(d, "roleEn")),
    summary: pick(locale, str(d, "summary"), strOrNull(d, "summaryEn")),
    openToWork: bool(d, "openToWork"),
    email: str(d, "email"),
    githubUrl: str(d, "githubUrl"),
    linkedinUrl: str(d, "linkedinUrl"),
    photoPath: photoUrl ?? fileUrl(strOrNull(d, "photoPath")),
  };
}

export function itemPreview(kind: "project", d: Draft, locale: Locale, imageUrl?: string | null): Project;
export function itemPreview(kind: "experience", d: Draft, locale: Locale, imageUrl?: string | null): Experience;
export function itemPreview(kind: "skill", d: Draft, locale: Locale, imageUrl?: string | null): Skill;
export function itemPreview(kind: "education", d: Draft, locale: Locale, imageUrl?: string | null): Education;
export function itemPreview(kind: SiteKind, d: Draft, locale: Locale, imageUrl?: string | null): Project | Experience | Skill | Education;
export function itemPreview(kind: SiteKind, d: Draft, locale: Locale, imageUrl?: string | null): Project | Experience | Skill | Education {
  const p = (k: string) => pick(locale, str(d, k), strOrNull(d, `${k}En`));
  const pn = (k: string) => pickNull(locale, strOrNull(d, k), strOrNull(d, `${k}En`));
  const pl = (k: string) => pickList(locale, jsonList(d, k), jsonListEn(d, k));
  const base = { id: id(d) };
  switch (kind) {
    case "project":
      return { ...base, title: p("title"), description: p("description"), stack: pl("stack"), url: strOrNull(d, "url"), imagePath: imageUrl ?? fileUrl(strOrNull(d, "imagePath")), metric: pn("metric") };
    case "experience":
      return { ...base, role: p("role"), company: str(d, "company"), location: p("location"), period: p("period"), bullets: pl("bullets"), current: bool(d, "current") };
    case "skill":
      return { ...base, name: p("name"), group: p("group"), level: toLevel(strOrNull(d, "level")) };
    case "education":
      return { ...base, course: p("course"), school: str(d, "school"), period: p("period"), note: pn("note") };
  }
}
