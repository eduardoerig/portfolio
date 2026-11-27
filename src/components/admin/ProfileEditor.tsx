"use client";

import { updateProfile } from "@/app/(admin)/admin/actions";
import EditorFrame from "./EditorFrame";
import FormFields from "./form/FormFields";
import Preview from "./Preview";
import { useEditor } from "./useEditor";

const CV_LINKS = [
  ["/curriculo.pdf", "Currículo PT"],
  ["/curriculo.pdf?modelo=simples", "Currículo PT (simples)"],
  ["/en/resume.pdf", "Currículo EN"],
  ["/en/resume.pdf?modelo=simples", "Currículo EN (simples)"],
] as const;

// Campos, seções e validação vêm do modelo (lib/formModel); aqui só o que é do perfil.
export default function ProfileEditor({ row }: { row: Record<string, unknown> }) {
  const ed = useEditor({
    kind: "profile",
    row,
    save: updateProfile,
    autosave: true,
    onSaved: () => {}, // a resposta da action já atualiza a tela (nome e foto no topo)
  });

  return (
    <EditorFrame
      title="Perfil"
      editor={ed}
      autosave
      preview={<Preview kind="profile" draft={ed.draft} locale={ed.locale} onLocale={ed.setLocale} fileUrl={ed.imageUrl("photo")} />}
    >
      <FormFields kind="profile" editor={ed} />
      {/* Fecha a seção Currículo (a última do modelo): ver o PDF que sai dos campos acima. */}
      <div className="flex flex-wrap gap-2">
        {CV_LINKS.map(([href, label]) => (
          <a key={href} href={href} target="_blank" rel="noopener" className="btn">
            {label}
          </a>
        ))}
      </div>
    </EditorFrame>
  );
}
