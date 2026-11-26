"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { deleteItem, duplicateItem, move, toggleVisible } from "@/app/(admin)/admin/actions";
import type { Kind } from "@/lib/tables";
import { useAdminStatus } from "./AdminStatus";
import { ActionError } from "./controls";

// Client porque a Server Action pode lançar (sessão expirada, item já apagado) e o erro precisa aparecer aqui, sem derrubar a página.
export default function RowActions({ kind, id, name, visible, editHref, first = false, last = false }: { kind: Kind; id: number; name?: string; visible: boolean; editHref: string; first?: boolean; last?: boolean }) {
  // Nome do item no rótulo: na lista, "Excluir" sozinho se repete em toda linha para o leitor de tela.
  const of = (action: string) => (name ? `${action} ${name}` : action);
  const { notify, scheduleDelete } = useAdminStatus();
  const [failed, setFailed] = useState(false);
  const [pending, start] = useTransition();

  const run = (action: () => Promise<void>, done?: string) =>
    start(async () => {
      try {
        await action();
        setFailed(false);
        if (done) notify(done);
      } catch {
        setFailed(true);
      }
    });

  // aria-disabled em vez de disabled: o botão continua focável e o teclado não perde o lugar.
  const guard = (off: boolean, fn: () => void) => () => {
    if (!off && !pending) fn();
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      <button className="btn btn-icon aria-disabled:opacity-40" aria-disabled={pending || first} aria-label={of("Subir")} title="Subir" onClick={guard(first, () => run(() => move(kind, id, "up")))}><Icon d="M12 19V5M5 12l7-7 7 7" /></button>
      <button className="btn btn-icon aria-disabled:opacity-40" aria-disabled={pending || last} aria-label={of("Descer")} title="Descer" onClick={guard(last, () => run(() => move(kind, id, "down")))}><Icon d="M12 5v14M19 12l-7 7-7-7" /></button>
      <button
        className="btn btn-icon aria-disabled:opacity-40"
        aria-disabled={pending}
        aria-label={of(visible ? "Ocultar" : "Mostrar")}
        title={visible ? "Ocultar do site" : "Mostrar no site"}
        onClick={guard(false, () => run(() => toggleVisible(kind, id), visible ? "Item ocultado do site." : "Item visível no site."))}
      >
        <Icon d={visible ? "M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12ZM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" : "M17.9 17.9A10.9 10.9 0 0 1 12 19C5 19 1 12 1 12a18 18 0 0 1 5.1-5.9M9.9 5.1A10.4 10.4 0 0 1 12 5c7 0 11 7 11 7a18 18 0 0 1-2.2 3.2M1 1l22 22"} />
      </button>
      <Link href={editHref} className="btn btn-icon" aria-label={of("Editar")} title="Editar"><Icon d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></Link>
      <button
        className="btn btn-icon aria-disabled:opacity-40"
        aria-disabled={pending}
        aria-label={of("Duplicar")}
        title="Duplicar"
        onClick={guard(false, () => run(() => duplicateItem(kind, id), "Cópia criada (oculta, no fim da lista)."))}
      >
        <Icon d="M9 9h11v11H9zM5 15H4V4h11v1" />
      </button>
      <button
        className="btn btn-icon btn-danger aria-disabled:opacity-40"
        aria-disabled={pending}
        aria-label={of("Excluir")}
        title="Excluir"
        onClick={guard(false, () => scheduleDelete(`${kind}:${id}`, () => deleteItem(kind, id)))}
      >
        <Icon d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
      </button>
      {failed && <div className="w-full"><ActionError /></div>}
    </div>
  );
}

// Ícone de traço (grade 24×24), em currentColor.
function Icon({ d }: { d: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
