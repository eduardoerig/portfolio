import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProjectCard from "@/components/ProjectCard";
import { getDictionary } from "@/i18n/dictionary";
import type { Project } from "@/lib/types";

const base: Project = {
  id: 1,
  title: "Projeto",
  description: "Descrição",
  stack: ["PHP", "MySQL"],
  url: null,
  imagePath: null,
  metric: null,
};

const dict = getDictionary("pt").projects;

describe("ProjectCard", () => {
  it("sem url e sem imagem, não mostra link nem img, e mostra toda a stack", () => {
    render(<ProjectCard project={base} dict={dict} />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("PHP")).toBeTruthy();
    expect(screen.getByText("MySQL")).toBeTruthy();
  });

  it("mostra a métrica quando existe", () => {
    render(<ProjectCard project={{ ...base, metric: "1.777 views" }} dict={dict} />);
    expect(screen.getByText("1.777 views")).toBeTruthy();
  });

  it("a imagem do projeto sai reduzida, com versões por largura de tela", () => {
    render(<ProjectCard project={{ ...base, imagePath: "https://pub.test/p.png" }} dict={dict} />);
    const img = screen.getByRole("img");
    expect(img.getAttribute("src")).toContain("/_next/image?url=https%3A%2F%2Fpub.test%2Fp.png");
    expect(img.getAttribute("sizes")).toBeTruthy();
  });
});
