import { describe, expect, it } from "vitest";
import { moveItem } from "@/lib/reorder";

const [a, b, c] = [{ id: 1 }, { id: 2 }, { id: 3 }];

describe("moveItem", () => {
  it("sobe um item", () => expect(moveItem([a, b, c], 2, "up")).toEqual([b, a, c]));
  it("desce um item", () => expect(moveItem([a, b, c], 2, "down")).toEqual([a, c, b]));
  it("o primeiro não sobe", () => expect(moveItem([a, b, c], 1, "up")).toEqual([a, b, c]));
  it("o último não desce", () => expect(moveItem([a, b, c], 3, "down")).toEqual([a, b, c]));
  it("id desconhecido não muda nada", () => expect(moveItem([a, b, c], 99, "up")).toEqual([a, b, c]));
  it("não altera a lista original", () => {
    const original = [a, b, c];
    moveItem(original, 2, "up");
    expect(original).toEqual([a, b, c]);
  });
});
