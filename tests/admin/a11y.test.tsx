import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminHeader from "@/components/admin/AdminHeader";
import { AdminStatusProvider } from "@/components/admin/AdminStatus";
import { Field, Select } from "@/components/admin/controls";
import ImageField from "@/components/admin/ImageField";
import RowActions from "@/components/admin/RowActions";
import Sidebar from "@/components/admin/Sidebar";
import TagInput from "@/components/admin/TagInput";

vi.mock("next/navigation", () => ({ usePathname: () => "/admin/projetos", useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/app/(admin)/admin/login/actions", () => ({ logout: vi.fn() }));
vi.mock("@/app/(admin)/admin/actions", () => ({ deleteItem: vi.fn(), move: vi.fn(), toggleVisible: vi.fn() }));
afterEach(cleanup);

const counts = { projetos: 4, experiencias: 2, competencias: 9, formacao: 1, idiomas: 2 };
const described = (el: HTMLElement) =>
  (el.getAttribute("aria-describedby") ?? "").split(" ").filter(Boolean).map((id) => document.getElementById(id)?.textContent);

describe("acessibilidade do painel", () => {
  it("erro e dica ficam ligados ao campo (leitor de tela lê junto)", () => {
    render(<Field label="Título" name="title" value="" onChange={() => {}} hint="Curto" error="Campo obrigatório" />);
    const input = screen.getByLabelText("Título");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(described(input)).toEqual(["Curto", "Campo obrigatório"]);
  });

  it("campo sem erro não se diz inválido", () => {
    render(<Select label="Nível" name="l" value="" onChange={() => {}} options={[["", "—"]]} />);
    expect(screen.getByLabelText("Nível").getAttribute("aria-invalid")).toBeNull();
  });

  it("etiquetas: erro ligado ao campo e o X tem área de toque", () => {
    render(<TagInput label="Tecnologias" value={["PHP"]} onChange={() => {}} error="Inválido" />);
    const input = screen.getByLabelText("Tecnologias");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(described(input)).toContain("Inválido");
    expect(screen.getByRole("button", { name: "Remover PHP" }).className).toMatch(/p-1/);
  });

  it("imagem: botões ligados ao rótulo do campo e miniatura com texto útil", () => {
    render(<ImageField label="Foto" url="/x.png" busy={false} onPick={() => {}} onRemove={() => {}} />);
    expect(described(screen.getByRole("button", { name: "Trocar" }))).toContain("Foto");
    expect(screen.getByAltText("Foto atual")).toBeTruthy();
  });

  it("ações da linha dizem qual item", () => {
    render(<AdminStatusProvider><RowActions kind="project" id={1} name="Requests" visible editHref="/x" /></AdminStatusProvider>);
    expect(screen.getByRole("button", { name: "Excluir Requests" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Editar Requests" })).toBeTruthy();
  });

  it("topo tem link para pular direto ao conteúdo", () => {
    render(<AdminStatusProvider><AdminHeader name="Eduardo Erig" photoPath={null} /></AdminStatusProvider>);
    expect(screen.getByRole("link", { name: "Pular para o conteúdo" }).getAttribute("href")).toBe("#conteudo");
  });

  it("gaveta: foco vai para o menu ao abrir e volta ao ☰ ao fechar", () => {
    render(
      <AdminStatusProvider>
        <AdminHeader name="Eduardo Erig" photoPath={null} />
        <Sidebar counts={counts} />
      </AdminStatusProvider>,
    );
    const burger = screen.getByRole("button", { name: "Abrir menu" });
    act(() => fireEvent.click(burger));
    expect(document.activeElement?.textContent).toContain("Perfil");
    fireEvent.click(screen.getByRole("button", { name: "Fechar menu" }));
    expect(document.activeElement).toBe(burger);
  });

  it("gaveta tem o link para ver o site", () => {
    render(<AdminStatusProvider><Sidebar counts={counts} /></AdminStatusProvider>);
    expect(screen.getByRole("link", { name: /Ver site/ }).getAttribute("href")).toBe("/");
  });
});
