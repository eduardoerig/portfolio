"use client";

import { useId } from "react";
import type { FieldDef } from "@/lib/formModel";
import type { Locale } from "@/i18n/locales";
import { Err, Hint } from "../controls";
import TagInput from "../TagInput";
import { Counter, Star, TextControl } from "./fields";

const LANG = { pt: "português", en: "inglês" } as const;
const blank = (v: string | string[]) => (Array.isArray(v) ? v.length === 0 : !v.trim());

type Props = {
  def: FieldDef;
  pt: string | string[];
  en: string | string[];
  errors: { pt?: string; en?: string };
  onChange(locale: Locale, v: string | string[]): void;
  onFocus(locale: Locale): void;
  onBlur(locale: Locale): void;
  onPending?(): void;
};

// Campo traduzível: português e inglês juntos (lado a lado no computador), para ver na hora o que falta traduzir.
// O inglês vazio cai no português no site: o português aparece em cinza no lugar.
export default function I18nField({ def, pt, en, errors, onChange, onFocus, onBlur, onPending }: Props) {
  const hintId = `${useId()}-dica`;
  const missing = !blank(pt) && blank(en);
  const stacked = def.type === "lines"; // linhas longas: um idioma embaixo do outro sempre

  const column = (locale: Locale) => {
    const value = locale === "pt" ? pt : en;
    const error = locale === "pt" ? errors.pt : errors.en;
    const ariaLabel = `${def.label} em ${LANG[locale]}`;
    const errorId = `${hintId}-${locale}-erro`;
    const head = (
      <span className="flex items-center gap-2 font-mono text-xs text-[var(--muted)]" aria-hidden="true">
        {locale.toUpperCase()}
        {locale === "en" && missing && <span className="chip !text-[var(--hue-amber)]">falta traduzir</span>}
      </span>
    );
    if (def.type === "tags" || def.type === "lines") {
      const ptList = pt as string[];
      return (
        <div className="flex min-w-0 flex-col gap-1" onFocus={() => onFocus(locale)}>
          {head}
          <TagInput
            label=""
            inputLabel={ariaLabel}
            value={value as string[]}
            onChange={(v) => onChange(locale, v)}
            onPending={onPending}
            error={error}
            long={def.type === "lines"}
            placeholder={locale === "en" ? (ptList.length ? ptList.join(", ") : undefined) : undefined}
          />
        </div>
      );
    }
    const text = value as string;
    return (
      <div className="flex min-w-0 flex-col gap-1">
        {head}
        <TextControl
          def={def}
          value={text}
          onChange={(v) => onChange(locale, v)}
          onFocus={() => onFocus(locale)}
          onBlur={() => onBlur(locale)}
          ariaLabel={ariaLabel}
          placeholder={locale === "en" ? (pt as string) || "vazio: usa o português" : def.placeholder}
          required={locale === "pt" && def.required}
          describedBy={[def.hint ? hintId : "", error ? errorId : ""].filter(Boolean).join(" ") || undefined}
          invalid={Boolean(error)}
        />
        <div className="flex">
          <Counter def={def} value={text} />
        </div>
        <Err id={errorId} error={error} />
      </div>
    );
  };

  return (
    <fieldset className="flex min-w-0 flex-col gap-1 text-sm">
      <legend className="mb-1">{def.label}{def.required && <Star />}</legend>
      <div className={`grid gap-3 ${stacked ? "" : "md:grid-cols-2"}`}>
        {column("pt")}
        {column("en")}
      </div>
      <Hint id={hintId} text={def.hint} />
    </fieldset>
  );
}
