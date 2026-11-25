import type { CSSProperties } from "react";
import SkillIcon from "@/components/icons/SkillIcon";
import SectionHeading from "@/components/SectionHeading";
import type { Dictionary } from "@/i18n/dictionary";
import type { Skill } from "@/lib/types";

export default function Skills({ skills, dict }: { skills: Skill[]; dict: Dictionary }) {
  // Agrupa mantendo a ordem em que os grupos aparecem na lista.
  const groups = new Map<string, Skill[]>();
  for (const skill of skills) {
    groups.set(skill.group, [...(groups.get(skill.group) ?? []), skill]);
  }

  return (
    <section id="competencias" className="py-16">
      <SectionHeading {...dict.sections.skills} />
      <div className="space-y-6">
        {[...groups].map(([group, items], i) => (
          // hue-0..4: um tom discreto por grupo (definido no globals.css).
          <div key={group} className={`reveal-group skill-group hue-${i % 5}`}>
            <h3 className="label mb-3 text-muted">{group}</h3>
            <ul className="flex flex-wrap gap-2">
              {items.map((skill, j) => (
                // --i: posição do chip, usada para entrarem um a um.
                <li
                  key={skill.id}
                  className={skill.level ? `chip chip-${skill.level}` : "chip"}
                  style={{ "--i": j } as CSSProperties}
                >
                  <SkillIcon name={skill.name} />
                  {skill.name}
                  {skill.level && <span className="text-xs opacity-70">{dict.skills[skill.level]}</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
