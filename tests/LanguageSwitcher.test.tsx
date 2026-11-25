import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import LanguageSwitcher from "@/components/LanguageSwitcher";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("LanguageSwitcher", () => {
  it("em pt, mostra 2 bandeiras e marca a do Brasil", () => {
    render(<LanguageSwitcher locale="pt" />);
    expect(screen.getAllByRole("button")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Português" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "false");
  });

  it("clicar na outra bandeira mostra o loading no idioma de destino", () => {
    // Relógio falso: a navegação (que o jsdom não suporta) nunca chega a rodar.
    vi.useFakeTimers();
    render(<LanguageSwitcher locale="pt" />);
    expect(screen.queryByRole("status")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "English" }));
    expect(screen.getByRole("status")).toHaveTextContent("Loading…");
  });

  it("clicar na bandeira atual não faz nada", () => {
    render(<LanguageSwitcher locale="pt" />);
    fireEvent.click(screen.getByRole("button", { name: "Português" }));
    expect(screen.queryByRole("status")).toBeNull();
  });
});
