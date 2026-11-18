import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { UsuarioCompartilhavel, Visibilidade } from "@/lib/visibilidade";
import VisibilidadeSelector from "./VisibilidadeSelector";

const usuarios: UsuarioCompartilhavel[] = [
  { id: "autora", nome: "Ana Autora", especialidade: "PSICOLOGIA", perfis: ["PROFISSIONAL"] },
  { id: "bia", nome: "Bia Psicóloga", especialidade: "PSICOLOGIA", perfis: ["PROFISSIONAL"] },
  { id: "carla", nome: "Carla Gestora", especialidade: null, perfis: ["GESTORA"] },
];

/** Renderiza o seletor com estado real, como na página de prontuários. */
function Harness({ onCompartilhar = vi.fn() }: { onCompartilhar?: (ids: string[]) => void }) {
  const [visibilidade, setVisibilidade] = useState<Visibilidade>("PRIVADO");
  const [ids, setIds] = useState<string[]>([]);
  return (
    <>
      <VisibilidadeSelector
        visibilidade={visibilidade}
        onVisibilidadeChange={setVisibilidade}
        compartilhamentos={ids}
        onCompartilhamentosChange={(novos) => { setIds(novos); onCompartilhar(novos); }}
        especialidade="PSICOLOGIA"
        usuarios={usuarios}
        autorId="autora"
      />
      <output data-testid="estado">{visibilidade}</output>
    </>
  );
}

describe("VisibilidadeSelector", () => {
  it("começa em 'Só eu' e troca de opção", async () => {
    render(<Harness />);
    expect(screen.getByRole("radio", { name: /Só eu/ })).toBeChecked();

    await userEvent.click(screen.getByRole("radio", { name: /Só psicólogos/ }));
    expect(screen.getByTestId("estado")).toHaveTextContent("ESPECIALIDADE");
  });

  it("não oferece a própria autora para compartilhamento", async () => {
    render(<Harness />);
    await userEvent.type(screen.getByPlaceholderText("Buscar pelo nome…"), "a");
    expect(screen.queryByText("Ana Autora")).not.toBeInTheDocument();
    expect(screen.getByText("Bia Psicóloga")).toBeInTheDocument();
  });

  it("inclui uma pessoa pelo nome e limpa a busca", async () => {
    const onCompartilhar = vi.fn();
    render(<Harness onCompartilhar={onCompartilhar} />);
    const busca = screen.getByPlaceholderText("Buscar pelo nome…");

    await userEvent.type(busca, "carla");
    await userEvent.click(screen.getByRole("button", { name: /Carla Gestora/ }));

    expect(onCompartilhar).toHaveBeenLastCalledWith(["carla"]);
    expect(busca).toHaveValue("");
  });

  it("avisa quando ninguém corresponde à busca", async () => {
    render(<Harness />);
    await userEvent.type(screen.getByPlaceholderText("Buscar pelo nome…"), "zzz");
    expect(screen.getByText("Ninguém encontrado com esse nome.")).toBeInTheDocument();
  });
});
