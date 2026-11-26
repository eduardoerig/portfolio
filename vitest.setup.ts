import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";

// O editor guarda o rascunho não gravado no navegador: um teste não pode herdar o do anterior.
afterEach(() => {
  if (typeof sessionStorage !== "undefined") sessionStorage.clear();
});
