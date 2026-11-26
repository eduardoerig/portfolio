import { ImageResponse } from "next/og";
import type { Locale } from "@/i18n/locales";
import { getPortfolio } from "@/lib/portfolio";

// Cartão que aparece ao colar o link do site no LinkedIn, WhatsApp etc. Nome e cargo vêm do painel.
export const SHARE_SIZE = { width: 1200, height: 630 };

export async function shareImage(locale: Locale): Promise<ImageResponse> {
  const { profile } = await getPortfolio(locale);
  const tagline = locale === "en" ? "Portfolio · projects and experience" : "Portfólio · projetos e experiência";
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "linear-gradient(135deg, #060b16 0%, #0c1424 60%, #1f3a8a 140%)",
          color: "#e6ebf3",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, color: "#3d7bfd", fontFamily: "monospace" }}>{"> whoami_"}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", fontSize: 88, fontWeight: 700, lineHeight: 1.05 }}>{profile.name}</div>
          <div style={{ display: "flex", fontSize: 40, color: "#8b97ab" }}>{profile.role}</div>
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#8b97ab" }}>{tagline}</div>
      </div>
    ),
    SHARE_SIZE,
  );
}
