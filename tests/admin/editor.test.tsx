import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminStatusProvider, useAdminStatus } from "@/components/admin/AdminStatus";
import ItemEditor from "@/components/admin/ItemEditor";
import ProfileEditor from "@/components/admin/ProfileEditor";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
  usePathname: () => "/admin",
}));
const saveItem = vi.fn();
const updateProfile = vi.fn();
vi.mock("@/app/(admin)/admin/actions", () => ({
  saveItem: (...a: unknown[]) => saveItem(...a),
  updateProfile: (...a: unknown[]) => updateProfile(...a),
}));

beforeEach(() => {
  vi.clearAllMocks();
  saveItem.mockResolvedValue({ ok: true });
  updateProfile.mockResolvedValue({ ok: true });
});
afterEach(cleanup);

const profileRow = {
  id: 1, name: "Ana", role: "Desenvolvedora", roleEn: "Developer", summary: "Resumo", summaryEn: "",
  email: "a@x.dev", githubUrl: "https://g", linkedinUrl: "https://l", openToWork: false, photoPath: null, cvPath: null,
};
const wrap = (ui: React.ReactNode) => render(<AdminStatusProvider>{ui}</AdminStatusProvider>);
const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe("ProfileEditor", () => {
  it("digitar atualiza a prévia sem chamar a action", () => {
    wrap(<ProfileEditor row={profileRow} />);
    type("Nome", "Beatriz Lima");
    expect(screen.getAllByText(/Beatriz/).length).toBeGreaterThan(0);
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it("Ctrl+S salva uma vez com o valor digitado", async () => {
    wrap(<ProfileEditor row={profileRow} />);
    type("Nome", "Beatriz Lima");
    const ev = new KeyboardEvent("keydown", { key: "s", ctrlKey: true, cancelable: true });
    await act(async () => void window.dispatchEvent(ev));
    expect(ev.defaultPrevented).toBe(true);
    expect(updateProfile).toHaveBeenCalledTimes(1);
    expect((updateProfile.mock.calls[0][0] as FormData).get("name")).toBe("Beatriz Lima");
    expect(refresh).toHaveBeenCalled();
  });

  it("se a action lança, mostra o erro e mantém o texto", async () => {
    updateProfile.mockRejectedValue(new Error("x"));
    wrap(<ProfileEditor row={profileRow} />);
    type("Nome", "Beatriz Lima");
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect((await screen.findAllByRole("alert")).length).toBeGreaterThan(0);
    expect((screen.getByLabelText("Nome") as HTMLInputElement).value).toBe("Beatriz Lima");
  });

  it("no modo EN o Cargo mostra roleEn e o português como placeholder", () => {
    wrap(<ProfileEditor row={profileRow} />);
    fireEvent.click(screen.getByRole("radio", { name: /EN/ }));
    const role = screen.getByLabelText("Cargo") as HTMLInputElement;
    expect(role.value).toBe("Developer");
    expect(role.placeholder).toBe("Desenvolvedora");
  });
});

describe("ItemEditor", () => {
  const project = { id: 3, title: "Pedidos", titleEn: "", description: "d", descriptionEn: "", stack: '["PHP"]', stackEn: "[]", url: "", metric: "", metricEn: "", imagePath: null, visible: true };

  it("item novo volta para a lista", async () => {
    wrap(<ItemEditor kind="project" row={null} base="/admin/projetos" />);
    type("Título", "Novo");
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/admin/projetos"));
    expect(refresh).toHaveBeenCalled();
  });

  it("item existente fica aberto e atualiza", async () => {
    wrap(<ItemEditor kind="project" row={project} base="/admin/projetos" />);
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(push).not.toHaveBeenCalled();
  });

  it("dois cliques rápidos enviam uma vez só", async () => {
    saveItem.mockReturnValue(new Promise(() => {}));
    wrap(<ItemEditor kind="project" row={project} base="/admin/projetos" />);
    const btn = screen.getByRole("button", { name: "Salvar" });
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(saveItem).toHaveBeenCalledTimes(1);
  });

  it("etiqueta nova vai no FormData uma por linha", async () => {
    wrap(<ItemEditor kind="project" row={project} base="/admin/projetos" />);
    const tags = screen.getByLabelText("Tecnologias");
    fireEvent.change(tags, { target: { value: "MySQL" } });
    fireEvent.keyDown(tags, { key: "Enter" });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(saveItem).toHaveBeenCalled());
    expect((saveItem.mock.calls[0][1] as FormData).get("stack")).toBe("PHP\nMySQL");
  });

  it("erro do servidor aparece junto ao campo", async () => {
    saveItem.mockResolvedValue({ errors: { title: "Título: campo obrigatório" } });
    wrap(<ItemEditor kind="project" row={project} base="/admin/projetos" />);
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(await screen.findByText("Título: campo obrigatório")).toBeTruthy();
  });
});

describe("não perder o que foi digitado", () => {
  const project = { id: 3, title: "Pedidos", titleEn: "", description: "d", descriptionEn: "", stack: '["PHP"]', stackEn: "[]", url: "", metric: "", metricEn: "", imagePath: null, visible: true };

  it("erro só no outro idioma leva para ele e mostra o aviso", async () => {
    saveItem.mockResolvedValue({ errors: { title: "Título: campo obrigatório" } });
    wrap(<ItemEditor kind="project" row={project} base="/admin/projetos" />);
    fireEvent.click(screen.getByRole("radio", { name: /EN/ }));
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(await screen.findByText("Título: campo obrigatório")).toBeTruthy();
    expect(screen.getByRole("radio", { name: /PT/ }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByText("Corrija os campos destacados.")).toBeTruthy();
  });

  it("texto pendente na etiqueta entra ao clicar em Salvar (blur) e marca como não salvo", async () => {
    let dirty = false;
    const Probe = () => { dirty = useAdminStatus().dirty; return null; };
    render(<AdminStatusProvider><Probe /><ItemEditor kind="project" row={project} base="/admin/projetos" /></AdminStatusProvider>);
    const tags = screen.getByLabelText("Tecnologias");
    tags.focus();
    fireEvent.change(tags, { target: { value: "MySQL" } });
    expect(dirty).toBe(true);
    fireEvent.blur(tags);
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(saveItem).toHaveBeenCalled());
    expect((saveItem.mock.calls[0][1] as FormData).get("stack")).toBe("PHP\nMySQL");
  });

  it("Ctrl+S também leva o texto pendente da etiqueta", async () => {
    wrap(<ItemEditor kind="project" row={project} base="/admin/projetos" />);
    const tags = screen.getByLabelText("Tecnologias");
    tags.focus();
    fireEvent.change(tags, { target: { value: "MySQL" } });
    await act(async () => void window.dispatchEvent(new KeyboardEvent("keydown", { key: "s", ctrlKey: true, cancelable: true })));
    await waitFor(() => expect(saveItem).toHaveBeenCalledTimes(1));
    expect((saveItem.mock.calls[0][1] as FormData).get("stack")).toBe("PHP\nMySQL");
  });

  it("prévia avisa quando o item está oculto", () => {
    wrap(<ItemEditor kind="project" row={{ ...project, visible: false }} base="/admin/projetos" />);
    expect(screen.getByText("oculto — não aparece no site")).toBeTruthy();
  });
});

describe("prévia fiel ao site", () => {
  const withImage = { id: 3, title: "Pedidos", titleEn: "", description: "d", descriptionEn: "", stack: "[]", stackEn: "[]", url: "", metric: "", metricEn: "", imagePath: "/uploads/a.png", visible: true };
  const previewImgs = (c: HTMLElement) => c.querySelectorAll("aside img").length;

  it("marcar remover tira a imagem da prévia na hora", () => {
    const { container } = wrap(<ItemEditor kind="project" row={withImage} base="/admin/projetos" />);
    expect(previewImgs(container)).toBe(1);
    fireEvent.click(screen.getByLabelText("remover"));
    expect(previewImgs(container)).toBe(0);
  });

  it("depois de salvar com remoção a prévia continua sem imagem", async () => {
    const { container } = wrap(<ItemEditor kind="project" row={withImage} base="/admin/projetos" />);
    fireEvent.click(screen.getByLabelText("remover"));
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect((saveItem.mock.calls[0][1] as FormData).get("remove_image")).toBe("on");
    expect(previewImgs(container)).toBe(0);
    expect(screen.queryByText("ver arquivo atual")).toBeNull();
  });

  it("competências do EN aparecem em inglês na prévia", () => {
    const siblings = {
      pt: [{ id: 1, name: "Banco de dados", group: "Back-end", level: null }],
      en: [{ id: 1, name: "Databases", group: "Back-end", level: null }],
    };
    const row = { id: 2, name: "Go", nameEn: "", group: "Back-end", groupEn: "", level: "", visible: true };
    wrap(<ItemEditor kind="skill" row={row} base="/admin/competencias" siblings={siblings} />);
    expect(screen.getByText("Banco de dados")).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: /EN/ }));
    expect(screen.getByText("Databases")).toBeTruthy();
    expect(screen.queryByText("Banco de dados")).toBeNull();
  });
});

describe("guardas do editor", () => {
  const row = { id: 3, title: "Pedidos", titleEn: "", description: "d", descriptionEn: "", stack: "[]", stackEn: "[]", url: "", metric: "", metricEn: "", imagePath: null, visible: true };
  const ctrlS = () => fireEvent.keyDown(window, { key: "s", ctrlKey: true });
  const Probe = ({ out }: { out: { dirty?: boolean } }) => {
    out.dirty = useAdminStatus().dirty;
    return null;
  };

  it("segundo Ctrl+S após salvar item novo não cria outro", async () => {
    wrap(<ItemEditor kind="project" row={null} base="/admin/projetos" />);
    type("Título", "Novo");
    ctrlS();
    await waitFor(() => expect(push).toHaveBeenCalled());
    ctrlS();
    await act(async () => {});
    expect(saveItem).toHaveBeenCalledTimes(1);
  });

  it("Ctrl+S repetido durante o envio chama a action uma vez", () => {
    saveItem.mockReturnValue(new Promise(() => {}));
    wrap(<ItemEditor kind="project" row={row} base="/admin/projetos" />);
    ctrlS();
    ctrlS();
    expect(saveItem).toHaveBeenCalledTimes(1);
  });

  it("alteração feita durante o envio mantém o aviso de não salvo", async () => {
    let resolve!: (v: { ok: boolean }) => void;
    saveItem.mockReturnValue(new Promise((r) => (resolve = r)));
    const out: { dirty?: boolean } = {};
    wrap(<><Probe out={out} /><ItemEditor kind="project" row={row} base="/admin/projetos" /></>);
    type("Título", "A");
    ctrlS();
    type("Título", "AB");
    await act(async () => resolve({ ok: true }));
    expect(out.dirty).toBe(true);
  });

  it("dirty: limpo ao abrir, marcado ao editar, limpo ao salvar; beforeunload acompanha", async () => {
    const out: { dirty?: boolean } = {};
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    wrap(<><Probe out={out} /><ItemEditor kind="project" row={row} base="/admin/projetos" /></>);
    expect(out.dirty).toBe(false);
    type("Título", "B");
    expect(out.dirty).toBe(true);
    expect(add.mock.calls.some(([t]) => t === "beforeunload")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(out.dirty).toBe(false));
    expect(remove.mock.calls.some(([t]) => t === "beforeunload")).toBe(true);
  });

  it("ponto do EN não aparece com lista vazia em português", () => {
    wrap(<ItemEditor kind="project" row={{ ...row, title: "", description: "" }} base="/admin/projetos" />);
    expect(screen.queryByText("tradução incompleta")).toBeNull();
    type("Título", "Pedidos");
    expect(screen.getByText("tradução incompleta").className).toContain("sr-only");
  });
});
