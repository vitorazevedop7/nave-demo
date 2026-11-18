import { afterEach, describe, expect, it, vi } from "vitest";
import {
  calcularIdade,
  ehCrianca,
  mapearEscolaridade,
  mapearEstadoCivil,
  normalizarTexto,
  rotuloOrigemAcesso,
} from "./helpers";
import type { Agendamento, OutroProntuarioResumo } from "./tipos";

afterEach(() => vi.useRealTimers());

describe("normalização do cadastro", () => {
  it("ignora acento e caixa", () => {
    expect(normalizarTexto("  Fisioterapêutico ")).toBe("fisioterapeutico");
  });

  it("aceita as variações de estado civil vindas do cadastro", () => {
    expect(mapearEstadoCivil("UNIAO_ESTAVEL")).toBe("União estável");
    expect(mapearEstadoCivil("separada")).toBe("Divorciada");
    expect(mapearEstadoCivil("VIUVA")).toBe("Viúva");
    expect(mapearEstadoCivil("outro")).toBe("");
  });

  it("não confunde 'não alfabetizada' com 'alfabetizada'", () => {
    expect(mapearEscolaridade("Não alfabetizada")).toBe("Sem escolaridade");
    expect(mapearEscolaridade("alfabetizada")).toBe("Alfabetizada");
    expect(mapearEscolaridade("POS_GRADUACAO")).toBe("Pós-graduação");
  });
});

describe("idade", () => {
  it("só conta o ano depois do aniversário", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 18));
    expect(calcularIdade("2008-11-18T00:00:00.000Z")).toBe("18");
    expect(calcularIdade("2008-11-19T00:00:00.000Z")).toBe("17");
    expect(calcularIdade(undefined)).toBe("");
  });

  it("trata menores de 18 como criança para escolher a ficha", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 18));
    const ag = (nasc?: string) =>
      ({ beneficiarias: { nome: "X", data_nascimento: nasc } }) as Agendamento;
    expect(ehCrianca(ag("2015-01-01T00:00:00.000Z"))).toBe(true);
    expect(ehCrianca(ag("2008-11-18T00:00:00.000Z"))).toBe(false);
    expect(ehCrianca(ag(undefined))).toBe(false);
  });
});

describe("rotuloOrigemAcesso", () => {
  const resumo = (origem: OutroProntuarioResumo["origem_acesso"]): OutroProntuarioResumo => ({
    id: "1",
    especialidade: "FISIOTERAPIA",
    origem_acesso: origem,
    beneficiarias: { id: "b", nome: "B" },
    usuarios: { nome: "U" },
  });

  it("explica por que a profissional vê o laudo", () => {
    expect(rotuloOrigemAcesso(resumo("COMPARTILHADO_COM_VOCE"))).toBe("Compartilhado com você");
    expect(rotuloOrigemAcesso(resumo("ESPECIALIDADE"))).toBe("Fisioterapia");
    expect(rotuloOrigemAcesso(resumo("EQUIPE_CLINICA"))).toBe("Equipe clínica");
  });
});
