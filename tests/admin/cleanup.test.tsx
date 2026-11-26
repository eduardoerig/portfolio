import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import StorageCleanup from "@/components/admin/StorageCleanup";

const cleanStorage = vi.fn();
vi.mock("@/app/(admin)/admin/actions", () => ({ cleanStorage: () => cleanStorage() }));
afterEach(cleanup);

describe("StorageCleanup", () => {
  it("limpa e mostra o resultado em MB", async () => {
    cleanStorage.mockResolvedValue({ removed: 2, freedBytes: 1.5 * 1024 * 1024, totalBytes: 12.34 * 1024 * 1024 });
    render(<StorageCleanup />);
    fireEvent.click(screen.getByRole("button", { name: "Limpar arquivos soltos" }));
    expect(await screen.findByText("2 arquivos removidos · 1,5 MB liberados · total usado 12,3 MB")).toBeTruthy();
  });

  it("falha vira aviso, sem quebrar a página", async () => {
    cleanStorage.mockRejectedValue(new Error("x"));
    render(<StorageCleanup />);
    fireEvent.click(screen.getByRole("button", { name: "Limpar arquivos soltos" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Não deu para limpar");
  });
});
