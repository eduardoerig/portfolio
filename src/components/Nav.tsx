"use client";

import { useEffect, useState } from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import type { Dictionary } from "@/i18n/dictionary";
import type { Locale } from "@/i18n/locales";

// id da seção (o mesmo nos dois idiomas) → chave do texto no dicionário.
export const NAV_LINKS = [
  { id: "projetos", key: "projects" },
  { id: "experiencia", key: "experience" },
  { id: "competencias", key: "skills" },
  { id: "formacao", key: "education" },
  { id: "contato", key: "contact" },
] as const;

export default function Nav({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    // Marca como ativa a seção que cruza a faixa do meio da tela.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const link of NAV_LINKS) {
      const section = document.getElementById(link.id);
      if (section) observer.observe(section);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <nav className="nav" aria-label={dict.nav.ariaLabel}>
      <a href="#" className="nav-mark" aria-label={dict.nav.backToTop}>EE</a>
      <div className="nav-links">
        {NAV_LINKS.map((link) => (
          <a
            key={link.id}
            href={`#${link.id}`}
            className={active === link.id ? "nav-link is-active" : "nav-link"}
            aria-current={active === link.id ? "location" : undefined}
          >
            {dict.nav[link.key]}
          </a>
        ))}
      </div>
      <LanguageSwitcher locale={locale} />
      <ThemeToggle dict={dict.theme} />
    </nav>
  );
}
