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
  const avatar = useRef<HTMLButtonElement>(null);
  const logoutBtn = useRef<HTMLButtonElement>(null);

  // Menu da conta: abre com o foco em "Sair"; fecha com Esc (devolvendo o foco ao avatar) e com clique fora.
  useEffect(() => {
    if (!menu) return;
    logoutBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMenu(false);
      avatar.current?.focus();
    };
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
    <header className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3 text-sm md:px-6">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[var(--surface)] focus:px-4 focus:py-2">
        Pular para o conteúdo
      </a>
      <button
        type="button"
        id="admin-menu-button"
        aria-label="Abrir menu"
        aria-controls="admin-sidebar"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen(!menuOpen)}
        className="btn btn-icon text-lg md:hidden"
      >
        ☰
      </button>
      <span className="whitespace-nowrap font-mono text-[var(--accent)]">&gt; admin</span>
      <span className="min-w-0 truncate text-[var(--muted)]">
        / {section}
        {crumb && <> / {crumb}</>}
      </span>
      <span className="flex-1" />
      <span className={`whitespace-nowrap font-mono text-xs ${dirty ? "text-[var(--danger)]" : "text-[var(--success)]"}`}>
        ● {dirty ? "alterações não salvas" : "salvo"}
      </span>
      <ThemeToggle dict={themeDict} />
      <a href="/" target="_blank" rel="noopener" className="pill hidden sm:inline-flex">Ver site ↗</a>
      <div ref={wrap} className="relative">
        <button
          type="button"
          ref={avatar}
          aria-label="Menu da conta"
          aria-haspopup="menu"
          aria-expanded={menu}
          onClick={() => setMenu((m) => !m)}
          className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface)] text-xs font-semibold"
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
            <button ref={logoutBtn} type="submit" className="rounded-md px-3 py-1.5 text-left text-sm hover:text-[var(--accent)]">Sair</button>
          </form>
        )}
      </div>
    </header>
  );
}
