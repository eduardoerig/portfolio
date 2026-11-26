"use client";

import Link from "next/link";
import { useId } from "react";

// Campos controlados do editor: o pai guarda o valor e recebe cada mudança.
// text-base no celular: abaixo de 16px o iPhone dá zoom ao focar. Borda com 3:1 de contraste (limite do campo).
export const inputClass =
  "w-full rounded-lg border border-[var(--control-border)] bg-[var(--surface)] px-3 py-2 text-base md:text-sm outline-offset-2 focus:outline-2 focus:outline-[var(--accent)]";

// Dica e erro ligados ao campo (aria-describedby): o leitor de tela lê junto com o rótulo.
export function useDescribed(hint?: string, error?: string) {
  const id = useId();
  const hintId = hint ? `${id}-dica` : undefined;
  const errorId = error ? `${id}-erro` : undefined;
  return {
    hintId,
    errorId,
    props: {
      "aria-invalid": error ? true : undefined,
      "aria-describedby": [hintId, errorId].filter(Boolean).join(" ") || undefined,
    },
  };
}

export const Hint = ({ id, text }: { id?: string; text?: string }) =>
  text ? <span id={id} className="text-xs text-[var(--muted)]">{text}</span> : null;

export const Err = ({ id, error }: { id?: string; error?: string }) =>
  error ? <span id={id} role="alert" className="text-xs text-[var(--danger)]">{error}</span> : null;

export function Field({ label, name, value, onChange, error, multiline, hint, placeholder }: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  multiline?: boolean;
  hint?: string;
  placeholder?: string;
}) {
  const d = useDescribed(hint, error);
  // Dica e erro fora do <label>: o nome do campo fica só o rótulo; eles chegam pelo aria-describedby.
  return (
    <div className="flex flex-col gap-1 text-sm">
      <label className="flex flex-col gap-1">
      {label}
      {multiline ? (
        <textarea name={name} value={value} rows={4} placeholder={placeholder} className={inputClass} onChange={(e) => onChange(e.target.value)} {...d.props} />
      ) : (
        <input name={name} value={value} placeholder={placeholder} className={inputClass} onChange={(e) => onChange(e.target.value)} {...d.props} />
      )}
      </label>
      <Hint id={d.hintId} text={hint} />
      <Err id={d.errorId} error={error} />
    </div>
  );
}

export function Select({ label, name, value, onChange, options, error }: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly (readonly [value: string, text: string])[];
  error?: string;
}) {
  const d = useDescribed(undefined, error);
  return (
    <div className="flex flex-col gap-1 text-sm">
      <label className="flex flex-col gap-1">
      {label}
      <select name={name} value={value} className={inputClass} onChange={(e) => onChange(e.target.value)} {...d.props}>
        {options.map(([v, text]) => <option key={v} value={v}>{text}</option>)}
      </select>
      </label>
      <Err id={d.errorId} error={error} />
    </div>
  );
}

export function Check({ label, name, checked, onChange }: {
  label: string;
  name: string;
  checked: boolean;
  onChange: (b: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

// Quando a Server Action lança (sessão expirada, item que já não existe, envio grande demais): o formulário fica como está.
export function ActionError() {
  return (
    <p role="alert" className="text-sm text-[var(--danger)]">
      Não foi possível salvar. Sua sessão pode ter expirado, ou o arquivo é grande demais. O que você digitou continua aqui.{" "}
      <Link href="/admin/login" target="_blank" rel="noopener noreferrer" className="underline">Entrar de novo em outra aba</Link>
    </p>
  );
}
