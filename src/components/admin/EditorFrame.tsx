"use client";

import { useState, type ReactNode } from "react";
import { ActionError } from "./controls";
import type { Editor } from "./useEditor";

// Esquerda: formulário; direita: prévia. Abaixo de lg a prévia abre por um botão, acima do formulário.
export default function EditorFrame({ title, editor, autosave, preview, cancel, header, children }: {
  title: string;
  editor: Editor;
  autosave: boolean;
  preview: ReactNode;
  cancel?: ReactNode;
  /** Chaves do cabeçalho (ex.: "Visível no site"). */
  header?: ReactNode;
  children: ReactNode;
}) {
  const { failed, pending, uploading, submit, flush, errors, status, undo } = editor;
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <button type="button" aria-expanded={showPreview} onClick={() => setShowPreview((v) => !v)} className="btn order-first lg:hidden">
        {showPreview ? "Esconder prévia" : "Ver prévia"}
      </button>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void (autosave ? flush() : submit());
        }}
        className="card card-static flex min-w-0 flex-col gap-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="min-w-0 break-words text-lg font-semibold">{title}</h2>
          {header}
        </div>
        <p className="text-xs text-[var(--muted)]">* obrigatório</p>
        {children}
        {!autosave && failed && <ActionError />}
        {!autosave && Object.keys(errors).length > 0 && <p role="alert" className="text-sm text-[var(--danger)]">Corrija os campos destacados.</p>}
        {/* Fica presa no rodapé do cartão ao rolar: status e Voltar/Criar sempre à vista (no celular, principalmente). */}
        <div className="sticky bottom-0 z-10 -mx-5 -mb-5 mt-2 flex flex-wrap items-center gap-3 rounded-b-2xl border-t border-[var(--border)] bg-[var(--surface)] px-5 py-3">
          {autosave ? (
            <div aria-live="polite" className="flex flex-wrap items-center gap-2 text-sm">
              {status === "waiting" && <span className="text-[var(--muted)]">Alterações pendentes…</span>}
              {status === "saving" && <span>Salvando…</span>}
              {status === "saved" && (
                <>
                  <span>Salvo ✓</span>
                  {undo && <button type="button" onClick={undo} className="btn">Desfazer última gravação</button>}
                </>
              )}
              {status === "invalid" && <span role="alert" className="text-[var(--danger)]">Corrija os campos destacados.</span>}
              {status === "error" && (
                <>
                  <span role="alert" className="text-[var(--danger)]">Sem conexão com o servidor. Tentando de novo…</span>
                  <button type="button" onClick={() => void submit()} className="btn">Tentar agora</button>
                </>
              )}
              {status === "auth" && (
                <span role="alert" className="text-[var(--danger)]">
                  Sua sessão expirou.{" "}
                  <a href="/admin/login" target="_blank" rel="noopener" className="underline">Entre de novo em outra aba</a>
                  ; o que você digitou continua aqui e é gravado quando você voltar.
                </span>
              )}
            </div>
          ) : (
            <button type="submit" disabled={pending} className="btn btn-primary">{uploading ? "Enviando…" : pending ? "Salvando…" : "Criar"}</button>
          )}
          {cancel}
        </div>
      </form>
      <div className={`${showPreview ? "order-first" : "hidden"} min-w-0 lg:order-none lg:block`}>{preview}</div>
    </div>
  );
}
