"use client";

import type { EditorKind } from "@/lib/adminDraft";
import { FORMS, type FieldDef } from "@/lib/formModel";
import { Select } from "../controls";
import ImageField from "../ImageField";
import type { Editor } from "../useEditor";
import { SingleField, Switch } from "./fields";
import I18nField from "./I18nField";

// Desenha o formulário de um tipo a partir do modelo (lib/formModel): seções, campos, PT|EN, chaves.
// `header`: só os campos do cabeçalho (ex.: "Visível no site"); sem ele, as seções.
export default function FormFields({ kind, editor, header = false }: { kind: EditorKind; editor: Editor; header?: boolean }) {
  const sections = FORMS[kind];
  if (header) {
    const fields = sections.flatMap((s) => s.fields).filter((f) => f.header);
    return <>{fields.map((f) => <Field key={f.name} def={f} editor={editor} />)}</>;
  }
  return (
    <>
      {sections.map((s) => (
        <section key={s.title} className="flex flex-col gap-4 border-t border-[var(--border)] pt-4 first:border-t-0 first:pt-0">
          <div>
            <h3 className="font-semibold">{s.title}</h3>
            {s.description && <p className="text-xs text-[var(--muted)]">{s.description}</p>}
          </div>
          {s.fields.filter((f) => !f.header).map((f) => <Field key={f.name} def={f} editor={editor} />)}
        </section>
      ))}
    </>
  );
}

function Field({ def, editor }: { def: FieldDef; editor: Editor }) {
  const { draft, set, errors, validateField, setLocale } = editor;
  const str = (k: string) => String(draft[k] ?? "");
  const en = `${def.name}En`;

  switch (def.type) {
    case "switch":
      return <Switch label={def.label} checked={draft[def.name] === true} onChange={(b) => set(def.name, b)} />;
    case "select":
      return (
        <Select
          label={def.label}
          name={def.name}
          value={str(def.name) || (def.numeric ? "3" : "")}
          onChange={(v) => set(def.name, v)}
          options={def.options ?? []}
          error={errors[def.name]}
          hint={def.hint}
        />
      );
    case "image":
      return (
        <ImageField
          label={def.label}
          hint={def.hint}
          url={editor.imageUrl(def.name)}
          busy={editor.uploading || editor.status === "saving"}
          onPick={(f) => editor.pickImage(def.name, f)}
          onRemove={() => editor.removeImage(def.name)}
          error={errors[def.name]}
        />
      );
  }

  if (def.i18n) {
    const list = def.type === "tags" || def.type === "lines";
    const value = (k: string) => (list ? ((draft[k] as string[]) ?? []) : str(k));
    return (
      <I18nField
        def={def}
        pt={value(def.name)}
        en={value(en)}
        errors={{ pt: errors[def.name], en: errors[en] }}
        onChange={(locale, v) => set(locale === "en" ? en : def.name, v)}
        onFocus={setLocale} // a prévia acompanha o idioma do campo em foco
        onBlur={(locale) => validateField(locale === "en" ? en : def.name)}
        onPending={editor.touch}
      />
    );
  }
  return <SingleField def={def} value={str(def.name)} error={errors[def.name]} onChange={(v) => set(def.name, v)} onBlur={() => validateField(def.name)} />;
}
