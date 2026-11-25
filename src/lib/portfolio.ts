import { db } from "@/lib/db";
import { parseList } from "@/lib/lists";
import { ORDER } from "@/lib/tables";
import type { Locale } from "@/i18n/locales";
import type { Portfolio, SkillLevel } from "@/lib/types";

// Usa o texto em inglês quando existir; senão cai no português.
const pick = (locale: Locale, pt: string, en: string | null) =>
  locale === "en" && en ? en : pt;
const pickNull = (locale: Locale, pt: string | null, en: string | null) =>
  locale === "en" && en ? en : pt;
const pickList = (locale: Locale, pt: string, en: string | null): string[] => {
  const list = parseList(locale === "en" && en ? en : pt);
  return list.length === 0 ? parseList(pt) : list;
};

// A coluna é texto livre no banco; qualquer valor desconhecido vira "sem rótulo".
const toLevel = (v: string | null): SkillLevel => (v === "learning" || v === "intermediate" ? v : null);

export async function getPortfolio(locale: Locale): Promise<Portfolio> {
  const where = { visible: true };
  const orderBy = ORDER;

  const [profile, projects, experiences, skills, education] = await Promise.all([
    db.profile.findUniqueOrThrow({ where: { id: 1 } }),
    db.project.findMany({ where, orderBy }),
    db.experience.findMany({ where, orderBy }),
    db.skill.findMany({ where, orderBy }),
    db.education.findMany({ where, orderBy }),
  ]);

  return {
    profile: {
      name: profile.name,
      role: pick(locale, profile.role, profile.roleEn),
      summary: pick(locale, profile.summary, profile.summaryEn),
      openToWork: profile.openToWork,
      email: profile.email,
      githubUrl: profile.githubUrl,
      linkedinUrl: profile.linkedinUrl,
      photoPath: profile.photoPath,
      cvPath: profile.cvPath,
    },
    projects: projects.map((p) => ({
      id: p.id,
      title: pick(locale, p.title, p.titleEn),
      description: pick(locale, p.description, p.descriptionEn),
      stack: pickList(locale, p.stack, p.stackEn),
      url: p.url,
      imagePath: p.imagePath,
      metric: pickNull(locale, p.metric, p.metricEn),
    })),
    experiences: experiences.map((e) => ({
      id: e.id,
      role: pick(locale, e.role, e.roleEn),
      company: e.company,
      location: pick(locale, e.location, e.locationEn),
      period: pick(locale, e.period, e.periodEn),
      bullets: pickList(locale, e.bullets, e.bulletsEn),
      current: e.current,
    })),
    skills: skills.map((s) => ({
      id: s.id,
      name: pick(locale, s.name, s.nameEn),
      group: pick(locale, s.group, s.groupEn),
      level: toLevel(s.level),
    })),
    education: education.map((e) => ({
      id: e.id,
      course: pick(locale, e.course, e.courseEn),
      school: e.school,
      period: pick(locale, e.period, e.periodEn),
      note: pickNull(locale, e.note, e.noteEn),
    })),
  };
}
