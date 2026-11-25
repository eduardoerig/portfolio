import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O padrão é 1 MB; foto (3 MB) + currículo (5 MB) podem ir no mesmo envio. Cada arquivo é limitado de novo no servidor.
  experimental: { serverActions: { bodySizeLimit: "9mb" } },
};

export default nextConfig;
