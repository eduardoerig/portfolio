import type { CSSProperties } from "react";
import ProjectCard from "@/components/ProjectCard";
import SectionHeading from "@/components/SectionHeading";
import type { Dictionary } from "@/i18n/dictionary";
import type { Project } from "@/lib/types";

export default function Projects({ projects, dict }: { projects: Project[]; dict: Dictionary }) {
  return (
    <section id="projetos" className="py-16">
      <SectionHeading {...dict.sections.projects} />
      <div className="grid gap-5 sm:grid-cols-2">
        {projects.map((project, i) => (
          // --delay escalona a entrada dos cartões.
          <div key={project.id} className="reveal" style={{ "--delay": `${i * 80}ms` } as CSSProperties}>
            <ProjectCard project={project} dict={dict.projects} />
          </div>
        ))}
      </div>
    </section>
  );
}
