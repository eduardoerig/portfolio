// Preenche a stack em inglês dos projetos que já existiam no banco (coluna stackEn criada depois).
// Uso: npm run backfill:stack-en   (depois de `npx prisma db push`)
//
// Seguro para rodar de novo: só mexe onde stackEn ainda é null, então nunca sobrescreve o que o painel salvou.
import type { PrismaClient } from "@prisma/client";
import { fixturePortfolio } from "../src/content/fixture";
import { fixturePortfolioEn } from "../src/content/fixture.en";

export async function backfillStackEn(db: PrismaClient) {
  let n = 0;
  // O fixture em inglês tem os projetos na mesma ordem do português; o id liga ao banco.
  for (const [i, pt] of fixturePortfolio.projects.entries()) {
    const r = await db.project.updateMany({
      where: { id: pt.id, stackEn: null },
      data: { stackEn: JSON.stringify(fixturePortfolioEn.projects[i].stack) },
    });
    n += r.count;
  }
  return `stackEn preenchido em ${n} projeto(s).`;
}

// Só roda sozinho quando chamado pelo npm (não quando importado pelos testes).
if (process.argv[1]?.includes("backfill-stack-en")) {
  import("@prisma/client").then(async ({ PrismaClient }) => {
    const db = new PrismaClient();
    try {
      console.log(await backfillStackEn(db));
    } finally {
      await db.$disconnect();
    }
  });
}
