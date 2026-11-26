import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ActionError, Check, Field, Select } from "@/components/admin/controls";
import TagInput from "@/components/admin/TagInput";

afterEach(cleanup);

describe("TagInput", () => {
  const setup = (value: string[] = []) => {
    const onChange = vi.fn();
    render(<TagInput label="Stack" value={value} onChange={onChange} />);
    return { onChange, input: screen.getByLabelText("Stack") };
  };

  it("Enter adiciona o texto aparado", () => {
    const { onChange, input } = setup();
    fireEvent.change(input, { target: { value: " PHP " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith(["PHP"]);
  });

  it("sair do campo (blur) confirma o texto pendente", () => {
    const { onChange, input } = setup(["PHP"]);
    fireEvent.change(input, { target: { value: " Go " } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(["PHP", "Go"]);
  });

  it("valores repetidos não geram aviso de chave", () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    setup(["PHP", "PHP"]);
    expect(err).not.toHaveBeenCalled();
    err.mockRestore();
  });

  it("Enter vazio ou repetido não chama onChange", () => {
    const { onChange, input } = setup(["PHP"]);
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.change(input, { target: { value: "PHP" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("× remove e Backspace vazio remove a última", () => {
    const { onChange, input } = setup(["PHP", "Go"]);
    fireEvent.click(screen.getByRole("button", { name: "Remover PHP" }));
    expect(onChange).toHaveBeenLastCalledWith(["Go"]);
    fireEvent.keyDown(input, { key: "Backspace" });
    expect(onChange).toHaveBeenLastCalledWith(["PHP"]);
  });

  it("o anel de foco aparece no contêiner quando o input recebe foco", () => {
    const { input } = setup();
    expect(input.parentElement!.className).toContain("focus-within:outline-[var(--accent)]");
  });

  it("long: cada item é uma linha editável", () => {
    const onChange = vi.fn();
    render(<TagInput label="Realizações" long value={["a", "b"]} onChange={onChange} />);
    fireEvent.change(screen.getByDisplayValue("b"), { target: { value: "bb" } });
    expect(onChange).toHaveBeenCalledWith(["a", "bb"]);
  });
});

describe("ActionError", () => {
  it("login abre em nova aba para não perder o rascunho", () => {
    render(<ActionError />);
    const a = screen.getByRole("link");
    expect(a.getAttribute("target")).toBe("_blank");
    expect(a.getAttribute("rel")).toBe("noopener noreferrer");
  });
});

describe("controls", () => {
  it("Field exibe o placeholder e repassa o valor", () => {
    const onChange = vi.fn();
    render(<Field label="Título" name="title" value="" onChange={onChange} placeholder="Texto PT" />);
    const el = screen.getByPlaceholderText("Texto PT");
    fireEvent.change(el, { target: { value: "x" } });
    expect(onChange).toHaveBeenCalledWith("x");
  });

  it("Select e Check são controlados", () => {
    const sel = vi.fn();
    const chk = vi.fn();
    render(
      <>
        <Select label="Tipo" name="t" value="a" onChange={sel} options={[["a", "A"], ["b", "B"]]} />
        <Check label="Ativo" name="on" checked={false} onChange={chk} />
      </>,
    );
    fireEvent.change(screen.getByLabelText("Tipo"), { target: { value: "b" } });
    fireEvent.click(screen.getByLabelText("Ativo"));
    expect(sel).toHaveBeenCalledWith("b");
    expect(chk).toHaveBeenCalledWith(true);
  });
});
