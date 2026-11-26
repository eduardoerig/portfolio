"use client";

import { useState } from "react";
import { cleanStorage } from "@/app/(admin)/admin/actions";

const mb = (bytes: number) => (bytes / 1024 / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 1 });

// Apaga do armazenamento imagens e PDFs que nenhum registro usa mais (envios abandonados, currículo antigo).
export default function StorageCleanup() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState(false);

  async function run() {
    setBusy(true);
    setError(false);
    try {
      const r = await cleanStorage();
      setResult(`${r.removed} ${r.removed === 1 ? "arquivo removido" : "arquivos removidos"} · ${mb(r.freedBytes)} MB liberados · total usado ${mb(r.totalBytes)} MB`);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card flex flex-wrap items-center gap-3">
      <span className="label">Armazenamento</span>
      <button type="button" className="btn" onClick={run} disabled={busy}>
        {busy ? "Limpando…" : "Limpar arquivos soltos"}
      </button>
      {result && <span className="text-sm text-[var(--muted)]">{result}</span>}
      {error && <span role="alert" className="text-sm text-[var(--danger)]">Não deu para limpar agora. Tente de novo.</span>}
    </section>
  );
}
