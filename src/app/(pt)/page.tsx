import PortfolioPage from "@/components/PortfolioPage";
import { getPortfolio } from "@/lib/portfolio";
import { getDictionary } from "@/i18n/dictionary";

// Lê do banco a cada visita, para as edições do admin aparecerem sem rebuild.
export const dynamic = "force-dynamic";

export default async function HomePt() {
  return <PortfolioPage portfolio={await getPortfolio("pt")} dict={getDictionary("pt")} locale="pt" />;
}
