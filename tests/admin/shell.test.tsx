import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminHeader from "@/components/admin/AdminHeader";
import { AdminStatusProvider, useAdminStatus } from "@/components/admin/AdminStatus";
import GuardedLink from "@/components/admin/GuardedLink";
import Sidebar from "@/components/admin/Sidebar";
import ThemeToggle from "@/components/ThemeToggle";
import Toast from "@/components/admin/Toast";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/projetos",
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/app/(admin)/admin/login/actions", () => ({ logout: vi.fn() }));

afterEach(cleanup);

const counts = { projetos: 4, experiencias: 2, competencias: 9, formacao: 1 };

function Setter({ onCtx }: { onCtx: (c: ReturnType<typeof useAdminStatus>) => void }) {
  onCtx(useAdminStatus());
  return null;
}

describe("painel: estrutura", () => {
  it("Sidebar mostra a contagem e marca o item ativo", () => {
    render(<AdminStatusProvider><Sidebar counts={counts} /></AdminStatusProvider>);
    const link = screen.getByRole("link", { name: /Projetos/ });
    expect(link.textContent).toContain("4");
    expect(link.getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: /Perfil/ }).getAttribute("aria-current")).toBeNull();
  });

  it("AdminHeader mostra iniciais sem foto e abre o menu com Sair", () => {
    render(<AdminStatusProvider><AdminHeader name="Eduardo Erig" photoPath={null} /></AdminStatusProvider>);
    const avatar = screen.getByRole("button", { name: /Menu da conta/ });
    expect(avatar.textContent).toBe("EE");
    expect(screen.queryByRole("button", { name: "Sair" })).toBeNull();
    fireEvent.click(avatar);
    expect(screen.getByRole("button", { name: "Sair" })).toBeTruthy();
    expect(screen.getByText(/● salvo/)).toBeTruthy();
  });

  it("Sair pede confirmação com alterações não salvas", () => {
    let ctx!: ReturnType<typeof useAdminStatus>;
    vi.stubGlobal("confirm", vi.fn(() => false));
    render(
      <AdminStatusProvider>
        <Setter onCtx={(c) => (ctx = c)} />
        <AdminHeader name="Eduardo Erig" photoPath={null} />
      </AdminStatusProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Menu da conta/ }));
    act(() => ctx.setDirty(true));
    const ev = fireEvent.submit(screen.getByRole("button", { name: "Sair" }).closest("form")!);
    expect(ev).toBe(false); // preventDefault chamado
    vi.unstubAllGlobals();
  });

  it("os dois botões de tema ficam em sincronia", async () => {
    document.documentElement.dataset.theme = "dark";
    const dict = { toLight: "claro", toDark: "escuro" } as never;
    render(<><ThemeToggle dict={dict} /><ThemeToggle dict={dict} /></>);
    const [a, b] = screen.getAllByRole("button");
    fireEvent.click(a);
    await waitFor(() => expect(screen.getAllByRole("button").map((x) => x.textContent)).toEqual(["☾", "☾"]));
    expect(document.documentElement.dataset.theme).toBe("light");
    fireEvent.click(b);
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("topo avisa alterações não salvas", () => {
    let ctx!: ReturnType<typeof useAdminStatus>;
    render(
      <AdminStatusProvider>
        <Setter onCtx={(c) => (ctx = c)} />
        <AdminHeader name="Eduardo Erig" photoPath={null} />
      </AdminStatusProvider>,
    );
    act(() => ctx.setDirty(true));
    expect(screen.getByText(/alterações não salvas/)).toBeTruthy();
  });

  it("GuardedLink cancela a navegação se o usuário recusar", () => {
    let ctx!: ReturnType<typeof useAdminStatus>;
    const confirmFn = vi.fn(() => false);
    vi.stubGlobal("confirm", confirmFn);
    render(
      <AdminStatusProvider>
        <Setter onCtx={(c) => (ctx = c)} />
        <GuardedLink href="/admin">ir</GuardedLink>
      </AdminStatusProvider>,
    );
    const link = screen.getByRole("link", { name: "ir" });
    expect(fireEvent.click(link)).toBe(true); // limpo: segue
    act(() => ctx.setDirty(true));
    expect(fireEvent.click(link)).toBe(false); // preventDefault
    expect(confirmFn).toHaveBeenCalledWith("Há alterações não salvas. Sair mesmo assim?");
    vi.unstubAllGlobals();
  });

  it("notify mostra o aviso com role=status e some depois", () => {
    vi.useFakeTimers();
    let ctx!: ReturnType<typeof useAdminStatus>;
    render(
      <AdminStatusProvider>
        <Setter onCtx={(c) => (ctx = c)} />
        <Toast />
      </AdminStatusProvider>,
    );
    act(() => ctx.notify("Salvo ✓"));
    expect(screen.getByRole("status").textContent).toBe("Salvo ✓");
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByRole("status").textContent).toBe("");
    vi.useRealTimers();
  });

  it("useAdminStatus fora do provider dá erro claro", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Setter onCtx={() => {}} />)).toThrow(/AdminStatusProvider/);
    spy.mockRestore();
  });

  it("☰ fica no topo e Esc fecha a gaveta", () => {
    render(
      <AdminStatusProvider>
        <AdminHeader name="Eduardo Erig" photoPath={null} />
        <Sidebar counts={counts} />
      </AdminStatusProvider>,
    );
    const burger = screen.getByRole("button", { name: "Abrir menu" });
    expect(burger.closest("header")).toBeTruthy();
    expect(burger.getAttribute("aria-controls")).toBe("admin-sidebar");
    fireEvent.click(burger);
    expect(burger.getAttribute("aria-expanded")).toBe("true");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(burger.getAttribute("aria-expanded")).toBe("false");
  });

  it("Esc fecha o menu da conta", () => {
    render(<AdminStatusProvider><AdminHeader name="Eduardo Erig" photoPath={null} /></AdminStatusProvider>);
    const avatar = screen.getByRole("button", { name: /Menu da conta/ });
    fireEvent.click(avatar);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("button", { name: "Sair" })).toBeNull();
  });

  it("região de status existe mesmo sem aviso", () => {
    render(<AdminStatusProvider><Toast /></AdminStatusProvider>);
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("clicar num link da lateral fecha a gaveta", () => {
    render(
      <AdminStatusProvider>
        <AdminHeader name="Eduardo Erig" photoPath={null} />
        <Sidebar counts={counts} />
      </AdminStatusProvider>,
    );
    const burger = screen.getByRole("button", { name: "Abrir menu" });
    fireEvent.click(burger);
    expect(burger.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(screen.getByRole("link", { name: /Experiências/ }));
    expect(burger.getAttribute("aria-expanded")).toBe("false");
  });
});
