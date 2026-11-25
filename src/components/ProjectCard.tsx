import TiltCard from "@/components/TiltCard";
import type { Dictionary } from "@/i18n/dictionary";
import type { Project } from "@/lib/types";

export default function ProjectCard({ project, dict }: { project: Project; dict: Dictionary["projects"] }) {
  return (
    <TiltCard className="card h-full">
      <article className="flex h-full flex-col">
        {project.imagePath && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={project.imagePath} alt={`${dict.imageAlt} ${project.title}`} className="mb-4 w-full rounded-lg" />
        )}
        <h3 className="display text-lg">{project.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{project.description}</p>
        {project.metric && <p className="mt-3 font-mono text-sm text-accent">{project.metric}</p>}
        <ul className="mt-4 flex flex-wrap gap-2">
          {project.stack.map((item) => (
            <li key={item} className="chip">{item}</li>
          ))}
        </ul>
        {project.url && (
          <a href={project.url} target="_blank" rel="noopener noreferrer" className="mt-auto pt-4 font-mono text-sm text-accent hover:underline">
            {dict.viewCode} <span className="arrow" aria-hidden="true">→</span>
          </a>
        )}
      </article>
    </TiltCard>
  );
}
