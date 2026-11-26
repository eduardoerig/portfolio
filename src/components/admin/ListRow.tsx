"use client";

import type { ReactNode } from "react";
import { useAdminStatus } from "./AdminStatus";

// Linha da lista: some enquanto a exclusão dela espera o Desfazer.
export default function ListRow({ rowKey, children }: { rowKey: string; children: ReactNode }) {
  const { hidden } = useAdminStatus();
  if (hidden.has(rowKey)) return null;
  return <li className="flex flex-wrap items-center gap-3">{children}</li>;
}
