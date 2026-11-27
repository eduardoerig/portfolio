import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminStatusProvider } from "@/components/admin/AdminStatus";
import ItemEditor from "@/components/admin/ItemEditor";
import ProfileEditor from "@/components/admin/ProfileEditor";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }), usePathname: () => "/admin" }));
const saveItem = vi.fn();
vi.mock("@/app/(admin)/admin/actions", () => ({
  saveItem: (...a: unknown[]) => saveItem(...a),
  updateProfile: vi.fn(async () => ({ ok: true })),
  requestUpload: vi.fn(),
}));
beforeEach(() => {
  vi.clearAllMocks();
  saveItem.mockResolvedValue({ ok: true });
});
afterEach(cleanup);

const project = { id: 3, title: "Pedidos", titleEn: "", description: "d", descriptionEn: "Orders", stack: '["PHP"]', stackEn: "[]", url: "", metric: "", metricEn: "", imagePath: null, visible: true };
const wrap = (ui: React.ReactNode) => render(<AdminStatusProvider>{ui}</AdminStatusProvider>);

describe("formulário a partir do modelo", () => {
  it("separa em seções com título", () => {
    wrap(<ItemEditor kind="project" row={project} base="/admin/projetos" />);
    for (const t of ["Sobre o projeto", "Detalhes", "Imagem"]) expect(screen.getByRole("heading", { name: t })).toBeTruthy();
  });

  it("campo traduzível mostra PT e EN juntos; EN vazio mostra o português e avisa que falta traduzir", () => {
    wrap(<ItemEditor kind="project" row={project} base="/admin/projetos" />);
    const group = screen.getByRole("group", { name: /Título/ });
    const pt = within(group).getByLabelText("Título em português") as HTMLInputElement;
    const en = within(group).getByLabelText("Título em inglês") as HTMLInputElement;
    expect(pt.value).toBe("Pedidos");
    expect(en.value).toBe("");
    expect(en.placeholder).toBe("Pedidos");
    expect(within(group).getByText("falta traduzir")).toBeTruthy();
    // descrição já traduzida: sem aviso
    expect(within(screen.getByRole("group", { name: /Descrição/ })).queryByText("falta traduzir")).toBeNull();
  });

  it("obrigatório tem * e aria-required; legenda explica o *", () => {
    wrap(<ItemEditor kind="project" row={project} base="/admin/projetos" />);
    expect(screen.getByLabelText("Título em português").getAttribute("aria-required")).toBe("true");
    expect(screen.getByLabelText("Título em inglês").getAttribute("aria-required")).toBeNull();
    expect(screen.getByText("* obrigatório")).toBeTruthy();
  });

  it("contador de caracteres acompanha o texto", () => {
    wrap(<ItemEditor kind="project" row={project} base="/admin/projetos" />);
    fireEvent.change(screen.getByLabelText("Título em português"), { target: { value: "Sistema" } });
    expect(screen.getAllByText("7/50").length).toBeGreaterThan(0);
  });

  it("ao sair de um obrigatório vazio, o erro aparece na hora (sem esperar o servidor)", () => {
    wrap(<ItemEditor kind="project" row={null} base="/admin/projetos" />);
    const title = screen.getByLabelText("Título em português");
    fireEvent.focus(title);
    fireEvent.blur(title);
    expect(screen.getByText("Campo obrigatório")).toBeTruthy();
    expect(title.getAttribute("aria-invalid")).toBe("true");
    fireEvent.change(title, { target: { value: "Novo" } });
    expect(screen.queryByText("Campo obrigatório")).toBeNull();
    expect(saveItem).not.toHaveBeenCalled();
  });

  it("link inválido avisa ao sair do campo", () => {
    wrap(<ItemEditor kind="project" row={project} base="/admin/projetos" />);
    const url = screen.getByLabelText("Link");
    fireEvent.change(url, { target: { value: "github.com/x" } });
    fireEvent.blur(url);
    expect(screen.getByText("Link inválido: comece com https://")).toBeTruthy();
  });

  it("clicar num campo em inglês troca a prévia para EN", () => {
    wrap(<ItemEditor kind="project" row={project} base="/admin/projetos" />);
    expect(screen.getByRole("button", { name: "Prévia em PT", pressed: true })).toBeTruthy();
    fireEvent.focus(screen.getByLabelText("Descrição em inglês"));
    expect(screen.getByRole("button", { name: "Prévia em EN", pressed: true })).toBeTruthy();
    expect(screen.getAllByText("Orders").length).toBeGreaterThan(0);
  });

  it("'Visível no site' é uma chave no cabeçalho", () => {
    wrap(<ItemEditor kind="project" row={project} base="/admin/projetos" />);
    const sw = screen.getByRole("switch", { name: "Visível no site" });
    expect(sw.getAttribute("aria-checked")).toBe("true");
    fireEvent.click(sw);
    expect(sw.getAttribute("aria-checked")).toBe("false");
  });

  it("perfil: seções do modelo, com o currículo e os links dos PDFs", () => {
    wrap(<ProfileEditor row={{ id: 1, name: "Ana", role: "Dev", roleEn: "Dev", summary: "S", summaryEn: "S", email: "a@x.dev", githubUrl: "https://g.co", linkedinUrl: "https://l.co", openToWork: true, photoPath: null, fullName: null, location: null, locationEn: null, phone: null, cvClosing: null, cvClosingEn: null }} />);
    for (const t of ["Identidade", "Contato", "Foto", "Currículo"]) expect(screen.getByRole("heading", { name: t })).toBeTruthy();
    expect(screen.getByRole("switch", { name: "Aberto a oportunidades" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getAllByRole("link", { name: /^Currículo/ }).length).toBe(4);
  });
});
