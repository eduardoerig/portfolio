// Troca o item com o vizinho e devolve uma lista nova. Id desconhecido ou na ponta: lista igual.
export function moveItem<T extends { id: number }>(items: T[], id: number, dir: "up" | "down"): T[] {
  const from = items.findIndex((i) => i.id === id);
  const to = dir === "up" ? from - 1 : from + 1;
  if (from === -1 || to < 0 || to >= items.length) return [...items];
  const copy = [...items];
  [copy[from], copy[to]] = [copy[to], copy[from]];
  return copy;
}
