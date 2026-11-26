import { db } from "@/lib/db";

export type Kind = "project" | "experience" | "skill" | "education" | "language";

// Ordem estável: empate em "order" desempata pelo id.
export const ORDER = [{ order: "asc" as const }, { id: "asc" as const }];

// Os modelos têm as mesmas colunas id/order/visible; só isso é usado de forma genérica.
export type Row = { id: number; order: number; visible: boolean } & Record<string, unknown>;

export type Table = {
  findMany(args: { orderBy: typeof ORDER }): Promise<Row[]>;
  findUnique(args: { where: { id: number } }): Promise<Row | null>;
  create(args: { data: Record<string, unknown> }): Promise<unknown>;
  update(args: { where: { id: number }; data: Record<string, unknown> }): Promise<unknown>;
  delete(args: { where: { id: number } }): Promise<unknown>;
};

// Vem do cliente (Server Actions são endpoints públicos): confere em tempo de execução.
export function assertKind(kind: unknown): asserts kind is Kind {
  if (!["project", "experience", "skill", "education", "language"].includes(kind as string)) throw new Error("Tipo inválido");
}

export function table(kind: Kind): Table {
  assertKind(kind);
  const tables = { project: db.project, experience: db.experience, skill: db.skill, education: db.education, language: db.language };
  return tables[kind] as unknown as Table;
}
