import type { CSSProperties } from "react";
import { getSkillIcon } from "@/lib/skillIcons";

// Ícones próprios (traço simples, grade 24×24) para competências sem logo de marca.
// Desenhados com stroke em currentColor; a cor vem do CSS (.skill-icon-generic).
const GENERIC: Record<string, string> = {
  code: "M8 7 3 12l5 5M16 7l5 5-5 5M14 4l-4 16", // < / >
  database: "M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Zm0 0v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
  sparkle: "M12 3l2 6.5 7 2.5-7 2.5-2 6.5-2-6.5-7-2.5 7-2.5Z", // estrela de 4 pontas
  headset: "M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v5H5a1 1 0 0 1-1-1v-4Zm16 0h-3v5h2a1 1 0 0 0 1-1v-4ZM17 19c0 1.1-1.8 2-4 2",
  wrench: "M14.7 6.3a4 4 0 0 0 5 5L21 13l-8 8-3-3 8-8M14.7 6.3 13 4.6a4 4 0 0 0-5 5L3 14.6 6.4 18l5-5",
  disk: "M12 3v11M8 10l4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2",
  wifi: "M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01",
  printer: "M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v7H6Z",
  dot: "M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z",
};

// Competência sem marca → qual ícone próprio usar. Nomes fora da lista caem no "dot".
const GENERIC_BY_SKILL: Record<string, keyof typeof GENERIC> = {
  "VS Code": "code",
  "APIs REST": "code",
  SQL: "database",
  "Agentes de IA": "sparkle",
  "Help desk": "headset",
  "Manutenção de hardware": "wrench",
  "Formatação e instalação de sistemas": "disk",
  "Cabeamento e Wi-Fi": "wifi",
  "Impressoras e periféricos": "printer",
  // mesmos ícones para os nomes em inglês
  "REST APIs": "code",
  "AI agents": "sparkle",
  "Hardware maintenance": "wrench",
  "OS formatting & installation": "disk",
  "Cabling & Wi-Fi": "wifi",
  "Printers & peripherals": "printer",
};

export default function SkillIcon({ name }: { name: string }) {
  const brand = getSkillIcon(name);
  if (brand) {
    return (
      // A cor da marca vai na variável --brand; o CSS decide como pintar em cada tema.
      <svg className="skill-icon skill-icon-brand" viewBox="0 0 24 24" aria-hidden="true">
        <path d={brand.path} style={{ "--brand": brand.color } as CSSProperties} />
      </svg>
    );
  }
  return (
    <svg
      className="skill-icon skill-icon-generic"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={GENERIC[GENERIC_BY_SKILL[name] ?? "dot"]} />
    </svg>
  );
}
