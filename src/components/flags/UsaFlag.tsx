// Bandeira dos EUA simplificada (20×14): 7 listras e o cantão azul com algumas estrelas
// (pontinhos). No tamanho do menu, 13 listras e 50 estrelas virariam borrão.
const RED_STRIPES = [0, 4, 8, 12]; // listras vermelhas de 2px; as brancas são o fundo
const STARS = [
  [2, 1.6], [4.5, 1.6], [7, 1.6],
  [3.25, 3.4], [5.75, 3.4],
  [2, 5.2], [4.5, 5.2], [7, 5.2],
];

export default function UsaFlag() {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" aria-hidden="true" className="flag">
      <rect width="20" height="14" style={{ fill: "var(--flag-us-white)" }} />
      {RED_STRIPES.map((y) => (
        <rect key={y} y={y} width="20" height="2" style={{ fill: "var(--flag-us-red)" }} />
      ))}
      <rect width="9" height="7" style={{ fill: "var(--flag-us-blue)" }} />
      {STARS.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="0.6" style={{ fill: "var(--flag-us-white)" }} />
      ))}
    </svg>
  );
}
