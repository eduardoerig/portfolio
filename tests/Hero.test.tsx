import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Hero from "@/components/sections/Hero";
import { fixturePortfolio } from "@/content/fixture";
import { getDictionary } from "@/i18n/dictionary";

const dict = getDictionary("pt");
const profile = fixturePortfolio.profile;

describe("Hero", () => {
  it("sem foto cai nas iniciais", () => {
    render(<Hero profile={{ ...profile, photoPath: null }} dict={dict} />);
    expect(screen.getByText("EE")).toBeTruthy();
  });

  it("o botão baixa o currículo gerado do idioma da página, sem depender de arquivo enviado", () => {
    const pt = render(<Hero profile={profile} dict={dict} />).container.querySelector("a[download]")!;
    expect(pt.textContent).toBe(dict.hero.downloadCv);
    expect(pt.getAttribute("href")).toBe("/curriculo.pdf");
    const en = render(<Hero profile={profile} dict={getDictionary("en")} />).container.querySelector("a[download]")!;
    expect(en.getAttribute("href")).toBe("/en/resume.pdf");
  });

  it("a foto sai reduzida para o tamanho exibido, não o arquivo original", () => {
    const { container } = render(<Hero profile={{ ...profile, photoPath: "https://pub.test/a.jpg" }} dict={dict} />);
    const img = container.querySelector("img")!;
    expect(img.getAttribute("src")).toContain("/_next/image?url=https%3A%2F%2Fpub.test%2Fa.jpg");
    expect(img.getAttribute("srcset")).toContain("w=384");
  });
});
