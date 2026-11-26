// Troca de seção: o menu e o topo ficam, o conteúdo mostra um esqueleto em vez de parecer travado.
export default function Loading() {
  return (
    <div role="status" aria-label="Carregando" className="flex flex-col gap-3">
      <div className="h-7 w-40 animate-pulse rounded-lg bg-[var(--surface)]" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="card h-16 animate-pulse" />
      ))}
    </div>
  );
}
