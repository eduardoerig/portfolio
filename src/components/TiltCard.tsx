"use client";

import { useEffect, useRef, type PointerEvent, type ReactNode } from "react";

// Só inclina com mouse/trackpad e quando a pessoa não pediu menos movimento.
const CAN_TILT = "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";
const MAX_DEG = 6;

// A inclinação só liga depois que a entrada do cartão terminou: o elemento que faz a entrada
// (.reveal ou .slide-in) já está opaco e sem transição rodando.
function entranceDone(el: HTMLElement) {
  const wrapper = el.closest<HTMLElement>(".reveal, .slide-in");
  if (!wrapper || !document.documentElement.dataset.reveal) return true;
  return getComputedStyle(wrapper).opacity === "1" && wrapper.getAnimations().length === 0;
}

export default function TiltCard({ className = "", children }: { className?: string; children: ReactNode }) {
  const frame = useRef(0);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (!window.matchMedia?.(CAN_TILT).matches || !entranceDone(el)) return;
    const { clientX, clientY } = e;
    // Um cálculo por quadro, no máximo: ignora movimentos enquanto um quadro está pendente.
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const box = el.getBoundingClientRect();
      const x = (clientX - box.left) / box.width; // 0 = esquerda, 1 = direita
      const y = (clientY - box.top) / box.height; // 0 = topo, 1 = base
      el.style.setProperty("--mx", `${x * 100}%`);
      el.style.setProperty("--my", `${y * 100}%`);
      el.style.setProperty("--rx", `${(0.5 - y) * 2 * MAX_DEG}deg`);
      el.style.setProperty("--ry", `${(x - 0.5) * 2 * MAX_DEG}deg`);
      el.classList.add("is-tilting");
    });
  }

  function onPointerLeave(e: PointerEvent<HTMLDivElement>) {
    cancelAnimationFrame(frame.current);
    frame.current = 0;
    const el = e.currentTarget;
    // Volta a ficar reto; a transição de 0.55s do CSS faz o movimento suave.
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.classList.remove("is-tilting");
  }

  return (
    <div className={`tilt ${className}`} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
      {children}
    </div>
  );
}
