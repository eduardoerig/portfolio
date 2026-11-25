import BackgroundShapes from "@/components/BackgroundShapes";
import Nav from "@/components/Nav";
import RevealOnScroll from "@/components/RevealOnScroll";
import Contact from "@/components/sections/Contact";
import Education from "@/components/sections/Education";
import Experience from "@/components/sections/Experience";
import Hero from "@/components/sections/Hero";
import Projects from "@/components/sections/Projects";
import Skills from "@/components/sections/Skills";
import type { Dictionary } from "@/i18n/dictionary";
import type { Locale } from "@/i18n/locales";
import type { Portfolio } from "@/lib/types";

// A página pública inteira, igual nos dois idiomas: muda só o conteúdo e os textos.
export default function PortfolioPage({
  portfolio,
  dict,
  locale,
}: {
  portfolio: Portfolio;
  dict: Dictionary;
  locale: Locale;
}) {
  return (
    <>
      <BackgroundShapes />
      <Nav dict={dict} locale={locale} />
      {/* overflow-x-clip: os cartões que ainda vão "entrar pela direita" ficam fora da tela
          e não podem criar rolagem para o lado. Ocupa a largura toda, então não corta sombras. */}
      <div className="overflow-x-clip">
        <main className="mx-auto max-w-5xl px-4">
          <Hero profile={portfolio.profile} dict={dict} />
          <Projects projects={portfolio.projects} dict={dict} />
          <Experience experiences={portfolio.experiences} dict={dict} />
          <Skills skills={portfolio.skills} dict={dict} />
          <Education education={portfolio.education} dict={dict} />
          <Contact profile={portfolio.profile} dict={dict} />
        </main>
      </div>
      <RevealOnScroll />
    </>
  );
}
