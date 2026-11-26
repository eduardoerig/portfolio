import { PrismaClient } from "@prisma/client";
import { getFixturePortfolio } from "../src/content/fixture";
import { DEFAULT_LANGUAGES } from "../scripts/db-remote-cv";

const db = new PrismaClient();
const pt = getFixturePortfolio("pt");
const en = getFixturePortfolio("en");
const json = JSON.stringify;

// Upsert por id: pode rodar quantas vezes quiser sem duplicar.
// O PT vai nas colunas base e o EN nas colunas "En" (mesmo índice nas duas listas).
async function main() {
  // Banco com conteúdo = já foi editado no painel; não sobrescrever nem recriar itens apagados.
  if ((await db.profile.count()) > 0) {
    console.log("Banco já tem conteúdo — seed ignorado para não sobrescrever edições do painel.");
    return;
  }
  const p = pt.profile;
  const profileData = {
    name: p.name,
    role: p.role,
    roleEn: en.profile.role,
    summary: p.summary,
    summaryEn: en.profile.summary,
    openToWork: p.openToWork,
    email: p.email,
    githubUrl: p.githubUrl,
    linkedinUrl: p.linkedinUrl,
    photoPath: p.photoPath,
  };
  await db.profile.upsert({ where: { id: 1 }, update: profileData, create: { id: 1, ...profileData } });

  for (const [order, x] of pt.projects.entries()) {
    const e = en.projects[order];
    const data = {
      title: x.title,
      titleEn: e.title,
      description: x.description,
      descriptionEn: e.description,
      stack: json(x.stack),
      stackEn: json(e.stack),
      url: x.url,
      imagePath: x.imagePath,
      metric: x.metric,
      metricEn: e.metric,
      order,
    };
    await db.project.upsert({ where: { id: x.id }, update: data, create: { id: x.id, ...data } });
  }

  for (const [order, x] of pt.experiences.entries()) {
    const e = en.experiences[order];
    const data = {
      role: x.role,
      roleEn: e.role,
      company: x.company,
      location: x.location,
      locationEn: e.location,
      period: x.period,
      periodEn: e.period,
      bullets: json(x.bullets),
      bulletsEn: json(e.bullets),
      current: x.current,
      order,
    };
    await db.experience.upsert({ where: { id: x.id }, update: data, create: { id: x.id, ...data } });
  }

  for (const [order, x] of pt.skills.entries()) {
    const data = { name: x.name, nameEn: en.skills[order].name, group: x.group, groupEn: en.skills[order].group, level: x.level, order };
    await db.skill.upsert({ where: { id: x.id }, update: data, create: { id: x.id, ...data } });
  }

  for (const [order, x] of pt.education.entries()) {
    const e = en.education[order];
    const data = {
      course: x.course,
      courseEn: e.course,
      school: x.school,
      period: x.period,
      periodEn: e.period,
      note: x.note,
      noteEn: e.note,
      order,
    };
    await db.education.upsert({ where: { id: x.id }, update: data, create: { id: x.id, ...data } });
  }

  for (const [order, { id, ...l }] of DEFAULT_LANGUAGES.entries()) {
    await db.language.upsert({ where: { id }, update: { ...l, order }, create: { id, ...l, order } });
  }
}

main().finally(() => db.$disconnect());
