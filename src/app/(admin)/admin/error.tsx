"use client";

import Link from "next/link";

// Aparece quando algo lança durante a renderização do painel (ex.: sessão expirada). `reset` tenta renderizar de novo.
export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex max-w-3xl flex-col items-start gap-4 p-6">
      <h1 className="text-xl font-semibold">Algo deu errado</h1>
      <p className="text-sm text-[var(--muted)]">Sua sessão pode ter expirado. Tente de novo ou entre de novo.</p>
      <div className="flex gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">Tentar de novo</button>
        <Link href="/admin/login" className="btn">Ir para o login</Link>
      </div>
    </main>
  );
}
