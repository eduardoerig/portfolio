import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// As duas versões do site, cada uma apontando para a outra (hreflang), para os buscadores.
export default function sitemap(): MetadataRoute.Sitemap {
  const pt = new URL("/", siteUrl()).toString();
  const en = new URL("/en", siteUrl()).toString();
  const languages = { "pt-BR": pt, en };
  return [
    { url: pt, changeFrequency: "monthly", priority: 1, alternates: { languages } },
    { url: en, changeFrequency: "monthly", priority: 0.8, alternates: { languages } },
  ];
}
