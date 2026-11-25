import type { CSSProperties } from "react";

// Formas decorativas que flutuam devagar no fundo (só enfeite, invisíveis para leitores de tela).
// --dur é a duração da animação de cada uma.
const circles: CSSProperties[] = [
  { top: "12%", left: "6%", width: 180, height: 180, "--dur": "32s" } as CSSProperties,
  { top: "58%", right: "4%", width: 260, height: 260, "--dur": "40s" } as CSSProperties,
  { bottom: "8%", left: "18%", width: 90, height: 90, "--dur": "22s" } as CSSProperties,
];
const dots: CSSProperties[] = [
  { top: "22%", right: "18%", "--dur": "18s" } as CSSProperties,
  { top: "70%", left: "8%", "--dur": "26s" } as CSSProperties,
  { top: "40%", left: "48%", "--dur": "15s" } as CSSProperties,
];

export default function BackgroundShapes() {
  return (
    <div className="shapes" aria-hidden="true">
      {circles.map((style, i) => (
        <span key={`c${i}`} className="shape shape-circle" style={style} />
      ))}
      {dots.map((style, i) => (
        <span key={`d${i}`} className="shape shape-dot" style={style} />
      ))}
      <svg className="shape" style={{ top: "34%", right: "28%", "--dur": "30s" } as CSSProperties} width="70" height="62" viewBox="0 0 70 62">
        <polygon points="35,2 68,60 2,60" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  );
}
