import ProjectCard from "@/components/ProjectCard";
import ThemeToggle from "@/components/ThemeToggle";
import Contact from "@/components/sections/Contact";
import Education from "@/components/sections/Education";
import Experience from "@/components/sections/Experience";
import Hero from "@/components/sections/Hero";
import Skills from "@/components/sections/Skills";
import { getDictionary } from "@/i18n/dictionary";
import type { Locale } from "@/i18n/locales";
import { type Draft, type EditorKind, itemPreview, profilePreview } from "@/lib/adminDraft";
import type { Skill } from "@/lib/types";

type Props = {
  kind: EditorKind;
  draft: Draft;
  locale: Locale;
  fileUrl?: string | null;
  siblings?: Skill[];
};

export default function Preview({ kind, draft, locale, fileUrl, siblings = [] }: Props) {
  const dict = getDictionary(locale);

  function body() {
    switch (kind) {
      case "profile": {
        const profile = profilePreview(draft, locale, fileUrl);
        // O Hero é a página inteira (min-h-svh): aqui ele só ocupa o que o conteúdo pede.
        return (
          <>
            <div className="[&_header]:min-h-0 [&_header]:pt-8">
              <Hero profile={profile} dict={dict} />
            </div>
            <Contact profile={profile} dict={dict} />
          </>
        );
      }
      case "project":
        return <ProjectCard project={itemPreview("project", draft, locale, fileUrl)} dict={dict.projects} />;
      case "experience":
        return <Experience experiences={[itemPreview("experience", draft, locale)]} dict={dict} />;
      case "education":
        return <Education education={[itemPreview("education", draft, locale)]} dict={dict} />;
      case "language":
        return <p className="text-sm text-muted">Idiomas não aparecem no site, só no currículo em PDF.</p>;
      case "skill": {
        const item = itemPreview("skill", draft, locale);
        const merged = siblings.some((s) => s.id === item.id)
          ? siblings.map((s) => (s.id === item.id ? item : s))
          : [...siblings, item];
        return <Skills skills={merged} dict={dict} />;
      }
    }
  }

  return (
    <aside className="card card-static lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-auto">
      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-sm text-muted">{"// prévia"}</span>
        <span className="flex items-center gap-2">
          {draft.visible === false && <span className="chip">oculto — não aparece no site</span>}
          <span className="pill">{locale.toUpperCase()}</span>
          <ThemeToggle dict={dict.theme} />
        </span>
      </div>
      {body()}
    </aside>
  );
}
