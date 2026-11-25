// Rótulo mono pequeno (// PROJETOS) + título grande com a última palavra em destaque.
// Cada palavra fica numa .mask para poder "subir" na entrada (ver globals.css).
export default function SectionHeading({ label, lead, accent }: { label: string; lead?: string; accent: string }) {
  return (
    <div className="reveal-group heading-reveal">
      <p className="label">{`// ${label}`}</p>
      <h2 className="display section-title">
        {lead && (
          <>
            <span className="mask"><span>{lead}</span></span>{" "}
          </>
        )}
        <span className="mask mask-accent"><span className="text-accent">{accent}</span></span>
      </h2>
    </div>
  );
}
