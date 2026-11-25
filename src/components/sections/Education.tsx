import type { CSSProperties } from "react";
import SectionHeading from "@/components/SectionHeading";
import TiltCard from "@/components/TiltCard";
import type { Dictionary } from "@/i18n/dictionary";
import type { Education } from "@/lib/types";

export default function EducationSection({ education, dict }: { education: Education[]; dict: Dictionary }) {
  return (
    <section id="formacao" className="py-16">
      <SectionHeading {...dict.sections.education} />
      <div className="grid gap-5 sm:grid-cols-2">
        {education.map((item, i) => (
          // A entrada fica no invólucro .reveal; a inclinação 3D fica no cartão.
          <div key={item.id} className="reveal" style={{ "--delay": `${i * 80}ms` } as CSSProperties}>
            <TiltCard className="card h-full">
              <span className="pill">
                {item.period}
                {item.note && ` · ${item.note}`}
              </span>
              <h3 className="display mt-3 text-lg">{item.course}</h3>
              <p className="mt-1 text-sm text-muted">{item.school}</p>
            </TiltCard>
          </div>
        ))}
      </div>
    </section>
  );
}
