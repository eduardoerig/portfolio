"use client";

import { useId } from "react";
import type { FieldDef } from "@/lib/formModel";
import { Err, Hint, inputClass, useDescribed } from "../controls";

// Peças comuns a todo campo do modelo: marca de obrigatório, contador, controle de texto e a chave liga/desliga.

export const Star = () => <span aria-hidden="true" className="text-[var(--danger)]"> *</span>;

// "42/50": a referência é o tamanho recomendado; passa dele fica âmbar, passa do máximo fica vermelho.
export function Counter({ def, value }: { def: FieldDef; value: string }) {
  if (!def.max) return null;
  const limit = def.recommended ?? def.max;
  const len = value.length;
  const tone = len > def.max ? "text-[var(--danger)]" : len > limit ? "text-[var(--hue-amber)]" : "text-[var(--muted)]";
  return <span className={`ml-auto shrink-0 text-xs tabular-nums ${tone}`}>{len}/{limit}</span>;
}

type ControlProps = {
  def: FieldDef;
  id?: string;
  value: string;
  onChange(v: string): void;
  onFocus?(): void;
  onBlur?(): void;
  ariaLabel?: string;
  placeholder?: string;
  required?: boolean;
  describedBy?: string;
  invalid?: boolean;
};

// Texto, texto longo, link ou e-mail. type="text" de propósito: a validação é a do modelo, não a do navegador.
export function TextControl({ def, id, value, onChange, onFocus, onBlur, ariaLabel, placeholder, required, describedBy, invalid }: ControlProps) {
  const common = {
    id,
    name: undefined,
    value,
    placeholder,
    className: inputClass,
    "aria-label": ariaLabel,
    "aria-required": required || undefined,
    "aria-invalid": invalid || undefined,
    "aria-describedby": describedBy,
    onFocus,
    onBlur,
  };
  if (def.type === "textarea") return <textarea {...common} rows={4} onChange={(e) => onChange(e.target.value)} />;
  const inputMode = def.type === "url" ? "url" : def.type === "email" ? "email" : undefined;
  return <input {...common} type="text" inputMode={inputMode} onChange={(e) => onChange(e.target.value)} />;
}

// Campo de um idioma só (nome, e-mail, link...).
export function SingleField({ def, value, error, onChange, onBlur }: { def: FieldDef; value: string; error?: string; onChange(v: string): void; onBlur(): void }) {
  const id = useId();
  const d = useDescribed(def.hint, error);
  return (
    <div className="flex flex-col gap-1 text-sm">
      {/* O * fica fora do <label>: o nome do campo é só o texto (o obrigatório vai em aria-required). */}
      <span>
        <label htmlFor={id}>{def.label}</label>
        {def.required && <Star />}
      </span>
      <TextControl
        def={def}
        id={id}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={def.placeholder}
        required={def.required}
        describedBy={d.props["aria-describedby"]}
        invalid={Boolean(error)}
      />
      <div className="flex items-start gap-2">
        <Hint id={d.hintId} text={def.hint} />
        <Counter def={def} value={value} />
      </div>
      <Err id={d.errorId} error={error} />
    </div>
  );
}

// Liga/desliga acessível (role="switch"): para "Visível no site", "Aberto a oportunidades"...
export function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange(b: boolean): void }) {
  const id = useId();
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors ${
          checked ? "border-[var(--accent-strong)] bg-[var(--accent-strong)]" : "border-[var(--control-border)] bg-[var(--surface)]"
        }`}
      >
        <span
          aria-hidden="true"
          className={`inline-block size-4 rounded-full bg-[var(--fg)] transition-transform ${checked ? "translate-x-6 bg-white" : "translate-x-1"}`}
        />
      </button>
      <label htmlFor={id}>{label}</label>
    </span>
  );
}
