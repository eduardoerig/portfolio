"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useAdminStatus } from "./AdminStatus";
import GuardedLink from "./GuardedLink";

type Counts = Record<"projetos" | "experiencias" | "competencias" | "formacao" | "idiomas", number>;

const items: { href: string; label: string; key?: keyof Counts }[] = [
  { href: "/admin", label: "Perfil" },
  { href: "/admin/projetos", label: "Projetos", key: "projetos" },
  { href: "/admin/experiencias", label: "Experiências", key: "experiencias" },
  { href: "/admin/competencias", label: "Competências", key: "competencias" },
  { href: "/admin/formacao", label: "Formação", key: "formacao" },
  { href: "/admin/idiomas", label: "Idiomas", key: "idiomas" },
];

export default function Sidebar({ counts }: { counts: Counts }) {
  const pathname = usePathname();
  const { menuOpen: open, setMenuOpen: setOpen } = useAdminStatus();
  const nav = useRef<HTMLElement>(null);

  // Gaveta do celular: ao abrir, o foco entra nela; ao fechar, volta ao ☰ (o teclado não se perde).
  const close = () => {
    setOpen(false);
    document.getElementById("admin-menu-button")?.focus();
  };
  useEffect(() => {
    if (!open) return;
    nav.current?.querySelector<HTMLElement>("a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      document.getElementById("admin-menu-button")?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  // "/admin" só é ativo na raiz; as demais valem também para subrotas (ex.: /admin/projetos/3).
  const isActive = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));

  return (
    <>
      {open && <div aria-hidden="true" onClick={close} className="fixed inset-0 z-20 bg-black/50 md:hidden" />}
      <aside
        id="admin-sidebar"
        className={`${open ? "flex" : "hidden"} fixed inset-y-0 left-0 z-30 overflow-y-auto overscroll-contain shadow-xl md:shadow-none w-56 flex-col gap-1 border-r border-[var(--border)] bg-[var(--bg)] px-3 pb-6 pt-6 md:static md:flex md:pb-6 md:pt-6`}
      >
        <div className="mb-2 flex items-center justify-between px-3">
          <p className="label">Seções</p>
          <button type="button" aria-label="Fechar menu" onClick={close} className="btn btn-icon md:hidden">✕</button>
        </div>
        <nav ref={nav} className="flex flex-col gap-1" aria-label="Seções do painel">
          {items.map(({ href, label, key }) => {
            const active = isActive(href);
            return (
              <GuardedLink
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={`flex items-center justify-between rounded-lg border-l-2 px-3 py-2 text-sm transition-colors ${
                  active
                    ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] font-semibold text-[var(--fg)]"
                    : "border-transparent text-[var(--muted)] hover:text-[var(--fg)]"
                }`}
              >
                {label}
                {key && <span className="font-mono text-xs">{counts[key]}</span>}
              </GuardedLink>
            );
          })}
        </nav>
        {/* No celular o "Ver site" do topo some: fica aqui na gaveta. */}
        <a href="/" target="_blank" rel="noopener" className="mt-4 px-3 py-2 text-sm text-[var(--muted)] hover:text-[var(--fg)] md:hidden">
          Ver site ↗
        </a>
      </aside>
    </>
  );
}
