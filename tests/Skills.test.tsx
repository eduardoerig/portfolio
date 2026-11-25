import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Skills from "@/components/sections/Skills";
import { getFixturePortfolio } from "@/content/fixture";
import { getDictionary } from "@/i18n/dictionary";
import type { Skill } from "@/lib/types";

const skills: Skill[] = [
  { id: 1, name: "PHP", group: "Back-end", level: "intermediate" },
  { id: 2, name: "React", group: "Front-end", level: "learning" },
  { id: 3, name: "HTML", group: "Front-end", level: null },
];

describe("Skills", () => {
  it("mostra o rótulo de cada nível e nada para quem não tem nível", () => {
    render(<Skills skills={skills} dict={getDictionary("pt")} />);
    expect(screen.getByText("intermediário")).toBeTruthy();
    expect(screen.getByText("aprendendo")).toBeTruthy();
    expect(screen.getByText("HTML").textContent).toBe("HTML");
  });

  it("em inglês usa intermediate e learning", () => {
    render(<Skills skills={skills} dict={getDictionary("en")} />);
    expect(screen.getByText("intermediate")).toBeTruthy();
    expect(screen.getByText("learning")).toBeTruthy();
  });

  it("o fixture tem PHP, Node.js e APIs REST como intermediário (PT e EN)", () => {
    const names = (l: "pt" | "en") =>
      getFixturePortfolio(l).skills.filter((s) => s.level === "intermediate").map((s) => s.name);
    expect(names("pt")).toEqual(["PHP", "Node.js", "APIs REST"]);
    expect(names("en")).toEqual(["PHP", "Node.js", "REST APIs"]);
  });
});
