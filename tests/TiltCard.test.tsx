import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import TiltCard from "@/components/TiltCard";

// Faz o requestAnimationFrame rodar na hora, para o teste não depender de quadros.
function stubFrames() {
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    cb(0);
    return 1;
  });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("TiltCard", () => {
  it("renderiza o conteúdo", () => {
    render(<TiltCard>conteúdo do cartão</TiltCard>);
    expect(screen.getByText("conteúdo do cartão")).toBeInTheDocument();
  });

  it("com menos movimento, não define --rx/--ry ao mover o ponteiro", () => {
    stubFrames();
    // Simula o sistema pedindo menos movimento: a media query de inclinação não bate.
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    render(<TiltCard>cartão</TiltCard>);
    const card = screen.getByText("cartão");
    fireEvent.pointerMove(card, { clientX: 10, clientY: 10 });
    expect(card.style.getPropertyValue("--rx")).toBe("");
    expect(card.style.getPropertyValue("--ry")).toBe("");
  });

  // Controle: prova que o teste acima não passa só porque o evento não chega.
  it("com mouse e sem pedido de menos movimento, define --rx/--ry", () => {
    stubFrames();
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    render(<TiltCard>cartão</TiltCard>);
    const card = screen.getByText("cartão");
    fireEvent.pointerMove(card, { clientX: 10, clientY: 10 });
    expect(card.style.getPropertyValue("--rx")).not.toBe("");
    expect(card.style.getPropertyValue("--ry")).not.toBe("");
  });
});
