import SectionHeading from "@/components/SectionHeading";
import TiltCard from "@/components/TiltCard";
import type { Dictionary } from "@/i18n/dictionary";
import type { Experience } from "@/lib/types";

export default function ExperienceSection({ experiences, dict }: { experiences: Experience[]; dict: Dictionary }) {
  return (
    <section id="experiencia" className="py-16">
      <SectionHeading {...dict.sections.experience} />
      {/* Linha do tempo: a linha vertical vem do CSS (.timeline::before) e se "desenha"
          quando a lista entra na tela. Cada item é observado sozinho, para a bolinha
          e o cartão entrarem quando ele aparece. */}
      <ol className="reveal-group timeline space-y-5">
        {experiences.map((item) => (
          <li key={item.id} className="reveal-group timeline-item relative">
            <span className={item.current ? "timeline-dot is-current" : "timeline-dot"} aria-hidden="true" />
            <div className="slide-in">
              <TiltCard className="card">
                <span className="pill">{item.period}</span>
                <h3 className="display mt-3 text-lg">{item.role}</h3>
                <p className="mt-1 text-sm text-muted">
                  {item.company} · {item.location}
                </p>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
                  {item.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </TiltCard>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
