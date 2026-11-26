import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import StorageCleanup from "@/components/admin/StorageCleanup";

const cleanStorage = vi.fn();
vi.mock("@/app/(admin)/admin/actions", () => ({ cleanStorage: (apply: boolean) => cleanStorage(apply) }));
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

const MB = 1024 * 1024;

describe("StorageCleanup", () => {
  it("mostra antes o que vai apagar; só apaga ao confirmar", async () => {
    cleanStorage.mockResolvedValue({ removed: 2, freedBytes: 1.5 * MB, totalBytes: 12.34 * MB });
    render(<StorageCleanup />);
    fireEvent.click(screen.getByRole("button", { name: "Ver arquivos não usados" }));
    expect(await screen.findByText("2 arquivos não usados (1,5 MB).")).toBeTruthy();
    expect(cleanStorage).toHaveBeenLastCalledWith(false);
    fireEvent.click(screen.getByRole("button", { name: "Apagar 2 arquivos" }));
    expect(await screen.findByText("2 arquivos apagados · 1,5 MB liberados · total usado 12,3 MB")).toBeTruthy();
    expect(cleanStorage).toHaveBeenLastCalledWith(true);
  });

  it("nada para apagar: avisa e não oferece apagar", async () => {
    cleanStorage.mockResolvedValue({ removed: 0, freedBytes: 0, totalBytes: 12.34 * MB });
    render(<StorageCleanup />);
    fireEvent.click(screen.getByRole("button", { name: "Ver arquivos não usados" }));
    expect(await screen.findByText("Nenhum arquivo não usado · total usado 12,3 MB")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Apagar/ })).toBeNull();
  });

  it("falha vira aviso, sem quebrar a página", async () => {
    cleanStorage.mockImplementation(async () => {
      throw new Error("x");
    });
    render(<StorageCleanup />);
    fireEvent.click(screen.getByRole("button", { name: "Ver arquivos não usados" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Não deu para verificar");
  });
});
