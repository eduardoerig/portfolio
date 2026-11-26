import { parseList } from "@/lib/lists";
import { fileUrl } from "@/lib/fileUrl";
import { toLevel } from "@/lib/localize";
import type { Kind, Row } from "@/lib/tables";
import SkillIcon from "@/components/icons/SkillIcon";
import GuardedLink from "./GuardedLink";

const LEVEL = { learning: "Aprendendo", intermediate: "Intermediário" } as const;

// Algum campo com português preenchido e o inglês vazio: no /en o site mostraria o português.
const blank = (v: unknown) => v === null || v === undefined || v === "" || v === "[]";
const missingEn = (row: Row) =>
  Object.keys(row).some((k) => k.endsWith("En") && blank(row[k]) && !blank(row[k.slice(0, -2)]));

// Mini-cartão da lista: o cartão todo leva ao editor. As ações ficam fora do link (irmãs), para não aninhar botão em <a>.
export default function ItemCard({ kind, row, href }: { kind: Kind; row: Row; href: string }) {
  const s = (k: string) => String(row[k] ?? "");
  const level = kind === "skill" ? toLevel(row.level as string | null) : undefined;

  return (
    <GuardedLink href={href} className={`card flex min-w-0 flex-1 items-center gap-3 ${row.visible ? "" : "border-dashed"}`}>
      {kind === "project" &&
        (fileUrl(s("imagePath")) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fileUrl(s("imagePath")) ?? ""} alt="" className="h-12 w-16 shrink-0 rounded object-cover" />
        ) : (
          <span className="h-12 w-16 shrink-0 rounded border border-[var(--border)]" aria-hidden="true" />
        ))}
      <span className="flex min-w-0 flex-col gap-1 break-words">
        <span className="flex flex-wrap items-center gap-2">
          {kind === "skill" && <span className="chip inline-flex items-center gap-1"><SkillIcon name={s("name")} />{s("name")}{level && ` · ${LEVEL[level]}`}</span>}
          {kind === "project" && <span>{s("title")}</span>}
          {kind === "experience" && <span>{s("role")} · {s("company")}</span>}
          {kind === "education" && <span>{s("course")} · {s("school")}</span>}
          {kind === "language" && <span>{s("name")} · {s("level")}</span>}
          {!row.visible && <span className="chip">oculto</span>}
          {missingEn(row) && <span className="chip" title="Há texto em português sem a versão em inglês">sem EN</span>}
        </span>
        {kind === "project" && (
          <span className="flex flex-wrap gap-1">{parseList(s("stack")).map((t) => <span key={t} className="chip">{t}</span>)}</span>
        )}
        {kind === "skill" && <span className="text-xs text-[var(--muted)]">{s("group")}</span>}
        {(kind === "experience" || kind === "education") && <span className="text-xs text-[var(--muted)]">{s("period")}</span>}
      </span>
    </GuardedLink>
  );
}
