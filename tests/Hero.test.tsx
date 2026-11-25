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
    expect(screen.getByRole("img").getAttribute("src")).toBe("/files/a.png");
  });
});
