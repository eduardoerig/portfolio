import { afterEach, describe, expect, it, vi } from "vitest";
import { THEME_SCRIPT } from "@/lib/theme";

afterEach(() => {
  vi.unstubAllGlobals();
  delete document.documentElement.dataset.theme;
});

describe("THEME_SCRIPT", () => {
  it("sem tema salvo e com o sistema no escuro, define data-theme=dark", () => {
    localStorage.clear();
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: query === "(prefers-color-scheme: dark)" }));
    new Function(THEME_SCRIPT)();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  // Garante que o teste acima não passou só pelo catch (que também cai em "dark").
  it("sem tema salvo e com o sistema no claro, define data-theme=light", () => {
    localStorage.clear();
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    new Function(THEME_SCRIPT)();
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});
