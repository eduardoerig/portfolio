import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminStatusProvider } from "@/components/admin/AdminStatus";
import ItemCard from "@/components/admin/ItemCard";
import ListRow from "@/components/admin/ListRow";
import RowActions from "@/components/admin/RowActions";
import Toast from "@/components/admin/Toast";

const deleteItem = vi.fn();
const toggleVisible = vi.fn();
const move = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/app/(admin)/admin/actions", () => ({
  deleteItem: (...a: unknown[]) => deleteItem(...a),
  move: (...a: unknown[]) => move(...a),
  toggleVisible: (...a: unknown[]) => toggleVisible(...a),
}));

beforeEach(() => {
  vi.clearAllMocks();
  deleteItem.mockResolvedValue(undefined);
  toggleVisible.mockResolvedValue(undefined);
  move.mockResolvedValue(undefined);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("ItemCard", () => {
  it("projeto oculto mostra 'oculto' e o cartão inteiro é um link", () => {
    const row = { id: 3, order: 0, visible: false, title: "Meu projeto", stack: '["React","Node"]', imagePath: null };
    render(<AdminStatusProvider><ItemCard kind="project" row={row} href="/admin/projetos?editar=3" /></AdminStatusProvider>);
    expect(screen.getByText("oculto")).toBeTruthy();
    expect(screen.getByRole("link").getAttribute("href")).toBe("/admin/projetos?editar=3");
    expect(screen.getByText("React")).toBeTruthy();
    // sem opacidade no cartão inteiro: o texto continua legível
    expect(screen.getByRole("link").className).not.toContain("opacity");
  });
});

describe("ItemCard de idioma", () => {
  it("mostra nome e nível", () => {
    const row = { id: 1, order: 0, visible: true, name: "Português", level: "Nativo", proficiency: 5 };
    render(<AdminStatusProvider><ItemCard kind="language" row={row} href="/admin/idiomas?editar=1" /></AdminStatusProvider>);
    expect(screen.getByText("Português · Nativo")).toBeTruthy();
  });
});

describe("RowActions", () => {
  const view = (props: Partial<Parameters<typeof RowActions>[0]> = {}) =>
    render(
      <AdminStatusProvider>
        <ul>
          <ListRow rowKey="project:1">
            <span>Linha 1</span>
            <RowActions kind="project" id={1} visible editHref="/x?editar=1" {...props} />
          </ListRow>
        </ul>
        <Toast />
      </AdminStatusProvider>,
    );
  const wait = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

  it("tem as cinco ações com nome acessível", () => {
    view();
    for (const n of ["Subir", "Descer", "Ocultar", "Editar", "Excluir"]) expect(screen.getByLabelText(n)).toBeTruthy();
  });

  it("excluir some na hora, sem pergunta, e só apaga depois do aviso", async () => {
    vi.useFakeTimers();
    const ask = vi.spyOn(window, "confirm");
    view();
    fireEvent.click(screen.getByLabelText("Excluir"));
    expect(ask).not.toHaveBeenCalled();
    expect(screen.queryByText("Linha 1")).toBeNull();
    expect(screen.getByText("Item excluído.")).toBeTruthy();
    expect(deleteItem).not.toHaveBeenCalled();
    await wait(8000);
    expect(deleteItem).toHaveBeenCalledWith("project", 1);
  });

  it("Desfazer traz a linha de volta e nada é apagado", async () => {
    vi.useFakeTimers();
    view();
    fireEvent.click(screen.getByLabelText("Excluir"));
    fireEvent.click(screen.getByRole("button", { name: "Desfazer" }));
    expect(screen.getByText("Linha 1")).toBeTruthy();
    await wait(10_000);
    expect(deleteItem).not.toHaveBeenCalled();
  });

  it("se apagar falha, a linha volta e avisa", async () => {
    vi.useFakeTimers();
    deleteItem.mockRejectedValue(new Error("x"));
    view();
    fireEvent.click(screen.getByLabelText("Excluir"));
    await wait(8000);
    expect(screen.getByText("Linha 1")).toBeTruthy();
    expect(screen.getByText(/Não deu para excluir/)).toBeTruthy();
  });

  it("ocultar avisa que saiu do site", async () => {
    view();
    fireEvent.click(screen.getByLabelText("Ocultar"));
    expect(await screen.findByText("Item ocultado do site.")).toBeTruthy();
    expect(toggleVisible).toHaveBeenCalledWith("project", 1);
  });

  it("Subir no primeiro item fica indisponível sem perder o foco do teclado", () => {
    view({ first: true });
    const up = screen.getByLabelText("Subir");
    up.focus();
    fireEvent.click(up);
    expect(up.getAttribute("aria-disabled")).toBe("true");
    expect(up.hasAttribute("disabled")).toBe(false);
    expect(move).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(up);
  });
});
