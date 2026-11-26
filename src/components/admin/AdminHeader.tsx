"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { logout } from "@/app/(admin)/admin/login/actions";
import ThemeToggle from "@/components/ThemeToggle";
import { getDictionary } from "@/i18n/dictionary";
import { useAdminStatus } from "./AdminStatus";

const sections: Record<string, string> = {
  projetos: "projetos",
  experiencias: "experiências",
  competencias: "competências",
  formacao: "formação",
  idiomas: "idiomas",
};

const themeDict = getDictionary("pt").theme;

export default function AdminHeader({ name, photoPath }: { name: string; photoPath: string | null }) {
  const pathname = usePathname();
  const { dirty, crumb, menuOpen, setMenuOpen } = useAdminStatus();
  const [menu, setMenu] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  // Menu da conta: fecha com Esc e com clique fora.
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    const onDown = (e: MouseEvent) => wrap.current?.contains(e.target as Node) || setMenu(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [menu]);

  const section = sections[pathname.split("/")[2] ?? ""] ?? "perfil";
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");

  return (
    <header className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3 text-sm">
      <button
        type="button"
        aria-label="Abrir menu"
        aria-controls="admin-sidebar"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen(!menuOpen)}
        className="md:hidden"
      >
        ☰
      </button>
      <span className="font-mono text-[var(--accent)]">&gt; admin</span>
      <span className="truncate text-[var(--muted)]">
        / {section}
        {crumb && <> / {crumb}</>}
      </span>
      <span className="flex-1" />
      <span className={`font-mono text-xs ${dirty ? "text-[var(--danger)]" : "text-[var(--success)]"}`}>
        ● {dirty ? "alterações não salvas" : "salvo"}
      </span>
      <ThemeToggle dict={themeDict} />
      <a href="/" target="_blank" rel="noopener" className="pill hidden sm:inline-flex">Ver site ↗</a>
      <div ref={wrap} className="relative">
        <button
          type="button"
          aria-label="Menu da conta"
          aria-expanded={menu}
          onClick={() => setMenu((m) => !m)}
          className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface)] text-xs font-semibold"
        >
          {photoPath ? (
            // eslint-disable-next-line @next/next/no-img-element -- foto local em /uploads
            <img src={photoPath} alt="" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </button>
        {menu && (
          <form
            action={logout}
            onSubmit={(e) => {
              if (dirty && !confirm("Há alterações não salvas. Sair mesmo assim?")) e.preventDefault();
            }}
            className="card absolute right-0 top-10 z-40 !p-2">
            <button type="submit" className="rounded-md px-3 py-1.5 text-left text-sm hover:text-[var(--accent)]">Sair</button>
          </form>
        )}
      </div>
    </header>
  );
}
