import { describe, expect, it } from "vitest";
import {
  VISIBILIDADE_PADRAO,
  descreverUsuario,
  nomeEspecialidade,
  opcoesVisibilidade,
  resumoVisibilidade,
} from "./visibilidade";

describe("visibilidade de prontuário", () => {
  it("começa sempre na opção mais fechada", () => {
    expect(VISIBILIDADE_PADRAO).toBe("PRIVADO");
  });

  it("lista as quatro opções na ordem aprovada pela ONG", () => {
    expect(opcoesVisibilidade("PSICOLOGIA").map((o) => o.valor)).toEqual([
      "PRIVADO",
      "ESPECIALIDADE",
      "GESTORAS",
      "EQUIPE_CLINICA",
    ]);
  });

  it("nomeia a opção de especialidade conforme a especialidade do laudo", () => {
    expect(opcoesVisibilidade("FISIOTERAPIA")[1].rotulo).toBe("Só fisioterapeutas");
    expect(opcoesVisibilidade("FEPAD")[1].rotulo).toBe("Só profissionais de FEPAD");
  });

  it("resume a visibilidade em uma frase", () => {
    expect(resumoVisibilidade("ESPECIALIDADE", "PSICOLOGIA")).toBe("Visível para você e psicólogos");
    expect(resumoVisibilidade(undefined)).toBe("Visível só para você");
  });

  it("descreve usuários pela especialidade e pelo perfil de gestora", () => {
    expect(
      descreverUsuario({ id: "1", nome: "Ana", especialidade: "ASSISTENCIA_SOCIAL", perfis: ["GESTORA"] }),
    ).toBe("Assistência Social · Gestora");
    expect(nomeEspecialidade("psicologia")).toBe("Psicologia");
  });
});
