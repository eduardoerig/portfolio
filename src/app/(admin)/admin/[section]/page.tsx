import Link from "next/link";
import { notFound } from "next/navigation";
import GuardedLink from "@/components/admin/GuardedLink";
import ItemCard from "@/components/admin/ItemCard";
import ItemEditor from "@/components/admin/ItemEditor";
import RowActions from "@/components/admin/RowActions";
import type { Locale } from "@/i18n/locales";
import { pick, toLevel } from "@/lib/localize";
import { ORDER, table, type Kind } from "@/lib/tables";

const SECTIONS: Record<string, { kind: Kind; title: string }> = {
  projetos: { kind: "project", title: "Projetos" },
  experiencias: { kind: "experience", title: "Experiências" },
  competencias: { kind: "skill", title: "Competências" },
  formacao: { kind: "education", title: "Formação" },
  idiomas: { kind: "language", title: "Idiomas" },
};

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

  // Prévia da competência: as visíveis, localizadas como o site faz, nos dois idiomas.
  const visible = rows.filter((r) => r.visible);
  const localized = (locale: Locale) =>
    visible.map((s) => ({ id: s.id, name: pick(locale, s.name as string, s.nameEn as string | null), group: pick(locale, s.group as string, s.groupEn as string | null), level: toLevel(s.level as string | null) }));
  const siblings = kind === "skill" ? { pt: localized("pt"), en: localized("en") } : undefined;

  const open = Boolean(novo || editing);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{title}</h1>
        {open ? (
          <GuardedLink href={base} className="btn">← voltar para a lista</GuardedLink>
        ) : (
          <Link href={`${base}?novo=1`} className="btn btn-primary">+ novo</Link>
        )}
      </div>

      {open ? (
        // key: trocar de item recria o formulário com os valores certos
        <ItemEditor key={editing?.id ?? "novo"} kind={kind} row={editing ?? null} base={base} siblings={siblings} />
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((r, i) => (
            <li key={r.id} className="flex flex-wrap items-center gap-3">
              <ItemCard kind={kind} row={r} href={`${base}?editar=${r.id}`} />
              <RowActions kind={kind} id={r.id} visible={r.visible} editHref={`${base}?editar=${r.id}`} first={i === 0} last={i === rows.length - 1} />
            </li>
          ))}
          {rows.length === 0 && <li className="text-sm text-[var(--muted)]">Nenhum item ainda.</li>}
        </ul>
      )}
    </>
  );
}
