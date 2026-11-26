import path from "node:path";
import { Font } from "@react-pdf/renderer";

// Inter (licença OFL, ver fonts/LICENSE), no lugar da Segoe UI do currículo feito à mão.
// Os arquivos ficam no repositório: nada é buscado na internet na hora de gerar.
let done = false;

export function registerFonts() {
  if (done) return;
  done = true;
  const file = (w: number) => path.join(process.cwd(), "src", "cv", "fonts", `inter-${w}.woff`);
  Font.register({
    family: "Inter",
    fonts: [300, 400, 600, 700, 900].map((fontWeight) => ({ src: file(fontWeight), fontWeight })),
  });
  Font.registerHyphenationCallback((word) => [word]); // não hifeniza palavras
}
