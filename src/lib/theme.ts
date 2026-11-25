export type Theme = "light" | "dark";

// Tema salvo (se for válido) ou, na primeira visita, a preferência do sistema.
export function resolveTheme(stored: string | null, prefersDark: boolean): Theme {
  if (stored === "light" || stored === "dark") return stored;
  return prefersDark ? "dark" : "light";
}

// Roda no <head> antes da primeira pintura, para a página não piscar.
// Faz o mesmo que resolveTheme (precisa ser texto, pois roda fora do React).
export const THEME_SCRIPT = `(function(){try{
var s=localStorage.getItem("theme");
var t=(s==="light"||s==="dark")?s:(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");
document.documentElement.dataset.theme=t;
}catch(e){document.documentElement.dataset.theme="dark";}})();`;
