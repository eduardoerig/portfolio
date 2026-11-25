import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O cliente libSQL carrega binários nativos: fica fora do bundle e é lido do node_modules no servidor.
  serverExternalPackages: ["@prisma/adapter-libsql", "@libsql/client", "libsql"],
};

export default nextConfig;
