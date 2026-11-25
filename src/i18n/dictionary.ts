import type { Locale } from "@/i18n/locales";

// Textos fixos da interface (títulos, botões, rótulos). O conteúdo (cargo, projetos...)
// não fica aqui: ele vem do Portfolio de cada idioma.
// Títulos de seção: "lead" + "accent", e o "accent" (última palavra) sai em azul.
const pt = {
  meta: {
    title: "Eduardo Erig · Desenvolvedor Full Stack",
    description:
      "Portfólio de Eduardo Erig: projetos, experiência e competências de um desenvolvedor full stack aberto a oportunidades.",
  },
  nav: {
    ariaLabel: "Seções",
    backToTop: "Voltar ao topo",
    projects: "projetos",
    experience: "experiência",
    skills: "competências",
    education: "formação",
    contact: "contato",
  },
  theme: {
    toLight: "Mudar para tema claro",
    toDark: "Mudar para tema escuro",
  },
  language: {
    groupLabel: "Idioma",
    loading: "Carregando…",
  },
  hero: {
    badge: "aberto a oportunidades",
    photoAlt: "Foto de",
    downloadCv: "Baixar currículo",
    scrollHint: "scroll ↓",
  },
  sections: {
    projects: { label: "projetos", lead: "Meus", accent: "projetos" },
    experience: { label: "experiência", lead: "Minha", accent: "experiência" },
    skills: { label: "competências", lead: "", accent: "Competências" },
    education: { label: "formação", lead: "", accent: "Formação" },
    contact: { label: "contato", lead: "Vamos", accent: "conversar" },
  },
  projects: {
    viewCode: "ver código",
    imageAlt: "Imagem do projeto",
  },
  skills: {
    learning: "aprendendo",
    intermediate: "intermediário",
  },
  contact: {
    prompt: "Escolha o canal que preferir:",
    email: "E-mail",
  },
};

export type Dictionary = typeof pt;

// O tipo Dictionary obriga o inglês a ter exatamente as mesmas chaves do português.
const en: Dictionary = {
  meta: {
    title: "Eduardo Erig · Full Stack Developer",
    description:
      "Portfolio of Eduardo Erig: projects, experience and skills of a full stack developer open to opportunities.",
  },
  nav: {
    ariaLabel: "Sections",
    backToTop: "Back to top",
    projects: "projects",
    experience: "experience",
    skills: "skills",
    education: "education",
    contact: "contact",
  },
  theme: {
    toLight: "Switch to light theme",
    toDark: "Switch to dark theme",
  },
  language: {
    groupLabel: "Language",
    loading: "Loading…",
  },
  hero: {
    badge: "open to opportunities",
    photoAlt: "Photo of",
    downloadCv: "Download résumé",
    scrollHint: "scroll ↓",
  },
  sections: {
    projects: { label: "projects", lead: "My", accent: "projects" },
    experience: { label: "experience", lead: "My", accent: "experience" },
    skills: { label: "skills", lead: "", accent: "Skills" },
    education: { label: "education", lead: "", accent: "Education" },
    contact: { label: "contact", lead: "Let's", accent: "talk" },
  },
  projects: {
    viewCode: "view code",
    imageAlt: "Image of the project",
  },
  skills: {
    learning: "learning",
    intermediate: "intermediate",
  },
  contact: {
    prompt: "Pick whichever channel you prefer:",
    email: "Email",
  },
};

const DICTIONARIES: Record<Locale, Dictionary> = { pt, en };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}
