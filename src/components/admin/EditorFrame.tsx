"use client";

import { useState, type ReactNode } from "react";
import type { Locale } from "@/i18n/locales";
import { ActionError, Field } from "./controls";
import TagInput from "./TagInput";
import type { Editor } from "./useEditor";

// Esquerda: formulário; direita: prévia. Abaixo de lg a prévia abre por um botão, acima do formulário.
export default function EditorFrame({ title, editor, autosave, preview, cancel, children }: {
  title: string;
  editor: Editor;
  autosave: boolean;
  preview: ReactNode;
  cancel?: ReactNode;
  children: ReactNode;
}) {
  const { draft, locale, setLocale, failed, pending, uploading, submit, flush, errors, status, undo } = editor;
  // Ponto no EN quando há texto em português sem a tradução.
  const empty = (v: unknown) => (Array.isArray(v) ? v.length === 0 : !v);
  const missing = Object.entries(draft).some(([k, v]) => k.endsWith("En") && empty(v) && !empty(draft[k.slice(0, -2)]));
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <button type="button" aria-expanded={showPreview} onClick={() => setShowPreview((v) => !v)} className="btn order-first lg:hidden">
        {showPreview ? "Esconder prévia" : "Ver prévia"}
      </button>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void (autosave ? flush() : submit());
        }}
        className="card card-static flex min-w-0 flex-col gap-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="min-w-0 break-words text-lg font-semibold">{title}</h2>
          <div role="group" aria-label="Idioma do conteúdo" className="flex gap-1">
            {(["pt", "en"] as Locale[]).map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={locale === l}
                onClick={() => setLocale(l)}
                className={`btn px-3 ${locale === l ? "btn-primary" : ""}`}
              >
                {l.toUpperCase()}
                {l === "en" && missing && (
                  <>
                    <span aria-hidden="true" className="ml-1 inline-block size-2 rounded-full bg-[var(--accent)]" />
                    <span className="sr-only">tradução incompleta</span>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
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

// Campo traduzível: PT mostra `name`, EN mostra `${name}En` com o português de placeholder.
export function Tr({ editor, label, name, multiline, hint }: { editor: Editor; label: string; name: string; multiline?: boolean; hint?: string }) {
  const { draft, locale, set, errors } = editor;
  const key = locale === "en" ? `${name}En` : name;
  return (
    <Field
      label={label}
      name={key}
      value={String(draft[key] ?? "")}
      onChange={(v) => set(key, v)}
      error={errors[key]}
      multiline={multiline}
      hint={hint}
      placeholder={locale === "en" ? String(draft[name] ?? "") : undefined}
    />
  );
}

export function TrList({ editor, label, name, long, hint }: { editor: Editor; label: string; name: string; long?: boolean; hint?: string }) {
  const { draft, locale, set, errors } = editor;
  const key = locale === "en" ? `${name}En` : name;
  return (
    <TagInput
      label={label}
      value={draft[key] as string[]}
      onChange={(v) => set(key, v)}
      onPending={editor.touch}
      error={errors[key]}
      long={long}
      hint={hint}
      placeholder={locale === "en" ? (draft[name] as string[]).join(", ") : undefined}
    />
  );
}
