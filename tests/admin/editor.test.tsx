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
const requestUpload = vi.fn();
vi.mock("@/app/(admin)/admin/actions", () => ({
  saveItem: (...a: unknown[]) => saveItem(...a),
  updateProfile: (...a: unknown[]) => updateProfile(...a),
  requestUpload: (...a: unknown[]) => requestUpload(...a),
}));
const KEY = "0b1e7f5c-1d2a-4c3b-9e8f-7a6b5c4d3e2f.png";

beforeEach(() => {
  vi.clearAllMocks();
  saveItem.mockResolvedValue({ ok: true });
  updateProfile.mockResolvedValue({ ok: true });
  requestUpload.mockResolvedValue({ ok: true, key: KEY, url: "https://r2.test/put" });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 200 })));
  URL.createObjectURL = vi.fn(() => "blob:t");
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

const profileRow = {
  id: 1, name: "Ana", role: "Desenvolvedora", roleEn: "Developer", summary: "Resumo", summaryEn: "",
  email: "a@x.dev", githubUrl: "https://g", linkedinUrl: "https://l", openToWork: false, photoPath: null, cvPath: null,
  fullName: null, location: null, locationEn: null, phone: null, cvClosing: null, cvClosingEn: null,
};
const project = { id: 3, title: "Pedidos", titleEn: "", description: "d", descriptionEn: "", stack: '["PHP"]', stackEn: "[]", url: "", metric: "", metricEn: "", imagePath: null, visible: true };
const withImage = { ...project, stack: "[]", imagePath: KEY };
const wrap = (ui: React.ReactNode) => render(<AdminStatusProvider>{ui}</AdminStatusProvider>);
const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
// avança o debounce do autosave (timers falsos)
const wait = (ms = 800) => act(async () => void (await vi.advanceTimersByTimeAsync(ms)));
const pickFile = (label: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { files: [new File([new Uint8Array(10)], "f.png", { type: "image/png" })] } });

describe("ProfileEditor", () => {
  it("digitar atualiza a prévia e grava sozinho depois de 800 ms", async () => {
    vi.useFakeTimers();
    wrap(<ProfileEditor row={profileRow} />);
    type("Nome", "Beatriz Lima");
    expect(screen.getAllByText(/Beatriz/).length).toBeGreaterThan(0);
    expect(updateProfile).not.toHaveBeenCalled();
    await wait();
    expect(updateProfile).toHaveBeenCalledTimes(1);
    expect((updateProfile.mock.calls[0][0] as FormData).get("name")).toBe("Beatriz Lima");
    expect(refresh).not.toHaveBeenCalled(); // a resposta da action já atualiza a tela
    expect(screen.getByText("Salvo ✓")).toBeTruthy();
  });

  it("Ctrl+S grava na hora, uma vez", async () => {
    wrap(<ProfileEditor row={profileRow} />);
    type("Nome", "Beatriz Lima");
    const ev = new KeyboardEvent("keydown", { key: "s", ctrlKey: true, cancelable: true });
    await act(async () => void window.dispatchEvent(ev));
    expect(ev.defaultPrevented).toBe(true);
    await waitFor(() => expect(updateProfile).toHaveBeenCalledTimes(1));
  });

  it("se a action lança, avisa sem conexão, mantém o texto e 'Tentar agora' grava de novo", async () => {
    updateProfile.mockRejectedValueOnce(new Error("x"));
    vi.useFakeTimers();
    wrap(<ProfileEditor row={profileRow} />);
    type("Nome", "Beatriz Lima");
    await wait();
    expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
    expect((screen.getByLabelText("Nome") as HTMLInputElement).value).toBe("Beatriz Lima");
    expect(screen.getByText(/Sem conexão com o servidor/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Tentar agora" }));
    await wait(0);
    expect(updateProfile).toHaveBeenCalledTimes(2);
  });

  it("não tem botão Salvar", () => {
    wrap(<ProfileEditor row={profileRow} />);
    expect(screen.queryByRole("button", { name: "Salvar" })).toBeNull();
  });

  it("tem os campos do currículo, links para os PDFs e nenhum upload de PDF", () => {
    wrap(<ProfileEditor row={profileRow} />);
    for (const label of ["Nome completo (currículo)", "Cidade", "Telefone (só no PDF)", "Frase final do currículo"]) {
      expect(screen.getByLabelText(label, { exact: false })).toBeTruthy(); // o rótulo também traz a dica
    }
    expect(screen.queryByText("Currículo (PDF)")).toBeNull();
    const hrefs = screen.getAllByRole("link", { name: /Ver PDF/ }).map((a) => [a.getAttribute("href"), a.getAttribute("target")]);
    expect(hrefs).toEqual([
      ["/curriculo.pdf", "_blank"],
      ["/curriculo.pdf?modelo=simples", "_blank"],
      ["/en/resume.pdf", "_blank"],
      ["/en/resume.pdf?modelo=simples", "_blank"],
    ]);
  });

  it("no modo EN o Cargo mostra roleEn e o português como placeholder", () => {
    wrap(<ProfileEditor row={profileRow} />);
    fireEvent.click(screen.getByRole("radio", { name: /EN/ }));
    const role = screen.getByLabelText("Cargo") as HTMLInputElement;
    expect(role.value).toBe("Developer");
    expect(role.placeholder).toBe("Desenvolvedora");
  });

  it("escolher a foto envia e grava na hora só com a chave", async () => {
    wrap(<ProfileEditor row={profileRow} />);
    pickFile("Foto");
    await waitFor(() => expect(updateProfile).toHaveBeenCalled());
    const fd = updateProfile.mock.calls[0][0] as FormData;
    expect(fd.get("photoKey")).toBe(KEY);
    expect(fd.has("photo")).toBe(false);
  });

  it("envio que falha não grava e mostra erro no campo", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("rede")));
    wrap(<ProfileEditor row={profileRow} />);
    pickFile("Foto");
    expect(await screen.findByText("Falha ao enviar o arquivo")).toBeTruthy();
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it("remover a foto grava na hora", async () => {
    vi.stubEnv("NEXT_PUBLIC_FILES_URL", "https://pub.test");
    wrap(<ProfileEditor row={{ ...profileRow, photoPath: KEY }} />);
    fireEvent.click(screen.getByRole("button", { name: "Remover" }));
    await waitFor(() => expect(updateProfile).toHaveBeenCalled());
    expect((updateProfile.mock.calls[0][0] as FormData).get("remove_photo")).toBe("on");
  });
});

describe("ItemEditor existente", () => {
  it("digitar e esperar 800 ms grava sem clicar em nada", async () => {
    vi.useFakeTimers();
    wrap(<ItemEditor kind="project" row={project} base="/admin/projetos" />);
    type("Título", "Novo título");
    expect(saveItem).not.toHaveBeenCalled();
    await wait();
    expect(saveItem).toHaveBeenCalledTimes(1);
    expect((saveItem.mock.calls[0][1] as FormData).get("title")).toBe("Novo título");
    expect(refresh).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByText("Salvo ✓")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Desfazer" })).toBeTruthy();
  });

  it("etiqueta nova vai no FormData uma por linha", async () => {
    vi.useFakeTimers();
    wrap(<ItemEditor kind="project" row={project} base="/admin/projetos" />);
    const tags = screen.getByLabelText("Tecnologias");
    fireEvent.change(tags, { target: { value: "MySQL" } });
    fireEvent.keyDown(tags, { key: "Enter" });
    await wait();
    expect((saveItem.mock.calls[0][1] as FormData).get("stack")).toBe("PHP\nMySQL");
  });

  it("erro do servidor aparece junto ao campo e o status pede correção", async () => {
    saveItem.mockResolvedValue({ errors: { title: "Título: campo obrigatório" } });
    vi.useFakeTimers();
    wrap(<ItemEditor kind="project" row={project} base="/admin/projetos" />);
    type("Título", "x");
    await wait();
    expect(screen.getByText("Título: campo obrigatório")).toBeTruthy();
    expect(screen.getByText("Corrija os campos destacados.")).toBeTruthy();
  });

  it("Voltar grava a edição pendente antes de navegar", async () => {
    vi.useFakeTimers();
    wrap(<ItemEditor kind="project" row={project} base="/admin/projetos" />);
    type("Título", "Pendente");
    fireEvent.click(screen.getByRole("link", { name: "Voltar" }));
    await wait(0);
    expect(saveItem).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith("/admin/projetos");
  });

  it("Voltar com gravação recusada pergunta; recusar fica, aceitar sai sem salvar", async () => {
    saveItem.mockResolvedValue({ errors: { title: "Título: campo obrigatório" } });
    const confirmFn = vi.fn(() => false);
    vi.stubGlobal("confirm", confirmFn);
    vi.useFakeTimers();
    wrap(<ItemEditor kind="project" row={project} base="/admin/projetos" />);
    type("Título", "x");
    fireEvent.click(screen.getByRole("link", { name: "Voltar" }));
    await wait(0);
    expect(saveItem).toHaveBeenCalledTimes(1);
    expect(confirmFn).toHaveBeenCalledWith("Há alterações não salvas. Sair mesmo assim?");
    expect(push).not.toHaveBeenCalled();
    confirmFn.mockReturnValue(true);
    fireEvent.click(screen.getByRole("link", { name: "Voltar" }));
    await wait(0);
    expect(push).toHaveBeenCalledWith("/admin/projetos");
    vi.unstubAllGlobals();
  });

  it("Desfazer grava de novo a versão anterior", async () => {
    vi.useFakeTimers();
    wrap(<ItemEditor kind="project" row={project} base="/admin/projetos" />);
    type("Título", "Outro");
    await wait();
    fireEvent.click(screen.getByRole("button", { name: "Desfazer" }));
    await wait();
    expect(saveItem).toHaveBeenCalledTimes(2);
    expect((saveItem.mock.calls[1][1] as FormData).get("title")).toBe("Pedidos");
  });
});

describe("ItemEditor novo", () => {
  it("não grava sozinho; 'Criar' grava e volta para a lista", async () => {
    vi.useFakeTimers();
    wrap(<ItemEditor kind="project" row={null} base="/admin/projetos" />);
    type("Título", "Novo");
    await wait(2000);
    expect(saveItem).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Criar" }));
    await wait(0);
    expect(saveItem).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith("/admin/projetos");
    expect(refresh).toHaveBeenCalled();
  });

  it("tem 'Cancelar' e não tem 'Voltar'", () => {
    wrap(<ItemEditor kind="project" row={null} base="/admin/projetos" />);
    expect(screen.getByText("Cancelar")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Voltar" })).toBeNull();
  });

  it("guarda a imagem até o Criar", async () => {
    wrap(<ItemEditor kind="project" row={null} base="/admin/projetos" />);
    type("Título", "Novo");
    pickFile("Imagem (opcional)");
    await act(async () => {});
    expect(saveItem).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Criar" }));
    await waitFor(() => expect(saveItem).toHaveBeenCalled());
    expect((saveItem.mock.calls[0][1] as FormData).get("imageKey")).toBe(KEY);
  });
});

describe("não perder o que foi digitado", () => {
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

describe("imagem do item", () => {
  beforeEach(() => vi.stubEnv("NEXT_PUBLIC_FILES_URL", "https://pub.test"));
  afterEach(() => vi.unstubAllEnvs());
  const previewImgs = (c: HTMLElement) => c.querySelectorAll("aside img").length;

  it("escolher grava na hora só com a chave", async () => {
    wrap(<ItemEditor kind="project" row={project} base="/admin/projetos" />);
    pickFile("Imagem (opcional)");
    await waitFor(() => expect(saveItem).toHaveBeenCalled());
    const fd = saveItem.mock.calls[0][1] as FormData;
    expect(fd.get("imageKey")).toBe(KEY);
    expect(fd.has("image")).toBe(false);
  });

  it("Remover grava na hora com remove_image e tira a imagem da prévia", async () => {
    const { container } = wrap(<ItemEditor kind="project" row={withImage} base="/admin/projetos" />);
    expect(container.querySelector("aside img")?.getAttribute("src")).toContain(encodeURIComponent(`https://pub.test/${KEY}`));
    fireEvent.click(screen.getByRole("button", { name: "Remover" }));
    await waitFor(() => expect(saveItem).toHaveBeenCalled());
    expect((saveItem.mock.calls[0][1] as FormData).get("remove_image")).toBe("on");
    await waitFor(() => expect(previewImgs(container)).toBe(0));
  });

  it("depois de remover aparece Desfazer", async () => {
    wrap(<ItemEditor kind="project" row={withImage} base="/admin/projetos" />);
    fireEvent.click(screen.getByRole("button", { name: "Remover" }));
    expect(await screen.findByRole("button", { name: "Desfazer" })).toBeTruthy();
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
  const Probe = ({ out }: { out: { dirty?: boolean } }) => {
    out.dirty = useAdminStatus().dirty;
    return null;
  };

  it("dirty: limpo ao abrir, marcado ao editar, limpo depois de gravar", async () => {
    vi.useFakeTimers();
    const out: { dirty?: boolean } = {};
    wrap(<><Probe out={out} /><ItemEditor kind="project" row={project} base="/admin/projetos" /></>);
    expect(out.dirty).toBe(false);
    type("Título", "B");
    expect(out.dirty).toBe(true);
    await wait();
    expect(out.dirty).toBe(false);
  });

  it("ponto do EN não aparece com lista vazia em português", () => {
    wrap(<ItemEditor kind="project" row={{ ...project, stack: "[]", title: "", description: "" }} base="/admin/projetos" />);
    expect(screen.queryByText("tradução incompleta")).toBeNull();
    type("Título", "Pedidos");
    expect(screen.getByText("tradução incompleta").className).toContain("sr-only");
  });
});
