"use client";

import type { ReactNode } from "react";
import type { Locale } from "@/i18n/locales";
import { ActionError, Field } from "./controls";
import TagInput from "./TagInput";
import type { Editor } from "./useEditor";

// Esquerda: formulário; direita: prévia (embaixo do formulário abaixo de lg).
export default function EditorFrame({ title, editor, preview, cancel, children }: {
  title: string;
  editor: Editor;
  preview: ReactNode;
  cancel?: ReactNode;
  children: ReactNode;
}) {
  const { draft, locale, setLocale, failed, pending, submit, errors } = editor;
  // Ponto no EN quando há texto em português sem a tradução.
  const empty = (v: unknown) => (Array.isArray(v) ? v.length === 0 : !v);
  const missing = Object.entries(draft).some(([k, v]) => k.endsWith("En") && empty(v) && !empty(draft[k.slice(0, -2)]));


  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="card flex flex-col gap-4"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <div role="radiogroup" aria-label="Idioma" className="flex gap-1">
            {(["pt", "en"] as Locale[]).map((l) => (
              <button
                key={l}
                type="button"
                role="radio"
                aria-checked={locale === l}
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
        {failed && <ActionError />}
        {Object.keys(errors).length > 0 && <p role="alert" className="text-sm text-[var(--danger)]">Corrija os campos destacados.</p>}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={pending} className="btn btn-primary">{pending ? "Salvando..." : "Salvar"}</button>
          {cancel}
        </div>
      </form>
      {preview}
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
