"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { saveItem } from "@/app/(admin)/admin/actions";
import type { Kind } from "@/lib/tables";
import type { Skill } from "@/lib/types";
import { useAdminStatus } from "./AdminStatus";
import { Check, Field, Select } from "./controls";
import Dropzone from "./Dropzone";
import EditorFrame, { Tr, TrList } from "./EditorFrame";
import GuardedLink from "./GuardedLink";
import Preview from "./Preview";
import { useEditor } from "./useEditor";
import { useObjectUrl } from "./useObjectUrl";

const SKILL_LEVELS = [["", "—"], ["intermediate", "Intermediário"], ["learning", "Aprendendo"]] as const;
const TITLE_KEY: Record<Kind, string> = { project: "title", experience: "role", skill: "name", education: "course" };

type Props = { kind: Kind; row: Record<string, unknown> | null; base: string; siblings?: { pt: Skill[]; en: Skill[] } };

export default function ItemEditor({ kind, row, base, siblings }: Props) {
  const router = useRouter();
  const { notify, setCrumb } = useAdminStatus();
  const isNew = row === null;
  const ed = useEditor({
    kind,
    row,
    save: (fd) => saveItem(kind, fd),
    onSaved: () => {
      notify("Salvo ✓");
      router.refresh(); // contagens do menu
      if (isNew) router.push(base); // volta à lista (e evita salvar duas vezes um item novo)
    },
  });
  const { draft, set, shown, currentUrl, setFile, setRemoved, errors, locale } = ed;
  const title = row ? String(row[TITLE_KEY[kind]] ?? "") || "Editar item" : "Novo item";
  const image = useObjectUrl(shown.image);

  useEffect(() => {
    setCrumb(isNew ? "novo" : title);
    return () => setCrumb(null);
  }, [isNew, title, setCrumb]);

  const text = (name: string, label: string) => (
    <Field label={label} name={name} value={String(draft[name] ?? "")} onChange={(v) => set(name, v)} error={errors[name]} />
  );

  return (
    <EditorFrame
      title={title}
      editor={ed}
      preview={<Preview kind={kind} draft={draft} locale={locale} fileUrl={image} siblings={siblings?.[locale]} />}
      cancel={<GuardedLink href={base} className="btn">Cancelar</GuardedLink>}
    >
      {kind === "project" && (
        <>
          <Tr editor={ed} label="Título" name="title" />
          <Tr editor={ed} label="Descrição" name="description" multiline />
          <TrList editor={ed} label="Tecnologias" name="stack" hint="Enter adiciona. Em inglês vazio, usa o português." />
          {text("url", "Link (opcional)")}
          <Tr editor={ed} label="Métrica (opcional)" name="metric" />
          <Dropzone
            label="Imagem (opcional)"
            name="image"
            accept="image/jpeg,image/png,image/webp"
            kind="image"
            currentUrl={currentUrl("image")}
            onFile={(f) => setFile("image", f)}
            onRemove={(b) => setRemoved("image", b)}
            error={errors.image}
            hint="JPG, PNG ou WebP, até 3 MB."
          />
        </>
      )}
      {kind === "experience" && (
        <>
          <Tr editor={ed} label="Cargo" name="role" />
          {text("company", "Empresa")}
          <Tr editor={ed} label="Local" name="location" />
          <Tr editor={ed} label="Período" name="period" />
          <TrList editor={ed} label="Realizações" name="bullets" long hint="Em inglês vazio, usa o português." />
          <Check label="Emprego atual" name="current" checked={draft.current === true} onChange={(b) => set("current", b)} />
        </>
      )}
      {kind === "skill" && (
        <>
          <Tr editor={ed} label="Nome" name="name" />
          <Tr editor={ed} label="Grupo" name="group" />
          <Select label="Nível" name="level" value={String(draft.level ?? "")} onChange={(v) => set("level", v)} error={errors.level} options={SKILL_LEVELS} />
        </>
      )}
      {kind === "education" && (
        <>
          <Tr editor={ed} label="Curso" name="course" />
          {text("school", "Instituição")}
          <Tr editor={ed} label="Período" name="period" />
          <Tr editor={ed} label="Observação (opcional)" name="note" />
        </>
      )}
      <Check label="Visível no site" name="visible" checked={draft.visible === true} onChange={(b) => set("visible", b)} />
    </EditorFrame>
  );
}
