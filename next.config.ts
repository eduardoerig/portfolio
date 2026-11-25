import type { NextConfig } from "next";

// O site entrega as imagens já reduzidas ao tamanho exibido; só aceita as do nosso armazenamento.
const files = process.env.NEXT_PUBLIC_FILES_URL;

const nextConfig: NextConfig = {
  images: { remotePatterns: files ? [new URL(`${files}/**`)] : [] },
  // O cliente libSQL carrega binários nativos: fica fora do bundle e é lido do node_modules no servidor.
  serverExternalPackages: ["@prisma/adapter-libsql", "@libsql/client", "libsql"],
};

export default nextConfig;
