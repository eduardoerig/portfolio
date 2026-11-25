import Image from "next/image";
import type { CSSProperties } from "react";
import GithubIcon from "@/components/icons/GithubIcon";
import LinkedinIcon from "@/components/icons/LinkedinIcon";
import type { Dictionary } from "@/i18n/dictionary";
import type { Profile } from "@/lib/types";

// Atraso de cada peça na entrada do topo (sequência de ~1.2s ao carregar).
const delay = (ms: number) => ({ "--delay": `${ms}ms` }) as CSSProperties;

export default function Hero({ profile, dict }: { profile: Profile; dict: Dictionary }) {
  // "Eduardo Erig" vira duas linhas: primeiro nome e o resto.
  const [first, ...rest] = profile.name.split(" ");

  return (
    <header className="flex min-h-svh flex-col items-center justify-center gap-6 pb-12 pt-28 text-center">
      <div className="photo-wrap hero-pop">
        <div className="photo-ring" aria-hidden="true" />
        <div className="photo-orbit" aria-hidden="true" />
        <div className="photo relative">
          {profile.photoPath ? (
            <Image src={profile.photoPath} alt={`${dict.hero.photoAlt} ${profile.name}`} fill sizes="140px" priority className="object-cover" />
          ) : (
            <span aria-hidden="true">EE</span>
          )}
        </div>
      </div>

      {profile.openToWork && (
        <p className="pill pill-accent hero-fade" style={delay(250)}>
          <span className="dot pulse" aria-hidden="true" />
          {dict.hero.badge}
        </p>
      )}

      <div>
        <p className="hero-fade font-mono text-sm text-muted" style={delay(300)}>
          &gt; whoami<span className="cursor" aria-hidden="true">_</span>
        </p>
        <h1 className="display mt-2" style={{ fontSize: "clamp(2.5rem, 8vw, 5.5rem)" }}>
          <span className="mask hero-mask block">
            <span className="name-1" style={delay(350)}>{first}</span>
          </span>
          <span className="mask hero-mask block">
            <span className="name-2" style={delay(470)}>{rest.join(" ")}</span>
          </span>
        </h1>
      </div>

      <p className="hero-fade text-lg" style={delay(600)}>{profile.role}</p>
      <p className="hero-fade max-w-[60ch] leading-relaxed text-muted" style={delay(680)}>{profile.summary}</p>

      <div className="hero-fade flex flex-wrap justify-center gap-3" style={delay(760)}>
        {profile.cvPath && (
          <a href={profile.cvPath} download className="btn btn-primary">{dict.hero.downloadCv}</a>
        )}
        <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="btn gap-2">
          <GithubIcon size={18} /> GitHub
        </a>
        <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="btn gap-2">
          <LinkedinIcon size={18} /> LinkedIn
        </a>
      </div>

      <a href="#projetos" className="hero-fade mt-4 font-mono text-xs text-muted" style={delay(840)}>{dict.hero.scrollHint}</a>
    </header>
  );
}
