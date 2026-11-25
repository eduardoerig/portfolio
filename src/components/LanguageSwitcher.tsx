"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import BrazilFlag from "@/components/flags/BrazilFlag";
import UsaFlag from "@/components/flags/UsaFlag";
import { getDictionary } from "@/i18n/dictionary";
import { localePath, type Locale } from "@/i18n/locales";

const OPTIONS = [
  { locale: "pt" as const, label: "Português", Flag: BrazilFlag },
  { locale: "en" as const, label: "English", Flag: UsaFlag },
];

// Tempo para o loading aparecer na tela antes de a navegação começar.
const PAINT_DELAY_MS = 120;

export default function LanguageSwitcher({ locale }: { locale: Locale }) {
  // Idioma para o qual estamos indo (mostra o loading), ou null.
  const [goingTo, setGoingTo] = useState<Locale | null>(null);

  useEffect(() => {
    // Ao voltar com o botão "voltar", o navegador pode restaurar esta página da memória
    // (bfcache) com o loading ainda aberto; aqui ele é fechado.
    const reset = (e: PageTransitionEvent) => e.persisted && setGoingTo(null);
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  function choose(target: Locale) {
    if (target === locale || goingTo) return;
    setGoingTo(target);
    // /  e  /en têm layouts raiz diferentes, então a troca é sempre um carregamento completo.
    // A página nova chega sem o loading, já no outro idioma.
    setTimeout(() => window.location.assign(localePath(target)), PAINT_DELAY_MS);
  }

  return (
    <>
      <div className="lang-switch" role="group" aria-label={getDictionary(locale).language.groupLabel}>
        {OPTIONS.map(({ locale: option, label, Flag }) => (
          <button
            key={option}
            type="button"
            className="flag-btn"
            aria-label={label}
            aria-pressed={option === locale}
            onClick={() => choose(option)}
          >
            <Flag />
          </button>
        ))}
      </div>
      {/* Portal no <body>: dentro do menu (que usa transform) o "fixed" ficaria preso à pílula. */}
      {goingTo &&
        createPortal(
          <div className="lang-overlay" role="status" lang={goingTo === "pt" ? "pt-BR" : "en"}>
            <span className="spinner" aria-hidden="true" />
            {getDictionary(goingTo).language.loading}
          </div>,
          document.body,
        )}
    </>
  );
}
