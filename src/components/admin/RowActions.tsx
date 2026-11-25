"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { deleteItem, move, toggleVisible } from "@/app/(admin)/admin/actions";
import type { Kind } from "@/lib/tables";
import { ActionError } from "./fields";

// Client porque a Server Action pode lançar (sessão expirada, item já apagado) e o erro precisa aparecer aqui, sem derrubar a página.
export default function RowActions({ kind, id, visible, editHref }: { kind: Kind; id: number; visible: boolean; editHref: string }) {
  const [failed, setFailed] = useState(false);
  const [pending, start] = useTransition();

  const run = (action: () => Promise<void>) =>
    start(async () => {
      try {
        await action();
        setFailed(false);
      } catch {
        setFailed(true);
      }
    });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button className="btn" disabled={pending} aria-label="Subir" title="Subir" onClick={() => run(() => move(kind, id, "up"))}>↑</button>
      <button className="btn" disabled={pending} aria-label="Descer" title="Descer" onClick={() => run(() => move(kind, id, "down"))}>↓</button>
      <button className="btn" disabled={pending} onClick={() => run(() => toggleVisible(kind, id))}>{visible ? "ocultar" : "mostrar"}</button>
      <Link href={editHref} className="btn">editar</Link>
      <button
        className="btn"
        disabled={pending}
        onClick={() => { if (confirm("Excluir este item? Não dá para desfazer.")) run(() => deleteItem(kind, id)); }}
      >
        excluir
      </button>
      {failed && <div className="w-full"><ActionError /></div>}
    </div>
  );
}
