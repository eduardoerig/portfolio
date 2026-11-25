import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Hero from "@/components/sections/Hero";
import { fixturePortfolio } from "@/content/fixture";
import { getDictionary } from "@/i18n/dictionary";

const dict = getDictionary("pt");
const profile = fixturePortfolio.profile;

describe("Hero", () => {
  it("sem currículo não mostra o botão, e a foto cai nas iniciais", () => {
    render(<Hero profile={{ ...profile, cvPath: null, photoPath: null }} dict={dict} />);
    expect(screen.queryByText(dict.hero.downloadCv)).toBeNull();
    expect(screen.getByText("EE")).toBeTruthy();
  });

  it("com currículo mostra o botão com download, e com foto mostra a imagem", () => {
    render(<Hero profile={{ ...profile, cvPath: "/files/a.pdf", photoPath: "/files/a.png" }} dict={dict} />);
    const link = screen.getByText(dict.hero.downloadCv);
    expect(link.getAttribute("href")).toBe("/files/a.pdf");
    expect(link.hasAttribute("download")).toBe(true);
  });

  it("a foto sai reduzida para o tamanho exibido, não o arquivo original", () => {
    const { container } = render(<Hero profile={{ ...profile, photoPath: "https://pub.test/a.jpg" }} dict={dict} />);
    const img = container.querySelector("img")!;
    expect(img.getAttribute("src")).toContain("/_next/image?url=https%3A%2F%2Fpub.test%2Fa.jpg");
    expect(img.getAttribute("srcset")).toContain("w=384");
  });
});
