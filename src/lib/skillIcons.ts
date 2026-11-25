import {
  siBootstrap,
  siClaude,
  siCss,
  siGit,
  siGithub,
  siHtml5,
  siJavascript,
  siMysql,
  siN8n,
  siNextdotjs,
  siNodedotjs,
  siPhp,
  siReact,
  siTypescript,
  type SimpleIcon,
} from "simple-icons";

// Nome da competência (como está no conteúdo) → logo oficial do simple-icons.
// Competências sem marca (Help desk, SQL, VS Code…) não entram aqui e usam um ícone próprio.
const BRAND_ICONS: Record<string, SimpleIcon> = {
  HTML: siHtml5,
  CSS: siCss,
  JavaScript: siJavascript,
  Bootstrap: siBootstrap,
  React: siReact,
  "Next.js": siNextdotjs,
  TypeScript: siTypescript,
  PHP: siPhp,
  "Node.js": siNodedotjs,
  MySQL: siMysql,
  n8n: siN8n,
  "Claude Code": siClaude,
  Git: siGit,
  GitHub: siGithub,
};

// Luminância relativa (fórmula do WCAG) de uma cor "RRGGBB": 0 = preto, 1 = branco.
function luminance(hex: string) {
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Marcas quase pretas (Next.js, GitHub) sumiriam no tema escuro: essas usam a cor do texto.
const TOO_DARK = 0.02;

export function getSkillIcon(name: string): { path: string; color: string } | null {
  const icon = BRAND_ICONS[name];
  if (!icon) return null;
  return {
    path: icon.path,
    color: luminance(icon.hex) < TOO_DARK ? "currentColor" : `#${icon.hex}`,
  };
}
