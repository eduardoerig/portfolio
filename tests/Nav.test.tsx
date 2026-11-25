import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Nav from "@/components/Nav";
import { getDictionary } from "@/i18n/dictionary";

// jsdom não tem IntersectionObserver; um falso que não faz nada basta aqui.
vi.stubGlobal(
  "IntersectionObserver",
  class {
    observe() {}
    disconnect() {}
  },
);

describe("Nav", () => {
  it("mostra os 5 links das seções com os hrefs certos", () => {
    render(<Nav dict={getDictionary("pt")} locale="pt" />);
    const hrefs = ["#projetos", "#experiencia", "#competencias", "#formacao", "#contato"];
    for (const href of hrefs) {
      expect(screen.getAllByRole("link").some((a) => a.getAttribute("href") === href)).toBe(true);
    }
    // 5 seções + a marca "EE" que volta ao topo
    expect(screen.getAllByRole("link")).toHaveLength(6);
  });
});
