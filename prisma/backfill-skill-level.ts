// Roda UMA vez, logo depois do `prisma db push` que criou as colunas level e nameEn.
// Preenche as competências que já existiam no banco (nível e nome em inglês).
// Uso: npm run backfill:skill-level
//
// Seguro para rodar de novo: o marcador é a coluna antiga `learning`. Enquanto alguma competência
// ainda tem learning = true, o script não rodou; ao terminar ele zera a coluna, e daí em diante
// não faz mais nada (assim nunca desfaz uma escolha feita no painel).
import type { PrismaClient } from "@prisma/client";
import { fixturePortfolio } from "../src/content/fixture";
import { fixturePortfolioEn } from "../src/content/fixture.en";

const INTERMEDIATE = ["PHP", "Node.js", "APIs REST"];

export async function backfillSkillLevel(db: PrismaClient) {
  if ((await db.skill.count({ where: { learning: true } })) === 0) return "já executado: nada a fazer.";

  const learning = await db.skill.updateMany({ where: { level: null, learning: true }, data: { level: "learning" } });
  const intermediate = await db.skill.updateMany({ where: { level: null, name: { in: INTERMEDIATE } }, data: { level: "intermediate" } });

  // Nome em inglês: o fixture em inglês tem as competências na mesma ordem do português.
  let names = 0;
  for (const [i, pt] of fixturePortfolio.skills.entries()) {
    const r = await db.skill.updateMany({ where: { name: pt.name, nameEn: null }, data: { nameEn: fixturePortfolioEn.skills[i].name } });
    names += r.count;
  }

  await db.skill.updateMany({ where: { learning: true }, data: { learning: false } }); // consome o marcador
  return `learning: ${learning.count}; intermediate: ${intermediate.count}; nameEn: ${names}.`;
}

// Só roda sozinho quando chamado pelo npm (não quando importado pelos testes).
if (process.argv[1]?.includes("backfill-skill-level")) {
  import("@prisma/client").then(async ({ PrismaClient }) => {
    const db = new PrismaClient();
    try {
      console.log(await backfillSkillLevel(db));
    } finally {
      await db.$disconnect();
    }
  });
}
