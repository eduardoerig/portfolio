"use client";

import { useState } from "react";
import { cleanStorage } from "@/app/(admin)/admin/actions";

type Result = Awaited<ReturnType<typeof cleanStorage>>;
const mb = (bytes: number) => (bytes / 1024 / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
const files = (n: number) => `${n} ${n === 1 ? "arquivo" : "arquivos"}`;

// Apaga do armazenamento imagens que nenhum registro usa mais. Primeiro mostra o que sairia; apaga só ao confirmar.
export default function StorageCleanup() {
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<Result | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function check(apply: boolean) {
    setBusy(true);
    setError(null);
    try {
      const r = await cleanStorage(apply);
      if (apply) {
        setPreview(null);
        setDone(`${files(r.removed)} ${r.removed === 1 ? "apagado" : "apagados"} · ${mb(r.freedBytes)} MB liberados · total usado ${mb(r.totalBytes)} MB`);
      } else {
        setDone(null);
        setPreview(r);
      }
    } catch {
      setError(apply ? "Não deu para apagar agora. Tente de novo." : "Não deu para verificar agora. Tente de novo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card card-static flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="label">Armazenamento</span>
        <button type="button" className="btn" onClick={() => check(false)} disabled={busy}>
          {busy && !preview ? "Verificando…" : "Ver arquivos não usados"}
        </button>
      </div>
      <p className="text-xs text-[var(--muted)]">
        Imagens trocadas ou removidas ficam guardadas por 24 h (para o Desfazer). Depois disso, podem ser apagadas aqui.
      </p>
      {preview && preview.removed === 0 && (
        <span className="text-sm text-[var(--muted)]">Nenhum arquivo não usado · total usado {mb(preview.totalBytes)} MB</span>
      )}
      {preview && preview.removed > 0 && (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span>{files(preview.removed)} não {preview.removed === 1 ? "usado" : "usados"} ({mb(preview.freedBytes)} MB).</span>
          <button type="button" className="btn text-[var(--danger)]" onClick={() => check(true)} disabled={busy}>
            {busy ? "Apagando…" : `Apagar ${files(preview.removed)}`}
          </button>
          <button type="button" className="btn" onClick={() => setPreview(null)} disabled={busy}>Cancelar</button>
        </div>
      )}
      {done && <span className="text-sm text-[var(--muted)]">{done}</span>}
      {error && <span role="alert" className="text-sm text-[var(--danger)]">{error}</span>}
    </section>
  );
}
