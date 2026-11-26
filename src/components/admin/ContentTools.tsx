"use client";

import { useState } from "react";
import { checkLinks, exportContent, type LinkCheck } from "@/app/(admin)/admin/actions";

const today = () => new Date().toISOString().slice(0, 10);

// Ferramentas do conteúdo: backup em JSON (o banco não faz sozinho) e verificação dos links do site.
export default function ContentTools() {
  const [busy, setBusy] = useState<"backup" | "links" | null>(null);
  const [backup, setBackup] = useState<string | null>(null);
  const [links, setLinks] = useState<LinkCheck[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setBusy("backup");
    setError(null);
    try {
      const data = await exportContent();
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `portfolio-backup-${today()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBackup(`Backup baixado (${a.download}).`);
    } catch {
      setError("Não deu para gerar o backup agora. Tente de novo.");
    } finally {
      setBusy(null);
    }
  }

  async function verify() {
    setBusy("links");
    setError(null);
    try {
      setLinks(await checkLinks());
    } catch {
      setError("Não deu para verificar os links agora. Tente de novo.");
    } finally {
      setBusy(null);
    }
  }

  const broken = links?.filter((l) => l.state === "broken") ?? [];
  const unknown = links?.filter((l) => l.state === "unknown") ?? [];

  return (
    <section className="card card-static flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="label">Ferramentas</span>
        <button type="button" className="btn" onClick={download} disabled={busy !== null}>
          {busy === "backup" ? "Gerando…" : "Baixar backup (JSON)"}
        </button>
        <button type="button" className="btn" onClick={verify} disabled={busy !== null}>
          {busy === "links" ? "Verificando…" : "Verificar links"}
        </button>
      </div>
      <p className="text-xs text-[var(--muted)]">
        O backup guarda todo o texto do painel. Baixe de vez em quando e antes de mudanças grandes.
      </p>
      {backup && <span className="text-sm text-[var(--muted)]">{backup}</span>}
      {links && (
        <div className="flex flex-col gap-2 text-sm" aria-live="polite">
          {broken.length === 0 && unknown.length === 0 && <span>Todos os links responderam ({links.length}).</span>}
          {broken.length > 0 && (
            <>
              <span className="text-[var(--danger)]">
                {broken.length} {broken.length === 1 ? "link quebrado" : "links quebrados"}:
              </span>
              <ul className="flex flex-col gap-1">
                {broken.map((l) => (
                  <li key={l.url} className="break-words">
                    <strong>{l.label}</strong>{" "}
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-[var(--muted)] underline">{l.url}</a>
                    {" "}({l.status ?? "sem resposta"})
                  </li>
                ))}
              </ul>
            </>
          )}
          {unknown.length > 0 && (
            <span className="text-[var(--muted)]">
              {unknown.map((l) => l.label).join(", ")}: o site não deixa verificar automaticamente; confira abrindo o link.
            </span>
          )}
        </div>
      )}
      {error && <span role="alert" className="text-sm text-[var(--danger)]">{error}</span>}
    </section>
  );
}
