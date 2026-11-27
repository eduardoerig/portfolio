"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { saveItem } from "@/app/(admin)/admin/actions";
import { itemTitle } from "@/lib/itemTitle";
import type { Kind } from "@/lib/tables";
import type { Skill } from "@/lib/types";
import { useAdminStatus } from "./AdminStatus";
import EditorFrame from "./EditorFrame";
import FormFields from "./form/FormFields";
import GuardedLink from "./GuardedLink";
import Preview from "./Preview";
import { useEditor } from "./useEditor";

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
  const title = row ? itemTitle(kind, row) || "Editar item" : "Novo item";

  useEffect(() => {
    setCrumb(isNew ? "novo" : title);
    return () => setCrumb(null);
  }, [isNew, title, setCrumb]);

  // Campos, seções e validação vêm do modelo (lib/formModel).
  return (
    <EditorFrame
      title={title}
      editor={ed}
      autosave={!isNew}
      header={<FormFields kind={kind} editor={ed} header />}
      preview={<Preview kind={kind} draft={ed.draft} locale={ed.locale} onLocale={ed.setLocale} fileUrl={ed.imageUrl("image")} siblings={siblings?.[ed.locale]} />}
      cancel={<GuardedLink href={base} className="btn">{isNew ? "Cancelar" : "Voltar para a lista"}</GuardedLink>}
    >
      <FormFields kind={kind} editor={ed} />
    </EditorFrame>
  );
}
