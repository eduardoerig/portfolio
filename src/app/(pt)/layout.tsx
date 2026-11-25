import RootShell, { buildMetadata } from "@/app/RootShell";

// Layout raiz da versão em português (padrão), servida em /.
export const metadata = buildMetadata("pt");

export default function PortugueseLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RootShell lang="pt-BR">{children}</RootShell>;
}
