import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ContentTools from "@/components/admin/ContentTools";

const exportContent = vi.fn();
const checkLinks = vi.fn();
vi.mock("@/app/(admin)/admin/actions", () => ({
  exportContent: () => exportContent(),
  checkLinks: () => checkLinks(),
}));
beforeEach(() => {
  vi.clearAllMocks();
  URL.createObjectURL = vi.fn(() => "blob:backup");
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ContentTools", () => {
  it("baixa o backup como arquivo JSON com a data no nome", async () => {
    exportContent.mockResolvedValue({ version: 1, projects: [] });
    const names: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      names.push(this.download);
    });
    render(<ContentTools />);
    fireEvent.click(screen.getByRole("button", { name: "Baixar backup (JSON)" }));
    expect(await screen.findByText(/Backup baixado/)).toBeTruthy();
    expect(names).toHaveLength(1);
    expect(names[0]).toMatch(/^portfolio-backup-\d{4}-\d{2}-\d{2}\.json$/);
  });

  it("verificar links lista só os problemas, com o nome do item", async () => {
    checkLinks.mockResolvedValue([
      { label: "Requests", url: "https://a.test", state: "ok", status: 200 },
      { label: "Dolce", url: "https://b.test", state: "broken", status: 404 },
      { label: "LinkedIn", url: "https://linkedin.com/in/x", state: "unknown", status: 999 },
    ]);
    render(<ContentTools />);
    fireEvent.click(screen.getByRole("button", { name: "Verificar links" }));
    expect(await screen.findByText(/1 link quebrado/)).toBeTruthy();
    expect(screen.getByText("Dolce")).toBeTruthy();
    expect(screen.getByText(/não deixa verificar/)).toBeTruthy();
    expect(screen.queryByText("Requests")).toBeNull();
  });

  it("todos os links ok: avisa", async () => {
    checkLinks.mockResolvedValue([{ label: "Requests", url: "https://a.test", state: "ok", status: 200 }]);
    render(<ContentTools />);
    fireEvent.click(screen.getByRole("button", { name: "Verificar links" }));
    expect(await screen.findByText("Todos os links responderam (1).")).toBeTruthy();
  });
});
