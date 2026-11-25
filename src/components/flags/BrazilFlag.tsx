// Bandeira do Brasil simplificada (20×14): fundo verde, losango amarelo e círculo azul.
// As cores vêm das variáveis --flag-* do globals.css.
export default function BrazilFlag() {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" aria-hidden="true" className="flag">
      <rect width="20" height="14" style={{ fill: "var(--flag-br-green)" }} />
      <polygon points="10,1.6 18.4,7 10,12.4 1.6,7" style={{ fill: "var(--flag-br-yellow)" }} />
      <circle cx="10" cy="7" r="3.1" style={{ fill: "var(--flag-br-blue)" }} />
    </svg>
  );
}
