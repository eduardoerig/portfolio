// Lista guardada como JSON: se estiver quebrada, melhor uma lista vazia do que derrubar o site.
export function parseList(raw: string | null): string[] {
  try {
    const list: unknown = JSON.parse(raw ?? "[]");
    return Array.isArray(list) ? list.map(String) : [];
  } catch {
    return [];
  }
}
