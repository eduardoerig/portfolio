import GithubIcon from "@/components/icons/GithubIcon";
import LinkedinIcon from "@/components/icons/LinkedinIcon";
import MailIcon from "@/components/icons/MailIcon";
import SectionHeading from "@/components/SectionHeading";
import TiltCard from "@/components/TiltCard";
import type { Dictionary } from "@/i18n/dictionary";
import type { Profile } from "@/lib/types";

export default function Contact({ profile, dict }: { profile: Profile; dict: Dictionary }) {
  return (
    <section id="contato" className="py-16 pb-24 text-center">
      <SectionHeading {...dict.sections.contact} />
      {/* A entrada fica no invólucro .reveal; a inclinação 3D fica no cartão. */}
      <div className="reveal mx-auto max-w-2xl">
        <TiltCard className="card p-8">
          <p className="text-muted">{dict.contact.prompt}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <a href={`mailto:${profile.email}`} className="btn btn-primary gap-2 py-3">
              <MailIcon /> {dict.contact.email}
            </a>
            <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="btn gap-2 py-3">
              <LinkedinIcon /> LinkedIn
            </a>
            <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="btn gap-2 py-3">
              <GithubIcon /> GitHub
            </a>
          </div>
          <p className="mt-6 break-all font-mono text-sm text-muted">{profile.email}</p>
        </TiltCard>
      </div>
    </section>
  );
}
