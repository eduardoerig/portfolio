import { db } from "@/lib/db";
import { pick, pickNull } from "@/lib/localize";
import { getPortfolio } from "@/lib/portfolio";
import { ORDER } from "@/lib/tables";
import type { Locale } from "@/i18n/locales";
import { buildResume, type Resume } from "./resume";

// O mesmo conteúdo visível do site, mais os campos que só o currículo usa.
export async function getResume(locale: Locale): Promise<Resume> {
  const [portfolio, profile, languages] = await Promise.all([
    getPortfolio(locale),
    db.profile.findUniqueOrThrow({ where: { id: 1 } }),
    db.language.findMany({ where: { visible: true }, orderBy: ORDER }),
  ]);
  return buildResume(
    portfolio,
    {
      fullName: profile.fullName,
      location: pickNull(locale, profile.location, profile.locationEn),
      phone: profile.phone,
      closing: pickNull(locale, profile.cvClosing, profile.cvClosingEn),
      languages: languages.map((l) => ({ name: pick(locale, l.name, l.nameEn), level: pick(locale, l.level, l.levelEn), proficiency: l.proficiency })),
    },
    locale,
  );
}
