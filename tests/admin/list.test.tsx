import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminStatusProvider } from "@/components/admin/AdminStatus";
import ItemCard from "@/components/admin/ItemCard";
import RowActions from "@/components/admin/RowActions";

const deleteItem = vi.fn();
vi.mock("@/app/(admin)/admin/actions", () => ({
  deleteItem: (...a: unknown[]) => deleteItem(...a),
  move: vi.fn(),
  toggleVisible: vi.fn(),
}));

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("ItemCard", () => {
  it("projeto oculto mostra 'oculto' e o cartão inteiro é um link", () => {
    const row = { id: 3, order: 0, visible: false, title: "Meu projeto", stack: '["React","Node"]', imagePath: null };
    render(<AdminStatusProvider><ItemCard kind="project" row={row} href="/admin/projetos?editar=3" /></AdminStatusProvider>);
    expect(screen.getByText("oculto")).toBeTruthy();
    expect(screen.getByRole("link").getAttribute("href")).toBe("/admin/projetos?editar=3");
    expect(screen.getByText("React")).toBeTruthy();
  });
});

describe("RowActions", () => {
  const setup = () => render(<RowActions kind="project" id={1} visible editHref="/x?editar=1" />);

  it("tem as cinco ações com nome acessível", () => {
    setup();
    for (const n of ["Subir", "Descer", "Ocultar", "Editar", "Excluir"]) expect(screen.getByLabelText(n)).toBeTruthy();
  });

  it("não exclui quando a confirmação é recusada", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    setup();
    fireEvent.click(screen.getByLabelText("Excluir"));
    expect(deleteItem).not.toHaveBeenCalled();
  });
});
