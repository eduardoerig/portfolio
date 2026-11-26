import { createElement } from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { getDictionary } from "@/i18n/dictionary";
import type { Locale } from "@/i18n/locales";
import { getResume } from "./data";
import { registerFonts } from "./fonts";
import { cvFilename, type Resume } from "./resume";
import SimpleCv from "./SimpleCv";
import VisualCv from "./VisualCv";

export async function renderResume(resume: Resume, simple: boolean): Promise<Buffer> {
  registerFonts();
  const dict = getDictionary(resume.cv.locale);
  const doc = createElement(simple ? SimpleCv : VisualCv, { resume, dict });
  return renderToBuffer(doc as unknown as React.ReactElement<DocumentProps>);
}

// Gerado a cada pedido a partir do banco: mudou no painel, o próximo download já vem novo.
export async function resumeResponse(locale: Locale, req: Request): Promise<Response> {
  const simple = new URL(req.url).searchParams.get("modelo") === "simples";
  const resume = await getResume(locale);
  const pdf = await renderResume(resume, simple);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${cvFilename(resume.cv.fullName, locale, simple)}"`,
      "Cache-Control": "no-store",
    },
  });
}
