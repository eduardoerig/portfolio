// Campos de formulário do painel. Sem estado: o valor inicial vem de defaultValue.
import Link from "next/link";

const input = "w-full rounded-md border border-current/20 bg-transparent px-3 py-2 text-sm";

type FieldProps = {
  label: string;
  name: string;
  defaultValue?: string;
  error?: string;
  multiline?: boolean;
  hint?: string;
};

export function Field({ label, name, defaultValue = "", error, multiline, hint }: FieldProps) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      {multiline ? (
        <textarea name={name} defaultValue={defaultValue} rows={4} className={input} />
      ) : (
        <input name={name} defaultValue={defaultValue} className={input} />
      )}
      {hint && <span className="text-xs text-[var(--muted)]">{hint}</span>}
      {error && <span role="alert" className="text-xs text-[var(--danger)]">{error}</span>}
    </label>
  );
}

// Campo traduzível: o par "Português" (obrigatório) e "English (opcional)" (cai no português se vazio).
export function Pair({ label, name, row, errors, multiline, hint }: {
  label: string;
  name: string; // o campo em inglês é `${name}En`
  row: Record<string, string>;
  errors?: Record<string, string>;
  multiline?: boolean;
  hint?: string;
}) {
  return (
    <fieldset className="grid gap-3 sm:grid-cols-2">
      <legend className="sr-only">{label}</legend>
      <Field label={`${label} — Português`} name={name} defaultValue={row[name]} error={errors?.[name]} multiline={multiline} hint={hint} />
      <Field label={`${label} — English (opcional)`} name={`${name}En`} defaultValue={row[`${name}En`]} error={errors?.[`${name}En`]} multiline={multiline} hint={hint} />
    </fieldset>
  );
}

export function Select({ label, name, defaultValue = "", error, options }: {
  label: string;
  name: string;
  defaultValue?: string;
  error?: string;
  options: readonly (readonly [value: string, text: string])[];
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <select name={name} defaultValue={defaultValue} className={input}>
        {options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
      </select>
      {error && <span role="alert" className="text-xs text-[var(--danger)]">{error}</span>}
    </label>
  );
}

export function Check({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
      {label}
    </label>
  );
}

// Campo de arquivo. Se já existe um arquivo, mostra o link e a opção de remover (remove_<name>).
export function FileField({ label, name, accept, current, error, hint }: {
  label: string;
  name: string;
  accept: string;
  current?: string;
  error?: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1 text-sm">
      <label className="flex flex-col gap-1">
        {label}
        <input type="file" name={name} accept={accept} className={input} />
      </label>
      {hint && <span className="text-xs text-[var(--muted)]">{hint}</span>}
      {current && (
        <span className="flex flex-wrap items-center gap-3 text-xs">
          <a href={current} target="_blank" rel="noopener noreferrer" className="underline">ver arquivo atual</a>
          <Check label="remover" name={`remove_${name}`} />
        </span>
      )}
      {error && <span role="alert" className="text-xs text-[var(--danger)]">{error}</span>}
    </div>
  );
}

// Quando a Server Action lança (sessão expirada, item que já não existe, envio grande demais): o formulário fica como está.
export function ActionError() {
  return (
    <p role="alert" className="text-sm text-[var(--danger)]">
      Não foi possível salvar. Sua sessão pode ter expirado ou o arquivo é grande demais — entre de novo e tente outra vez.{" "}
      <Link href="/admin/login" className="underline">Ir para o login</Link>
    </p>
  );
}
