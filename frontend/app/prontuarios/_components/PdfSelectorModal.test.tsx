import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PdfSelectorModal, { type SecaoPdf } from "./PdfSelectorModal";

const secoes: SecaoPdf[] = [
  { key: "identificacao", label: "Identificação", fields: [{ key: "nome", label: "Nome" }, { key: "idade", label: "Idade" }] },
  { key: "queixa", label: "Queixa", fields: [{ key: "queixa_principal", label: "Queixa principal" }] },
];

const abrir = () => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(<PdfSelectorModal sections={secoes} onConfirm={onConfirm} onCancel={onCancel} />);
  return { onConfirm, onCancel, dialogo: screen.getByRole("dialog", { name: "Selecionar conteúdo do PDF" }) };
};

describe("PdfSelectorModal", () => {
  it("abre com todas as seções e campos marcados", async () => {
    const { onConfirm } = abrir();
    await userEvent.click(screen.getByRole("button", { name: "Gerar PDF (2 seções)" }));

    const [selecionadas, campos] = onConfirm.mock.calls[0] as [Set<string>, Record<string, Set<string>>];
    expect([...selecionadas]).toEqual(["identificacao", "queixa"]);
    expect([...campos.identificacao]).toEqual(["nome", "idade"]);
  });

  it("não deixa gerar PDF vazio", async () => {
    abrir();
    await userEvent.click(screen.getByRole("button", { name: "Remover tudo" }));
    expect(screen.getByRole("button", { name: "Gerar PDF (0 seções)" })).toBeDisabled();
  });

  it("permite escolher campos dentro de uma seção", async () => {
    const { onConfirm, dialogo } = abrir();
    await userEvent.click(screen.getByRole("button", { name: "Remover tudo" }));

    // Expande "Identificação" e marca só o nome: a seção volta a entrar.
    await userEvent.click(within(dialogo).getAllByRole("button", { name: "▸" })[0]);
    await userEvent.click(screen.getByRole("checkbox", { name: "Nome" }));
    await userEvent.click(screen.getByRole("button", { name: "Gerar PDF (1 seção)" }));

    const [selecionadas, campos] = onConfirm.mock.calls[0] as [Set<string>, Record<string, Set<string>>];
    expect([...selecionadas]).toEqual(["identificacao"]);
    expect([...campos.identificacao]).toEqual(["nome"]);
  });

  it("fecha com Esc ou Cancelar", async () => {
    const { onCancel } = abrir();
    await userEvent.keyboard("{Escape}");
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalledTimes(2);
  });
});
