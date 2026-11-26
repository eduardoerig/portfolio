import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ImageField from "@/components/admin/ImageField";

afterEach(cleanup);

const fileOf = (bytes: number, name = "a.png", type = "image/png") =>
  new File([new Uint8Array(bytes)], name, { type });

function setup(props: Partial<Parameters<typeof ImageField>[0]> = {}) {
  const onPick = vi.fn();
  const onRemove = vi.fn();
  const view = render(<ImageField label="Foto" url={null} busy={false} onPick={onPick} onRemove={onRemove} {...props} />);
  const input = view.container.querySelector<HTMLInputElement>("input[type=file]")!;
  return { onPick, onRemove, input, view };
}

describe("ImageField", () => {
  it("com url mostra miniatura e os botões; Remover chama onRemove", () => {
    const { onRemove } = setup({ url: "/x.png" });
    expect(screen.getByAltText("Miniatura")).toHaveAttribute("src", "/x.png");
    expect(screen.getByRole("button", { name: "Trocar" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Remover" }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("sem url mostra a área vazia", () => {
    setup();
    expect(screen.getByText("Arraste uma imagem ou clique para escolher")).toBeInTheDocument();
    expect(screen.queryByAltText("Miniatura")).toBeNull();
  });

  it("escolher arquivo chama onPick", async () => {
    const { onPick, input } = setup();
    const f = fileOf(10);
    fireEvent.change(input, { target: { files: [f] } });
    await waitFor(() => expect(onPick).toHaveBeenCalledWith(f));
  });

  it("soltar arquivo chama onPick", async () => {
    const { onPick, view } = setup({ url: "/x.png" });
    const f = fileOf(10);
    fireEvent.drop(view.container.firstElementChild!, { dataTransfer: { files: [f] } });
    await waitFor(() => expect(onPick).toHaveBeenCalledWith(f));
  });

  // Sem decodificador de imagem (jsdom): a redução não acontece e o limite avisa.
  it("arquivo acima de 3 MB que não dá para reduzir mostra o erro e não chama onPick", async () => {
    const { onPick, input } = setup();
    fireEvent.change(input, { target: { files: [fileOf(3 * 1024 * 1024 + 1)] } });
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(onPick).not.toHaveBeenCalled();
  });

  it("busy desabilita os botões e avisa", () => {
    setup({ url: "/x.png", busy: true });
    expect(screen.getByRole("button", { name: "Trocar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Remover" })).toBeDisabled();
    expect(screen.getByText("Enviando…")).toBeInTheDocument();
  });

  it("mostra a dica e o erro vindo do pai", () => {
    setup({ hint: "JPG ou PNG", error: "Falhou" });
    expect(screen.getByText("JPG ou PNG")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Falhou");
  });
});
