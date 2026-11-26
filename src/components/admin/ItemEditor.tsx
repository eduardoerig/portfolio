"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { saveItem } from "@/app/(admin)/admin/actions";
import { itemTitle } from "@/lib/itemTitle";
import type { Kind } from "@/lib/tables";
import type { Skill } from "@/lib/types";
import { useAdminStatus } from "./AdminStatus";
import { Check, Field, Select } from "./controls";
import EditorFrame, { Tr, TrList } from "./EditorFrame";
import GuardedLink from "./GuardedLink";
import ImageField from "./ImageField";
import Preview from "./Preview";
import { useEditor } from "./useEditor";

const SKILL_LEVELS = [["", "—"], ["intermediate", "Intermediário"], ["learning", "Aprendendo"]] as const;
const PROFICIENCY = [["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"]] as const;

type Props = { kind: Kind; row: Record<string, unknown> | null; base: string; siblings?: { pt: Skill[]; en: Skill[] } };

export default function ItemEditor({ kind, row, base, siblings }: Props) {
  const router = useRouter();
  const { notify, setCrumb } = useAdminStatus();
  const isNew = row === null;
  const ed = useEditor({
    kind,
    row,
    save: (fd) => saveItem(kind, fd),
    autosave: !isNew,
    // Gravação sozinha não recarrega o painel (a resposta da action já atualiza a tela); item novo
    // muda as contagens do menu.
    onSaved: () => {
      if (!isNew) return;
      notify("Salvo ✓");
      router.refresh();
      router.push(base); // volta à lista (e evita salvar duas vezes um item novo)
    },
  });
  const { draft, set, errors, locale } = ed;
  const title = row ? itemTitle(kind, row) || "Editar item" : "Novo item";

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
      autosave={!isNew}
      preview={<Preview kind={kind} draft={draft} locale={locale} fileUrl={ed.imageUrl("image")} siblings={siblings?.[locale]} />}
      cancel={<GuardedLink href={base} className="btn">{isNew ? "Cancelar" : "Voltar para a lista"}</GuardedLink>}
    >
      {kind === "project" && (
        <>
          <Tr editor={ed} label="Título" name="title" />
          <Tr editor={ed} label="Descrição" name="description" multiline />
          <TrList editor={ed} label="Tecnologias" name="stack" hint="Pressione Enter para adicionar. Se o inglês ficar vazio, o site mostra o português." />
          {text("url", "Link (opcional)")}
          <Tr editor={ed} label="Métrica (opcional)" name="metric" />
          <ImageField
            label="Imagem (opcional)"
            hint="JPG, PNG ou WebP. Fotos grandes são reduzidas automaticamente."
            url={ed.imageUrl("image")}
            busy={ed.uploading || ed.status === "saving"}
            onPick={(f) => ed.pickImage("image", f)}
            onRemove={() => ed.removeImage("image")}
            error={errors.image}
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
      {kind === "language" && (
        <>
          <Tr editor={ed} label="Idioma" name="name" />
          <Tr editor={ed} label="Nível (texto)" name="level" hint="No currículo, aparece só o texto antes dos dois-pontos." />
          <Select label="Barra no currículo (1 a 5)" name="proficiency" value={String(draft.proficiency ?? "3")} onChange={(v) => set("proficiency", v)} error={errors.proficiency} options={PROFICIENCY} />
        </>
      )}
      <Check label={kind === "language" ? "Visível no currículo" : "Visível no site"} name="visible" checked={draft.visible === true} onChange={(b) => set("visible", b)} />
    </EditorFrame>
  );
}
