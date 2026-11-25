import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Preview from "@/components/admin/Preview";

afterEach(cleanup);

describe("Preview", () => {
  it("projeto em inglês sem tradução cai no português", () => {
    render(<Preview kind="project" locale="en" draft={{ id: "", title: "Pedidos", titleEn: "" }} />);
    expect(screen.getByText("Pedidos")).toBeTruthy();
  });

  it("projeto em inglês usa a tradução", () => {
    render(<Preview kind="project" locale="en" draft={{ id: "", title: "Pedidos", titleEn: "Requests" }} />);
    expect(screen.getByText("Requests")).toBeTruthy();
    expect(screen.queryByText("Pedidos")).toBeNull();
  });

  it("competência editada substitui a de mesmo id", () => {
    const siblings = [
      { id: 1, name: "PHP", group: "Back-end", level: null },
      { id: 2, name: "Node.js", group: "Back-end", level: "intermediate" as const },
    ];
    render(<Preview kind="skill" locale="pt" siblings={siblings} draft={{ id: "2", name: "Node", group: "Back-end" }} />);
    expect(screen.getByText("PHP")).toBeTruthy();
    expect(screen.getByText("Node")).toBeTruthy();
    expect(screen.queryByText("Node.js")).toBeNull();
  });

  it("competência nova entra no fim", () => {
    const siblings = [{ id: 1, name: "PHP", group: "Back-end", level: null }];
    render(<Preview kind="skill" locale="pt" siblings={siblings} draft={{ id: "", name: "Go", group: "Back-end" }} />);
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(["PHP", "Go"]);
  });

  it("perfil mostra nome e e-mail do rascunho", () => {
    render(<Preview kind="profile" locale="pt" draft={{ name: "Ana Souza", email: "ana@x.dev" }} />);
    expect(screen.getAllByText(/Ana/).length).toBeGreaterThan(0);
    expect(screen.getByText("ana@x.dev")).toBeTruthy();
    expect(screen.getByText("PT")).toBeTruthy();
  });
});
