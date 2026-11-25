import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ActionError, Check, Field, Select } from "@/components/admin/controls";
import Dropzone from "@/components/admin/Dropzone";
import TagInput from "@/components/admin/TagInput";

const create = vi.fn(() => "blob:t");
const revoke = vi.fn();
beforeEach(() => {
  create.mockClear();
  revoke.mockClear();
  URL.createObjectURL = create;
  URL.revokeObjectURL = revoke;
});
afterEach(cleanup);

const fileOf = (bytes: number, name = "a.png", type = "image/png") =>
  new File([new Uint8Array(bytes)], name, { type });

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

describe("Dropzone", () => {
  const setup = (props = {}) => {
    const onFile = vi.fn();
    const onRemove = vi.fn();
    const utils = render(
      <Dropzone label="Foto" name="photo" accept="image/*" currentUrl={null} kind="image" onFile={onFile} onRemove={onRemove} {...props} />,
    );
    return { onFile, onRemove, input: screen.getByLabelText("Foto") as HTMLInputElement, ...utils };
  };

  it("arquivo acima do limite mostra o erro e não chama onFile", () => {
    const { onFile, input } = setup();
    fireEvent.change(input, { target: { files: [fileOf(4 * 1024 * 1024)] } });
    expect(screen.getByRole("alert")).toHaveTextContent("Arquivo maior que o limite");
    expect(onFile).not.toHaveBeenCalledWith(expect.any(File));
  });

  it("arquivo válido chama onFile e mostra miniatura", () => {
    const { onFile, input } = setup();
    const f = fileOf(10 * 1024);
    fireEvent.change(input, { target: { files: [f] } });
    expect(onFile).toHaveBeenCalledWith(f);
    expect(screen.getByRole("img")).toHaveAttribute("src", "blob:t");
  });

  it("revoga a URL ao desmontar", () => {
    const { input, unmount } = setup();
    fireEvent.change(input, { target: { files: [fileOf(10)] } });
    unmount();
    expect(revoke).toHaveBeenCalledWith("blob:t");
  });

  it("soltar um arquivo na área também envia", () => {
    const { onFile, container } = setup();
    const f = fileOf(10);
    fireEvent.drop(container.querySelector("input")!.parentElement as Element, { dataTransfer: { files: [f] } });
    expect(onFile).toHaveBeenCalledWith(f);
  });

  it("soltar algo sem arquivo é ignorado", () => {
    const { onFile, container } = setup();
    fireEvent.drop(container.querySelector("input")!.parentElement as Element, { dataTransfer: { files: [] } });
    expect(onFile).not.toHaveBeenCalled();
  });

  it("arquivo grande avisa o pai com onFile(null)", () => {
    const { onFile, input } = setup();
    fireEvent.change(input, { target: { files: [fileOf(4 * 1024 * 1024)] } });
    expect(onFile).toHaveBeenCalledTimes(1);
    expect(onFile).toHaveBeenCalledWith(null);
  });

  it("escolher novo arquivo depois de marcar remover chama onRemove(false)", () => {
    const { onRemove, input } = setup({ currentUrl: "/uploads/x.png" });
    fireEvent.click(screen.getByLabelText("remover"));
    fireEvent.change(input, { target: { files: [fileOf(10)] } });
    expect(onRemove).toHaveBeenLastCalledWith(false);
  });

  it("PDF mostra o nome do arquivo", () => {
    const { input } = setup({ kind: "pdf", accept: "application/pdf" });
    fireEvent.change(input, { target: { files: [fileOf(10, "cv.pdf", "application/pdf")] } });
    expect(screen.getByText("cv.pdf")).toBeInTheDocument();
  });

  it("remover um arquivo existente chama onRemove(true)", () => {
    const { onRemove } = setup({ currentUrl: "/uploads/x.png" });
    fireEvent.click(screen.getByLabelText("remover"));
    expect(onRemove).toHaveBeenCalledWith(true);
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
