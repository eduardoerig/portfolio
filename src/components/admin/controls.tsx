import Link from "next/link";

// Campos controlados do editor: o pai guarda o valor e recebe cada mudança.
export const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-offset-2 focus:outline-2 focus:outline-[var(--accent)]";

const Err = ({ error }: { error?: string }) =>
  error ? <span role="alert" className="text-xs text-[var(--danger)]">{error}</span> : null;

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
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      {multiline ? (
        <textarea name={name} value={value} rows={4} placeholder={placeholder} className={inputClass} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input name={name} value={value} placeholder={placeholder} className={inputClass} onChange={(e) => onChange(e.target.value)} />
      )}
      {hint && <span className="text-xs text-[var(--muted)]">{hint}</span>}
      <Err error={error} />
    </label>
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
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <select name={name} value={value} className={inputClass} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, text]) => <option key={v} value={v}>{text}</option>)}
      </select>
      <Err error={error} />
    </label>
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
      Não foi possível salvar. Sua sessão pode ter expirado ou o arquivo é grande demais — entre de novo em outra aba (o que você digitou fica aqui) e volte para salvar.{" "}
      <Link href="/admin/login" target="_blank" rel="noopener noreferrer" className="underline">Ir para o login (nova aba)</Link>
    </p>
  );
}
