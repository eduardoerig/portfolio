import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import { Geist, Geist_Mono, Unbounded } from "next/font/google";
import { getDictionary } from "@/i18n/dictionary";
import type { Locale } from "@/i18n/locales";
import { THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";

// Partes comuns aos dois layouts raiz, (pt)/layout.tsx e (en)/layout.tsx.
// São dois layouts raiz porque cada idioma precisa do seu próprio <html lang>.

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Fonte larga dos títulos e do nome.
const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin"],
  weight: ["600", "700"],
});

// Título, descrição e os links hreflang que apontam uma versão para a outra.
export function buildMetadata(locale: Locale): Metadata {
  const { meta } = getDictionary(locale);
  return {
    metadataBase: siteUrl(),
    title: meta.title,
    description: meta.description,
    alternates: { languages: { "pt-BR": "/", en: "/en" } },
  };
}

export default function RootShell({ lang, children }: { lang: string; children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: o THEME_SCRIPT muda data-theme antes do React carregar.
    // As variáveis das fontes ficam no <html> porque o @theme as usa a partir do :root.
    <html lang={lang} suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} ${unbounded.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
