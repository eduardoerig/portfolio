import type { NextConfig } from "next";

// O site entrega as imagens já reduzidas ao tamanho exibido; só aceita as do nosso armazenamento.
const files = process.env.NEXT_PUBLIC_FILES_URL;

const nextConfig: NextConfig = {
  images: { remotePatterns: files ? [new URL(`${files}/**`)] : [] },
  // O cliente libSQL carrega binários nativos: fica fora do bundle e é lido do node_modules no servidor.
  serverExternalPackages: ["@prisma/adapter-libsql", "@libsql/client", "libsql", "@react-pdf/renderer"],
  // Arquivos lidos do disco na hora de gerar o PDF (fontes do currículo e as fontes padrão do gerador,
  // como a Helvetica do modelo simples): o rastreamento não os acha sozinho, então entram à mão.
  outputFileTracingIncludes: {
    "/curriculo.pdf": ["./src/cv/fonts/**", "./node_modules/pdfkit/js/standard-fonts/**"],
    "/en/resume.pdf": ["./src/cv/fonts/**", "./node_modules/pdfkit/js/standard-fonts/**"],
  },
};

export default nextConfig;
