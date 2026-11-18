import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BeneficiariaOpcao } from "@/lib/beneficiarias";
import BuscaBeneficiaria from "./BuscaBeneficiaria";

const buscarBeneficiarias = vi.fn();
vi.mock("@/lib/beneficiarias", () => ({
  buscarBeneficiarias: (...args: unknown[]) => buscarBeneficiarias(...args) as unknown,
}));

function Harness({ tipo }: { tipo?: string }) {
  const [selecionada, setSelecionada] = useState<BeneficiariaOpcao | null>(null);
  return (
    <BuscaBeneficiaria
      label="Responsável"
      placeholder="Buscar..."
      tipo={tipo}
      selecionada={selecionada}
      onSelecionar={setSelecionada}
      dica={<p>Dica de uso</p>}
    />
  );
}

beforeEach(() => {
  buscarBeneficiarias.mockReset();
  buscarBeneficiarias.mockResolvedValue([
    { id: "1", nome: "Maria Demo" },
    { id: "2", nome: "Marta Demo" },
  ]);
});

describe("BuscaBeneficiaria", () => {
  it("só consulta a API a partir de 2 letras e com debounce", async () => {
    render(<Harness tipo="ADULTA" />);
    const campo = screen.getByPlaceholderText("Buscar...");

    await userEvent.type(campo, "M");
    await new Promise((r) => setTimeout(r, 350));
    expect(buscarBeneficiarias).not.toHaveBeenCalled();

    await userEvent.type(campo, "ar");
    expect(await screen.findByText("Maria Demo")).toBeInTheDocument();
    // Várias teclas seguidas viram uma única consulta, já com o filtro de tipo.
    expect(buscarBeneficiarias).toHaveBeenCalledTimes(1);
    expect(buscarBeneficiarias).toHaveBeenCalledWith("Mar", "ADULTA");
  });

  it("mostra a escolhida como etiqueta e permite desfazer", async () => {
    render(<Harness />);
    await userEvent.type(screen.getByPlaceholderText("Buscar..."), "Ma");
    await userEvent.click(await screen.findByText("Marta Demo"));

    expect(screen.getByText("Marta Demo")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Buscar...")).not.toBeInTheDocument();
    expect(screen.queryByText("Dica de uso")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Remover seleção" }));
    expect(screen.getByPlaceholderText("Buscar...")).toHaveValue("");
    expect(screen.getByText("Dica de uso")).toBeInTheDocument();
  });
});
