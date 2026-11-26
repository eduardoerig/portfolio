import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FormState } from "@/app/(admin)/admin/actions";
import { AdminStatusProvider, useAdminStatus } from "@/components/admin/AdminStatus";
import { useEditor } from "@/components/admin/useEditor";
import { uploadFile } from "@/lib/uploadClient";

vi.mock("@/lib/uploadClient", () => ({ uploadFile: vi.fn() }));
const upload = vi.mocked(uploadFile);

const OLD = "0b1e7f5c-1d2a-4c3b-9e8f-7a6b5c4d3e2f.png";
const NEW = "1c2f8a6d-2e3b-4d4c-8f9a-8b7c6d5e4f3a.png";
const row = {
  id: 3, title: "A", titleEn: "", description: "d", descriptionEn: "", stack: "[]", stackEn: null,
  url: null, metric: null, metricEn: null, visible: true, imagePath: OLD,
};
const file = () => new File(["x"], "a.png", { type: "image/png" });

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  upload.mockResolvedValue({ ok: true, key: NEW });
  URL.createObjectURL = vi.fn(() => "blob:t");
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function setup({ autosave = true, r = row as Record<string, unknown> | null } = {}) {
  const save = vi.fn<(fd: FormData) => Promise<FormState>>().mockResolvedValue({ ok: true });
  const onSaved = vi.fn();
  const hook = renderHook(
    () => ({ e: useEditor({ kind: "project", row: r, save, onSaved, autosave }), s: useAdminStatus() }),
    { wrapper: ({ children }) => <AdminStatusProvider>{children}</AdminStatusProvider> },
  );
  const sent = (i: number) => save.mock.calls[i][0];
  return { ...hook, save, onSaved, sent };
}
const wait = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
const deferred = () => {
  let resolve!: (v: FormState) => void;
  const p = new Promise<FormState>((r) => (resolve = r));
  return { p, resolve };
};

describe("useEditor com autosave", () => {
  it("várias edições rápidas gravam uma vez, 800 ms depois da última", async () => {
    const { result, save, sent, onSaved } = setup();
    act(() => result.current.e.set("title", "B"));
    await wait(300);
    act(() => result.current.e.set("title", "BC"));
    expect(result.current.e.status).toBe("waiting");
    expect(result.current.s.dirty).toBe(true);
    await wait(799);
    expect(save).not.toHaveBeenCalled();
    await wait(1);
    expect(save).toHaveBeenCalledTimes(1);
    expect(sent(0).get("title")).toBe("BC");
    expect(result.current.e.status).toBe("saved");
    expect(result.current.s.dirty).toBe(false);
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it("edição durante o envio grava de novo quando ele termina", async () => {
    const { result, save, sent } = setup();
    const first = deferred();
    save.mockReturnValueOnce(first.p);
    act(() => result.current.e.set("title", "B"));
    await wait(800);
    expect(result.current.e.status).toBe("saving");
    act(() => result.current.e.set("title", "BC"));
    await wait(800); // o debounce vence com o primeiro ainda no ar: não abre um segundo envio paralelo
    expect(save).toHaveBeenCalledTimes(1);
    await act(async () => first.resolve({ ok: true }));
    await wait(0);
    expect(save).toHaveBeenCalledTimes(2);
    expect(sent(1).get("title")).toBe("BC");
    expect(result.current.e.status).toBe("saved");
  });

  it("erro de validação: mostra, não grava de novo até a próxima edição", async () => {
    const { result, save } = setup();
    save.mockResolvedValueOnce({ errors: { title: "Título: campo obrigatório" } });
    act(() => result.current.e.set("title", ""));
    await wait(800);
    expect(result.current.e.status).toBe("invalid");
    expect(result.current.e.errors.title).toMatch(/obrigatório/);
    expect(result.current.s.dirty).toBe(true);
    await wait(5000);
    expect(save).toHaveBeenCalledTimes(1);
    act(() => result.current.e.set("title", "C"));
    await wait(800);
    expect(save).toHaveBeenCalledTimes(2);
    expect(result.current.e.status).toBe("saved");
  });

  it("falha de rede: status error, e o submit tenta de novo", async () => {
    const { result, save } = setup();
    save.mockRejectedValueOnce(new Error("rede"));
    act(() => result.current.e.set("title", "B"));
    await wait(800);
    expect(result.current.e.status).toBe("error");
    expect(result.current.e.failed).toBe(true);
    await act(() => result.current.e.submit());
    expect(save).toHaveBeenCalledTimes(2);
    expect(result.current.e.status).toBe("saved");
    expect(result.current.e.failed).toBe(false);
  });

  it("escolher imagem envia e grava na hora com a chave", async () => {
    const { result, save, sent } = setup();
    act(() => result.current.e.pickImage("image", file()));
    expect(result.current.e.imageUrl("image")).toBe("blob:t");
    await wait(0);
    expect(upload).toHaveBeenCalledWith(expect.any(File), "image");
    expect(save).toHaveBeenCalledTimes(1);
    expect(sent(0).get("imageKey")).toBe(NEW);
    expect(result.current.e.draft.imagePath).toBe(NEW);
    expect(result.current.e.status).toBe("saved");
  });

  it("remover imagem grava na hora com remove_", async () => {
    const { result, save, sent } = setup();
    act(() => result.current.e.removeImage("image"));
    await wait(0);
    expect(save).toHaveBeenCalledTimes(1);
    expect(sent(0).get("remove_image")).toBe("on");
    expect(result.current.e.draft.imagePath).toBe("");
    expect(result.current.e.imageUrl("image")).toBeNull();
  });

  it("desfazer volta o texto e reenvia a chave antiga da imagem", async () => {
    const { result, save, sent } = setup();
    expect(result.current.e.undo).toBeNull();
    act(() => result.current.e.set("title", "B"));
    act(() => result.current.e.pickImage("image", file())); // grava já, levando o título junto
    await wait(0);
    expect(save).toHaveBeenCalledTimes(1);
    expect(result.current.e.undo).not.toBeNull();
    act(() => result.current.e.undo!());
    await wait(0);
    expect(save).toHaveBeenCalledTimes(2);
    expect(sent(1).get("title")).toBe("A");
    expect(sent(1).get("imageKey")).toBe(OLD);
    expect(result.current.e.draft.title).toBe("A");
    expect(result.current.e.draft.imagePath).toBe(OLD);
    expect(result.current.e.imageUrl("image")).toContain(OLD);
    // desfazer de novo refaz: volta a imagem nova
    act(() => result.current.e.undo!());
    await wait(0);
    expect(sent(2).get("title")).toBe("B");
    expect(sent(2).get("imageKey")).toBe(NEW);
  });

  it("desfazer uma remoção reanexa; desfazer uma imagem posta onde não havia remove", async () => {
    const { result, sent } = setup({ r: { ...row, imagePath: null } });
    act(() => result.current.e.pickImage("image", file()));
    await wait(0);
    act(() => result.current.e.undo!());
    await wait(0);
    expect(sent(1).get("remove_image")).toBe("on");
    expect(sent(1).get("imageKey")).toBeNull();
  });

  it("sair com debounce pendente grava", async () => {
    const { result, save, sent, unmount } = setup();
    act(() => result.current.e.set("title", "B"));
    unmount();
    await wait(0);
    expect(save).toHaveBeenCalledTimes(1);
    expect(sent(0).get("title")).toBe("B");
  });

  it("touch sozinho só marca não salvo, sem gravar", async () => {
    const { result, save } = setup();
    act(() => result.current.e.touch());
    expect(result.current.s.dirty).toBe(true);
    await wait(5000);
    expect(save).not.toHaveBeenCalled();
  });

  it("flush grava o pendente na hora e Ctrl+S também", async () => {
    const { result, save } = setup();
    act(() => result.current.e.set("title", "B"));
    await act(() => result.current.e.flush());
    expect(save).toHaveBeenCalledTimes(1);
    await act(() => result.current.e.flush()); // nada pendente: não grava
    expect(save).toHaveBeenCalledTimes(1);
    act(() => result.current.e.set("title", "C"));
    act(() => void window.dispatchEvent(new KeyboardEvent("keydown", { key: "s", ctrlKey: true })));
    await wait(0);
    expect(save).toHaveBeenCalledTimes(2);
  });
});

describe("useEditor sem autosave (item novo)", () => {
  it("nada grava até o submit; imagem fica guardada para ele; depois trava", async () => {
    const { result, save, sent } = setup({ autosave: false, r: null });
    act(() => result.current.e.set("title", "Novo"));
    act(() => result.current.e.pickImage("image", file()));
    await wait(5000);
    expect(save).not.toHaveBeenCalled();
    expect(upload).not.toHaveBeenCalled();
    expect(result.current.e.imageUrl("image")).toBe("blob:t");
    await act(() => result.current.e.submit());
    expect(save).toHaveBeenCalledTimes(1);
    expect(sent(0).get("title")).toBe("Novo");
    expect(sent(0).get("imageKey")).toBe(NEW);
    await act(() => result.current.e.submit());
    expect(save).toHaveBeenCalledTimes(1);
  });
});

describe("useEditor: onda 1 (erros, sessão, conexão, rascunho)", () => {
  afterEach(() => {
    sessionStorage.clear();
    document.body.innerHTML = "";
  });

  it("campo vazio com foco não grava; grava ao sair dele", async () => {
    const input = document.createElement("input");
    input.name = "title";
    document.body.append(input);
    input.focus();
    const { result, save } = setup();
    act(() => result.current.e.set("title", ""));
    await wait(2000);
    expect(save).not.toHaveBeenCalled();
    act(() => input.blur());
    await wait(800);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("editar um campo tira o erro dele", async () => {
    const { result, save } = setup();
    save.mockResolvedValueOnce({ errors: { title: "Campo obrigatório", description: "x" } });
    act(() => result.current.e.set("title", ""));
    await wait(800);
    expect(result.current.e.errors.title).toBe("Campo obrigatório");
    act(() => result.current.e.set("title", "B"));
    expect(result.current.e.errors.title).toBeUndefined();
    expect(result.current.e.errors.description).toBe("x");
  });

  it("sessão expirada: status 'auth' e grava de novo ao voltar para a aba", async () => {
    const { result, save } = setup();
    save.mockResolvedValueOnce({ unauthorized: true });
    act(() => result.current.e.set("title", "B"));
    await wait(800);
    expect(result.current.e.status).toBe("auth");
    expect(result.current.s.dirty).toBe(true);
    act(() => void window.dispatchEvent(new Event("focus")));
    await wait(0);
    expect(save).toHaveBeenCalledTimes(2);
    expect(result.current.e.status).toBe("saved");
  });

  it("sem conexão: tenta de novo quando a internet volta", async () => {
    const { result, save } = setup();
    save.mockRejectedValueOnce(new Error("offline"));
    act(() => result.current.e.set("title", "B"));
    await wait(800);
    expect(result.current.e.status).toBe("error");
    act(() => void window.dispatchEvent(new Event("online")));
    await wait(0);
    expect(save).toHaveBeenCalledTimes(2);
    expect(result.current.e.status).toBe("saved");
  });

  it("sem conexão: tenta de novo sozinho depois de alguns segundos", async () => {
    const { result, save } = setup();
    save.mockRejectedValueOnce(new Error("offline"));
    act(() => result.current.e.set("title", "B"));
    await wait(800);
    expect(save).toHaveBeenCalledTimes(1);
    await wait(10_000);
    expect(save).toHaveBeenCalledTimes(2);
    expect(result.current.e.status).toBe("saved");
  });

  it("o que não foi gravado fica no navegador e volta ao reabrir o item", async () => {
    const first = setup();
    first.save.mockRejectedValue(new Error("offline"));
    act(() => first.result.current.e.set("title", "Não perdi"));
    await wait(800);
    first.unmount();
    const again = setup();
    expect(again.result.current.e.draft.title).toBe("Não perdi");
    await wait(800);
    expect(again.save).toHaveBeenCalledTimes(1);
    expect(again.sent(0).get("title")).toBe("Não perdi");
    expect(sessionStorage.length).toBe(0); // gravou: some do navegador
  });

  it("registra a saída que grava antes (usada pelos links do painel)", async () => {
    const { result, save } = setup();
    act(() => result.current.e.set("title", "B"));
    let ok: boolean | undefined;
    await act(async () => void (ok = await result.current.s.leave!()));
    expect(save).toHaveBeenCalledTimes(1);
    expect(ok).toBe(true);
  });
});
