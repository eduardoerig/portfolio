"use client";

import { useEffect, useState } from "react";
import type { Dictionary } from "@/i18n/dictionary";
import type { Theme } from "@/lib/theme";

export default function ThemeToggle({ dict }: { dict: Dictionary["theme"] }) {
  // null até o navegador carregar: assim servidor e cliente geram o mesmo HTML.
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    // O THEME_SCRIPT do <head> já definiu data-theme; lemos o valor e acompanhamos mudanças (outro botão na página).
    const read = () => setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);

  // Antes de saber o tema, um espaço neutro do mesmo tamanho (sem ícone nem rótulo enganoso).
  if (theme === null) return <span className="theme-toggle" aria-hidden="true" />;

  function toggle() {
    const next: Theme = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {}
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? dict.toLight : dict.toDark}
      className="theme-toggle text-fg"
    >
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}
