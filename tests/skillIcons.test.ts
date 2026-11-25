import { siHtml5 } from "simple-icons";
import { describe, expect, it } from "vitest";
import { getSkillIcon } from "@/lib/skillIcons";

describe("getSkillIcon", () => {
  it("HTML usa o logo do HTML5 na cor da marca (a do próprio pacote)", () => {
    const icon = getSkillIcon("HTML");
    expect(icon).not.toBeNull();
    expect(icon?.path).toBe(siHtml5.path);
    expect(icon?.color).toBe(`#${siHtml5.hex}`);
  });

  it("competência sem marca devolve null", () => {
    expect(getSkillIcon("Help desk")).toBeNull();
  });

  it("marca quase preta (GitHub) usa currentColor para aparecer no tema escuro", () => {
    expect(getSkillIcon("GitHub")?.color).toBe("currentColor");
  });
});
