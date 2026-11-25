import Link from "next/link";
import { notFound } from "next/navigation";
import ItemForm from "@/components/admin/ItemForm";
import RowActions from "@/components/admin/RowActions";
import { ORDER, table, type Kind, type Row } from "@/lib/tables";

const SECTIONS: Record<string, { kind: Kind; title: string }> = {
  projetos: { kind: "project", title: "Projetos" },
  experiencias: { kind: "experience", title: "Experiências" },
  competencias: { kind: "skill", title: "Competências" },
  formacao: { kind: "education", title: "Formação" },
};

const label = (kind: Kind, r: Row) =>
  ({
    project: r.title,
    experience: `${r.role} — ${r.company}`,
    skill: `${r.name} (${r.group})`,
    education: `${r.course} — ${r.school}`,
  })[kind] as string;

type Props = {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ novo?: string; editar?: string }>;
};

export default async function SectionPage({ params, searchParams }: Props) {
  const { section } = await params;
  const { novo, editar } = await searchParams;
  const config = SECTIONS[section];
  if (!config) notFound();

  const { kind, title } = config;
  const base = `/admin/${section}`;
  const rows = await table(kind).findMany({ orderBy: ORDER });
  const editing = editar ? rows.find((r) => r.id === Number(editar)) : undefined;

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{title}</h1>
        <Link href={`${base}?novo=1`} className="btn btn-primary">novo item</Link>
      </div>

      {(novo || editing) && (
        // key: trocar de item recria o formulário com os valores certos
        <ItemForm key={editing?.id ?? "novo"} kind={kind} row={editing ?? null} backHref={base} />
      )}

      <ul className="flex flex-col gap-3">
        {rows.map((r) => (
          <li key={r.id} className="card flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              {label(kind, r)}
              {!r.visible && <span className="chip">oculto</span>}
            </span>
            <RowActions kind={kind} id={r.id} visible={r.visible} editHref={`${base}?editar=${r.id}`} />
          </li>
        ))}
        {rows.length === 0 && <li className="text-sm text-[var(--muted)]">Nenhum item ainda.</li>}
      </ul>
    </>
  );
}
