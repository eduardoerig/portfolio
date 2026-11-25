"use client";

import { useEffect } from "react";

// Faz os elementos .reveal e .reveal-group aparecerem (classe .is-visible) quando entram na tela.
// O CSS só esconde quando o <html> tem data-reveal, então sem JS tudo continua visível.
export default function RevealOnScroll() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -5% 0px" },
    );
    document.querySelectorAll(".reveal, .reveal-group").forEach((el) => observer.observe(el));
    document.documentElement.dataset.reveal = "on";
    return () => observer.disconnect();
  }, []);

  return null;
}
