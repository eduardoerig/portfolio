import { SHARE_SIZE, shareImage } from "@/lib/shareImage";

// Lê nome e cargo do banco a cada pedido: mudou no painel, o próximo compartilhamento já vem novo.
export const dynamic = "force-dynamic";
export const size = SHARE_SIZE;
export const contentType = "image/png";
export const alt = "Eduardo Erig · Desenvolvedor Full Stack";

export default function Image() {
  return shareImage("pt");
}
