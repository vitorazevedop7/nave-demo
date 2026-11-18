import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initialAcupuntura, initialAnamnese, initialCrianca, initialFisio } from "./formularios";
import {
  montarFormAcupuntura,
  montarFormAnamnese,
  montarFormCrianca,
  montarFormFisioterapia,
  montarPayloadFicha,
  preencherBeneficiaria,
} from "./montar-formularios";
import type { Agendamento, ProntuarioView } from "./tipos";

const agendamento = (beneficiaria: Partial<Agendamento["beneficiarias"]> = {}): Agendamento => ({
  id: "ag-1",
  beneficiaria_id: "b-1",
  profissional_id: "p-1",
  data_hora: "2026-11-18T13:00:00.000Z",
  beneficiarias: {
    nome: "Pessoa Demo",
    cpf: "11111111111",
    data_nascimento: "1990-05-20T00:00:00.000Z",
    telefone: "(31) 90000-0000",
    endereco: "Rua Fictícia, 1",
    estado_civil: "CASADA",
    escolaridade: "MEDIO",
    ocupacao: "Costureira",
    empregada: true,
    ...beneficiaria,
  },
});

const prontuario = (parcial: Partial<ProntuarioView>): ProntuarioView => ({
  id: "pr-1",
  especialidade: "PSICOLOGIA",
  ...parcial,
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-18T15:00:00.000Z"));
});
afterEach(() => vi.useRealTimers());

describe("preencherBeneficiaria", () => {
  it("traduz o cadastro para os campos da anamnese", () => {
    expect(preencherBeneficiaria(agendamento())).toMatchObject({
      nome: "Pessoa Demo",
      data_nascimento: "1990-05-20",
      idade: "36",
      residencia: "Rua Fictícia, 1",
      civil: "Casada",
      escolaridade: "Médio",
      ocupacao: "Costureira",
      desempregado: "Não",
      data_atendimento: "2026-11-18",
    });
  });

  it("não copia a ocupação para a profissão de formação", () => {
    expect(preencherBeneficiaria(agendamento()).profissao).toBe("");
  });

  it("deixa 'desempregado' em branco quando o cadastro não informa", () => {
    expect(preencherBeneficiaria(agendamento({ empregada: null })).desempregado).toBe("");
  });
});

describe("montarFormAnamnese", () => {
  it("parte do cadastro e assina com a profissional logada", () => {
    const form = montarFormAnamnese(agendamento(), null, "Dra. Demo");
    expect(form.psicologo_estagiario).toBe("Dra. Demo");
    expect(form.nome).toBe("Pessoa Demo");
    expect(form.queixa_principal).toBe("");
  });

  it("sobrepõe o que já foi salvo, convertendo datas e booleanos", () => {
    const salvo = prontuario({
      prontuarios_psicologia_adulto: {
        id: "x",
        prontuario_id: "pr-1",
        queixa_principal: "Ansiedade",
        data_atendimento: "2026-10-01T00:00:00.000Z",
        orientacao_temporal: true,
        pensamento_fuga: null,
      },
    });
    const form = montarFormAnamnese(agendamento(), salvo, "Dra. Demo");
    expect(form.queixa_principal).toBe("Ansiedade");
    expect(form.data_atendimento).toBe("2026-10-01");
    expect(form.orientacao_temporal).toBe(true);
    expect(form.pensamento_fuga).toBe(false);
    expect(form).not.toHaveProperty("prontuario_id");
  });
});

describe("montarFormFisioterapia", () => {
  it("preenche identificação e assinatura a partir do agendamento", () => {
    const form = montarFormFisioterapia(agendamento(), null, "Fisio Demo");
    expect(form).toMatchObject({
      nome: "Pessoa Demo",
      cpf: "11111111111",
      contato: "(31) 90000-0000",
      assinatura: "Fisio Demo",
      data_assinatura: "2026-11-18",
      dor_intensidade: initialFisio.dor_intensidade,
    });
  });

  it("converte números salvos em texto para o formulário", () => {
    const salvo = prontuario({ prontuarios_fisioterapia: { dor_intensidade: 7, queixa_principal: "Lombar" } });
    const form = montarFormFisioterapia(agendamento(), salvo, "Fisio Demo");
    expect(form.dor_intensidade).toBe("7");
    expect(form.queixa_principal).toBe("Lombar");
  });
});

describe("montarFormAcupuntura", () => {
  it("recupera os campos extras guardados em observacoes_clinicas", () => {
    const extras = { ...initialAcupuntura, sono: "Ruim", tecnicas_utilizadas: "Auriculoterapia" };
    const salvo = prontuario({
      prontuarios_acupuntura: {
        nome: "Pessoa Demo",
        queixa_principal: "Insônia",
        data_atendimento: "2026-10-05T00:00:00.000Z",
        observacoes_clinicas: JSON.stringify(extras),
      },
    });
    const form = montarFormAcupuntura(agendamento(), salvo);
    expect(form).toMatchObject({
      historia: "Insônia",
      sono: "Ruim",
      tecnicas_utilizadas: "Auriculoterapia",
      data_consulta: "2026-10-05",
    });
  });

  it("ignora observações que não são JSON", () => {
    const salvo = prontuario({ prontuarios_acupuntura: { observacoes_clinicas: "texto livre" } });
    expect(montarFormAcupuntura(agendamento(), salvo).sono).toBe("");
  });
});

describe("montarFormCrianca", () => {
  it("restaura a ficha completa e os moradores a partir do JSON salvo", () => {
    const moradores = [{ nome: "Mãe", parentesco: "Mãe", idade: "35" }];
    const salvo = prontuario({
      prontuarios_psicologia_crianca: {
        queixa_principal: "Resumo",
        dados_json: JSON.stringify({
          ...initialCrianca,
          queixa_principal: "Queixa completa",
          familia_moradores: JSON.stringify(moradores),
        }),
      },
    });
    const { form, moradores: lidos } = montarFormCrianca(agendamento(), salvo, "Psi Demo");
    expect(form.queixa_principal).toBe("Queixa completa");
    expect(lidos).toEqual(moradores);
  });

  it("começa sem moradores quando não há ficha salva", () => {
    const { form, moradores } = montarFormCrianca(agendamento(), null, "Psi Demo");
    expect(form.profissional).toBe("Psi Demo");
    expect(moradores).toEqual([]);
  });
});

describe("montarPayloadFicha", () => {
  const forms = {
    anamneseAdulto: { ...initialAnamnese, queixa_principal: "Adulto" },
    anamneseCrianca: { ...initialCrianca, nome: "Criança", queixa_principal: "Infantil" },
    fisioterapia: { ...initialFisio, dor_intensidade: "8", queixa_principal: "Joelho" },
    acupuntura: { ...initialAcupuntura, historia: "Enxaqueca", data_consulta: "" },
  };

  it("envia a intensidade da dor como número", () => {
    const { tipoData, descricao } = montarPayloadFicha("fisioterapia", forms, "Fisio");
    expect(tipoData).toEqual({ fisioterapia: expect.objectContaining({ dor_intensidade: 8 }) as unknown });
    expect(descricao).toBe("Joelho");
  });

  it("guarda a ficha infantil inteira em dados_json", () => {
    const { tipoData } = montarPayloadFicha("anamnese_crianca", forms, "Psi");
    const ficha = (tipoData.psicologia_crianca as { dados_json: string; nome: string });
    expect(ficha.nome).toBe("Criança");
    expect(JSON.parse(ficha.dados_json)).toMatchObject({ queixa_principal: "Infantil" });
  });

  it("usa hoje como data da acupuntura quando o campo está vazio", () => {
    const { tipoData } = montarPayloadFicha("acupuntura", forms, "Acu");
    expect(tipoData.acupuntura).toMatchObject({
      data_atendimento: "2026-11-18",
      profissional: "Acu",
      queixa_principal: "Enxaqueca",
    });
  });

  it("não monta nada sem tipo de ficha", () => {
    expect(montarPayloadFicha(null, forms, "X")).toEqual({ tipoData: {} });
  });
});
