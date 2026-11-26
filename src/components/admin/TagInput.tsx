"use client";
import { useId, useState } from "react";
import { Err, Hint, inputClass, useDescribed } from "./controls";

const X = (
  <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M2 2l8 8M10 2l-8 8" />
  </svg>
);

// Lista de textos: etiquetas (stack) ou, com `long`, linhas editáveis (realizações).
export default function TagInput({ label, value, onChange, onPending, placeholder, hint, error, long }: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  onPending?: () => void; // há texto digitado ainda não confirmado: conta como alteração
  placeholder?: string;
  hint?: string;
  error?: string;
  long?: boolean;
}) {
  const id = useId();
  const d = useDescribed(hint, error);
  const [draft, setDraft] = useState("");
  const remove = (i: number) => onChange(value.filter((_, j) => j !== i));

  function commit() {
    const text = draft.trim();
    if (!text || value.includes(text)) return;
    onChange([...value, text]);
    setDraft("");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault(); // não envia o formulário
      commit();
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="flex flex-col gap-1 text-sm">
      <label htmlFor={id}>{label}</label>
      {long && value.map((text, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            aria-label={`${label} ${i + 1}`}
            value={text}
            className={inputClass}
            onChange={(e) => onChange(value.map((t, j) => (j === i ? e.target.value : t)))}
          />
          <button type="button" aria-label={`Remover ${text}`} onClick={() => remove(i)} className="btn px-2">{X}</button>
        </div>
      ))}
      <div className={`${inputClass} flex flex-wrap items-center gap-2 focus-within:outline-2 focus-within:outline-[var(--accent)]`}>
        {!long && value.map((text, i) => (
          <span key={i} className="chip inline-flex items-center gap-1">
            {text}
            <button type="button" aria-label={`Remover ${text}`} onClick={() => remove(i)} className="-m-1 rounded-full p-1.5 hover:text-[var(--danger)]">{X}</button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => {
            setDraft(e.target.value);
            if (e.target.value.trim()) onPending?.();
          }}
          onBlur={commit}
          onKeyDown={onKeyDown}
          className="min-w-24 flex-1 bg-transparent outline-none"
          {...d.props}
        />
      </div>
      <Hint id={d.hintId} text={hint} />
      <Err id={d.errorId} error={error} />
    </div>
  );
}
