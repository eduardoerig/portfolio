import type { Portfolio } from "@/lib/types";
import type { Locale } from "@/i18n/locales";
import { fixturePortfolioEn } from "@/content/fixture.en";

export const fixturePortfolio: Portfolio = {
  profile: {
    name: "Eduardo Erig",
    role: "Auxiliar de TI · Desenvolvedor Full Stack",
    summary:
      "Trabalho como Auxiliar de TI no Colégio Evangélico Martin Luther, onde desenvolvo sistemas internos, faço help desk e manutenção de hardware. Também sou cofundador e desenvolvedor full stack da PrimoDev, onde construo sites, sistemas sob medida e automações para pequenos e médios negócios. Gosto de pegar um processo manual e transformar em sistema, do levantamento de requisitos à entrega.",
    openToWork: true,
    email: "eduardoferig@gmail.com",
    githubUrl: "https://github.com/eduardoerig",
    linkedinUrl: "https://www.linkedin.com/in/eduardoerig",
    photoPath: null,
  },
  projects: [
    {
      id: 1,
      title: "Requests",
      description:
        "Sistema de gestão de requisições institucionais: centraliza as solicitações do colégio e facilita o acompanhamento.",
      stack: ["PHP", "JavaScript", "MySQL"],
      url: "https://github.com/eduardoerig/requests-institutional-management",
      imagePath: null,
      metric: null,
    },
    {
      id: 2,
      title: "Dolce Delícias",
      description:
        "Site e e-commerce para uma confeitaria, feito em grupo no projeto integrador da faculdade.",
      stack: ["HTML", "CSS", "JavaScript", "Sanity"],
      url: "https://github.com/eduardoerig/Dolce-Delicias",
      imagePath: null,
      metric: null,
    },
    {
      id: 3,
      title: "Automação do Instagram",
      description:
        "Planeja, prepara, revisa, agenda e aprende com os posts do Instagram da PrimoDev.",
      stack: ["n8n", "Agentes de IA", "Cloudflare Workers"],
      url: null,
      imagePath: null,
      metric: "Primeiro Reel no formato novo: 1.777 views (mediana: 37)",
    },
    {
      id: 4,
      title: "Gestão de Serviços de Topografia",
      description:
        "Controle e organização de serviços de topografia: registro, acompanhamento e padronização das informações.",
      stack: ["PHP", "MySQL"],
      url: null,
      imagePath: null,
      metric: null,
    },
  ],
  experiences: [
    {
      id: 1,
      role: "Auxiliar de TI",
      company: "Colégio Evangélico Martin Luther",
      location: "Mal. Cândido Rondon, PR",
      period: "2025 – atual",
      current: true,
      bullets: [
        "Desenvolvo e mantenho sistemas internos, como o Requests, que organiza as requisições da instituição.",
        "Atendo usuários no help desk e resolvo problemas em computadores, rede e equipamentos.",
        "Apoio as rotinas do setor de TI, organizando e melhorando processos.",
      ],
    },
    {
      id: 2,
      role: "Cofundador e Desenvolvedor Full Stack",
      company: "PrimoDev",
      location: "Remoto",
      period: "fev. 2026 – atual",
      current: true,
      bullets: [
        "Desenvolvo sites, sistemas sob medida e automações para pequenos e médios negócios.",
        "Criei a automação que cuida do Instagram da PrimoDev com n8n e agentes de IA.",
      ],
    },
    {
      id: 3,
      role: "Assistente administrativo de TI",
      company: "Colégio Evangélico Martin Luther",
      location: "Mal. Cândido Rondon, PR",
      period: "2024 – 2025",
      current: false,
      bullets: [
        "Prestei suporte técnico, atendimento a usuários e manutenção de equipamentos.",
        "Participei de melhorias e do desenvolvimento de sistemas internos.",
      ],
    },
  ],
  skills: [
    { id: 1, name: "HTML", group: "Front-end", level: null },
    { id: 2, name: "CSS", group: "Front-end", level: null },
    { id: 3, name: "JavaScript", group: "Front-end", level: null },
    { id: 4, name: "Bootstrap", group: "Front-end", level: null },
    { id: 5, name: "React", group: "Front-end", level: "learning" },
    { id: 6, name: "Next.js", group: "Front-end", level: "learning" },
    { id: 7, name: "TypeScript", group: "Front-end", level: "learning" },
    { id: 8, name: "PHP", group: "Back-end e dados", level: "intermediate" },
    { id: 9, name: "Node.js", group: "Back-end e dados", level: "intermediate" },
    { id: 10, name: "APIs REST", group: "Back-end e dados", level: "intermediate" },
    { id: 11, name: "MySQL", group: "Back-end e dados", level: null },
    { id: 12, name: "SQL", group: "Back-end e dados", level: null },
    { id: 13, name: "n8n", group: "Automação e IA", level: null },
    { id: 14, name: "Agentes de IA", group: "Automação e IA", level: null },
    { id: 15, name: "Claude Code", group: "Automação e IA", level: null },
    { id: 16, name: "Git", group: "Ferramentas", level: null },
    { id: 17, name: "GitHub", group: "Ferramentas", level: null },
    { id: 18, name: "VS Code", group: "Ferramentas", level: null },
    { id: 19, name: "Help desk", group: "Suporte e infraestrutura", level: null },
    { id: 20, name: "Manutenção de hardware", group: "Suporte e infraestrutura", level: null },
    { id: 21, name: "Formatação e instalação de sistemas", group: "Suporte e infraestrutura", level: null },
    { id: 22, name: "Cabeamento e Wi-Fi", group: "Suporte e infraestrutura", level: null },
    { id: 23, name: "Impressoras e periféricos", group: "Suporte e infraestrutura", level: null },
  ],
  education: [
    {
      id: 1,
      course: "Engenharia de Software",
      school: "Faculdade Donaduzzi",
      period: "fev. 2026 – dez. 2029",
      note: "cursando",
    },
    {
      id: 2,
      course: "Técnico em Desenvolvimento de Sistemas",
      school: "Colégio Estadual Eron Domingues",
      period: "2023 – 2025",
      note: "Ensino médio integrado",
    },
  ],
};

// Conteúdo fixo de cada idioma (até a página ler do banco).
export function getFixturePortfolio(locale: Locale): Portfolio {
  return locale === "en" ? fixturePortfolioEn : fixturePortfolio;
}
