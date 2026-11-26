import type { Kind } from "@/lib/tables";

// Campo que dá nome ao item (título do editor, rótulo das ações da linha).
export const TITLE_KEY: Record<Kind, string> = { project: "title", experience: "role", skill: "name", education: "course", language: "name" };

export const itemTitle = (kind: Kind, row: Record<string, unknown>) => String(row[TITLE_KEY[kind]] ?? "");
