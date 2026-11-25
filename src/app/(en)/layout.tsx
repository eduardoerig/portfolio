import RootShell, { buildMetadata } from "@/app/RootShell";

// Layout raiz da versão em inglês, servida em /en.
export const metadata = buildMetadata("en");

export default function EnglishLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RootShell lang="en">{children}</RootShell>;
}
