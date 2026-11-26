// @vitest-environment node
import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import config from "../next.config";

// Na hospedagem só sobe o que o rastreamento acha. O gerador de PDF lê fontes do disco em tempo de execução,
// então sem estas inclusões as rotas dão erro 500 só lá (localmente a pasta inteira existe).
describe("rastreamento dos arquivos do PDF", () => {
  for (const route of ["/curriculo.pdf", "/en/resume.pdf"]) {
    it(`${route} leva as fontes do currículo e a Helvetica do gerador`, () => {
      const globs = config.outputFileTracingIncludes?.[route] ?? [];
      expect(globs).toContain("./src/cv/fonts/**");
      expect(globs).toContain("./node_modules/pdfkit/js/standard-fonts/**");
      expect(existsSync("node_modules/pdfkit/js/standard-fonts/Helvetica.cjs")).toBe(true);
      expect(existsSync("src/cv/fonts/inter-400.woff")).toBe(true);
    });
  }
});
