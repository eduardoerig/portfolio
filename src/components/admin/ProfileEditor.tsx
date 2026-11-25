"use client";

import { useRouter } from "next/navigation";
import { updateProfile } from "@/app/(admin)/admin/actions";
import { useAdminStatus } from "./AdminStatus";
import { Check, Field } from "./controls";
import Dropzone from "./Dropzone";
import EditorFrame, { Tr } from "./EditorFrame";
import Preview from "./Preview";
import { useEditor } from "./useEditor";
import { useObjectUrl } from "./useObjectUrl";

export default function ProfileEditor({ row }: { row: Record<string, unknown> }) {
  const router = useRouter();
  const { notify } = useAdminStatus();
  const ed = useEditor({
    kind: "profile",
    row,
    save: updateProfile,
    onSaved: () => {
      notify("Salvo ✓");
      router.refresh();
    },
  });
  const { draft, set, shown, currentUrl, setFile, setRemoved, errors, locale } = ed;
  const photo = useObjectUrl(shown.photo);
  const text = (name: string, label: string) => (
    <Field label={label} name={name} value={String(draft[name] ?? "")} onChange={(v) => set(name, v)} error={errors[name]} />
  );

  return (
    <EditorFrame title="Perfil" editor={ed} preview={<Preview kind="profile" draft={draft} locale={locale} fileUrl={photo} />}>
      {text("name", "Nome")}
      <Tr editor={ed} label="Cargo" name="role" />
      <Tr editor={ed} label="Resumo" name="summary" multiline />
      {text("email", "E-mail")}
      {text("githubUrl", "GitHub (URL)")}
      {text("linkedinUrl", "LinkedIn (URL)")}
      <Check label="Aberto a oportunidades" name="openToWork" checked={draft.openToWork === true} onChange={(b) => set("openToWork", b)} />
      <Dropzone
        label="Foto"
        name="photo"
        accept="image/jpeg,image/png,image/webp"
        kind="image"
        currentUrl={currentUrl("photo")}
        onFile={(f) => setFile("photo", f)}
        onRemove={(b) => setRemoved("photo", b)}
        error={errors.photo}
        hint="JPG, PNG ou WebP, até 3 MB."
      />
      <Dropzone
        label="Currículo (PDF)"
        name="cv"
        accept="application/pdf"
        kind="pdf"
        currentUrl={currentUrl("cv")}
        onFile={(f) => setFile("cv", f)}
        onRemove={(b) => setRemoved("cv", b)}
        error={errors.cv}
        hint="PDF, até 5 MB."
      />
    </EditorFrame>
  );
}
