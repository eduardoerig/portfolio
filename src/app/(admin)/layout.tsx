import RootShell from "@/app/RootShell";

// Layout raiz do painel (/admin): sempre em português.
export const metadata = { title: "Painel", robots: { index: false } };

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RootShell lang="pt-BR">{children}</RootShell>;
}
