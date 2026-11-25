// Endereço público do site (para links absolutos e metadados). Sem SITE_URL, cai no localhost do dev.
export function siteUrl(): URL {
  return new URL(process.env.SITE_URL || "http://localhost:3000");
}
