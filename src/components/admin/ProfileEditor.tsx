"use client";

import { useRouter } from "next/navigation";
import { updateProfile } from "@/app/(admin)/admin/actions";
import { Check, Field } from "./controls";
import EditorFrame, { Tr } from "./EditorFrame";
import ImageField from "./ImageField";
import Preview from "./Preview";
import { useEditor } from "./useEditor";

const CV_LINKS = [
  ["/curriculo.pdf", "PT"],
  ["/curriculo.pdf?modelo=simples", "PT simples"],
  ["/en/resume.pdf", "EN"],
  ["/en/resume.pdf?modelo=simples", "EN simples"],
] as const;

export default function ProfileEditor({ row }: { row: Record<string, unknown> }) {
  const router = useRouter();
  const ed = useEditor({
    kind: "profile",
    row,
    save: updateProfile,
    autosave: true,
    onSaved: () => router.refresh(),
  });
  const { draft, set, errors, locale } = ed;
  const text = (name: string, label: string) => (
    <Field label={label} name={name} value={String(draft[name] ?? "")} onChange={(v) => set(name, v)} error={errors[name]} />
  );

  return (
    <EditorFrame title="Perfil" editor={ed} autosave preview={<Preview kind="profile" draft={draft} locale={locale} fileUrl={ed.imageUrl("photo")} />}>
      {text("name", "Nome")}
      <Tr editor={ed} label="Cargo" name="role" />
      <Tr editor={ed} label="Resumo" name="summary" multiline />
      {text("email", "E-mail")}
      {text("githubUrl", "GitHub (URL)")}
      {text("linkedinUrl", "LinkedIn (URL)")}
      <Check label="Aberto a oportunidades" name="openToWork" checked={draft.openToWork === true} onChange={(b) => set("openToWork", b)} />
      <ImageField
        label="Foto"
        hint="JPG, PNG ou WebP, até 3 MB."
        url={ed.imageUrl("photo")}
        busy={ed.uploading || ed.status === "saving"}
        onPick={(f) => ed.pickImage("photo", f)}
        onRemove={() => ed.removeImage("photo")}
        error={errors.photo}
      />
      <fieldset className="flex flex-col gap-4 border-t border-[var(--border)] pt-4">
        <legend className="label pr-2">Currículo (gerado a partir deste painel)</legend>
        {text("fullName", "Nome completo (currículo)")}
        <Tr editor={ed} label="Cidade" name="location" />
        {text("phone", "Telefone (só no PDF)")}
        <Tr editor={ed} label="Frase final do currículo" name="cvClosing" multiline hint="Vai no fim do resumo. Trecho entre ** sai em negrito." />
        <div className="flex flex-wrap gap-2">
          {CV_LINKS.map(([href, label]) => (
            <a key={href} href={href} target="_blank" rel="noopener" className="btn">
              Ver PDF · {label}
            </a>
          ))}
        </div>
      </fieldset>
    </EditorFrame>
  );
}
