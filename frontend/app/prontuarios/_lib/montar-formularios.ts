// Funções puras que convertem agendamento + prontuário salvo em estado de
// formulário, e o formulário de volta no payload da API. Ficam fora da página
// para que a regra de preenchimento possa ser lida (e testada) sem React.

import { hojeInputDate, paraInputDate } from "@/lib/date";
import type { FormAcupuntura, FormAnamnese, FormCrianca, FormFisioterapia, ModalType, Morador } from "@/lib/types/prontuario";
import {
  ANAMNESE_BOOL_FIELDS, ANAMNESE_DATE_FIELDS,
  initialAcupuntura, initialAnamnese, initialCrianca, initialFisio,
} from "./formularios";
import {
  buildAcupunturaObservacoes, calcularIdade, dbParaFormStrings,
  normalizarSelecionavel, parseAcupunturaExtras, toDateInputValue,
} from "./helpers";
import type { Agendamento, ProntuarioView } from "./tipos";

/** Dados da beneficiária que pré-preenchem a anamnese adulto. */
export function preencherBeneficiaria(ag: Agendamento): Partial<FormAnamnese> {
  const b = ag.beneficiarias;
  return {
    nome: b?.nome || "",
    data_nascimento: paraInputDate(b?.data_nascimento),
    idade: calcularIdade(b?.data_nascimento),
    telefone: b?.telefone || "",
    residencia: b?.endereco || "",
    civil: normalizarSelecionavel("civil", b?.estado_civil || ""),
    escolaridade: normalizarSelecionavel("escolaridade", b?.escolaridade || ""),
    ocupacao: b?.ocupacao || "",
    // Profissao (formacao) e um campo proprio da anamnese: nao herda a ocupacao da beneficiaria
    profissao: "",
    desempregado: typeof b?.empregada === "boolean" ? (b.empregada ? "Não" : "Sim") : "",
    data_atendimento: hojeInputDate(),
  };
}

export function montarFormFisioterapia(
  ag: Agendamento,
  existing: ProntuarioView | null,
  nomeProfissional: string,
): FormFisioterapia {
  const base: FormFisioterapia = {
    ...initialFisio,
    nome: ag.beneficiarias?.nome || "",
    idade: calcularIdade(ag.beneficiarias?.data_nascimento),
    cpf: ag.beneficiarias?.cpf || "",
    contato: ag.beneficiarias?.telefone || "",
    ocupacao: ag.beneficiarias?.ocupacao || "",
    data_assinatura: hojeInputDate(),
    assinatura: nomeProfissional,
  };
  if (!existing?.prontuarios_fisioterapia) return base;
  const patch = dbParaFormStrings(
    existing.prontuarios_fisioterapia,
    new Set(["data_assinatura"]),
  );
  return { ...base, ...(patch as Partial<FormFisioterapia>) };
}

export function montarFormAcupuntura(
  ag: Agendamento,
  existing: ProntuarioView | null,
): FormAcupuntura {
  const base: FormAcupuntura = {
    ...initialAcupuntura,
    nome: ag.beneficiarias?.nome || "",
    endereco: ag.beneficiarias?.endereco || "",
    idade: calcularIdade(ag.beneficiarias?.data_nascimento),
    data_nascimento: paraInputDate(ag.beneficiarias?.data_nascimento),
    telefone: ag.beneficiarias?.telefone || "",
    profissao: ag.beneficiarias?.ocupacao || "",
    estado_civil: normalizarSelecionavel("civil", ag.beneficiarias?.estado_civil || ""),
    data_consulta: hojeInputDate(),
  };
  if (!existing?.prontuarios_acupuntura) return base;
  const patch = dbParaFormStrings(
    existing.prontuarios_acupuntura,
    new Set(["data_atendimento", "data_assinatura"]),
  ) as Record<string, string>;
  const extras = parseAcupunturaExtras(patch.observacoes_clinicas);
  return {
    ...base,
    ...extras,
    nome: patch.nome || base.nome,
    data_consulta:
      toDateInputValue(patch.data_atendimento)
      || toDateInputValue(patch.data_assinatura)
      || extras.data_consulta
      || base.data_consulta,
    historia: patch.queixa_principal || extras.historia || base.historia,
    tecnicas_utilizadas: extras.tecnicas_utilizadas || base.tecnicas_utilizadas,
  };
}

export function montarFormCrianca(
  ag: Agendamento,
  existing: ProntuarioView | null,
  nomeProfissional: string,
): { form: FormCrianca; moradores: Morador[] } {
  const base: FormCrianca = {
    ...initialCrianca,
    nome: ag.beneficiarias?.nome || "",
    data_nascimento: paraInputDate(ag.beneficiarias?.data_nascimento),
    profissional: nomeProfissional,
    idade: calcularIdade(ag.beneficiarias?.data_nascimento),
    data_atendimento: hojeInputDate(),
  };
  let form = base;
  if (existing?.prontuarios_psicologia_crianca) {
    const patch = dbParaFormStrings(
      existing.prontuarios_psicologia_crianca,
      new Set(["data_atendimento", "data_nascimento"]),
    );
    form = { ...base, ...(patch as Partial<FormCrianca>) };
    // A ficha completa fica num JSON; as colunas avulsas são só um resumo.
    if (typeof patch.dados_json === "string" && patch.dados_json) {
      try {
        form = { ...form, ...(JSON.parse(patch.dados_json) as Partial<FormCrianca>) };
      } catch { /* JSON inválido: fica com as colunas avulsas */ }
    }
  }
  let moradores: Morador[] = [];
  try {
    const m: unknown = form.familia_moradores ? JSON.parse(form.familia_moradores) : [];
    moradores = Array.isArray(m) ? (m as Morador[]) : [];
  } catch { moradores = []; }
  return { form, moradores };
}

export function montarFormAnamnese(
  ag: Agendamento,
  existing: ProntuarioView | null,
  nomeProfissional: string,
): FormAnamnese {
  const base: FormAnamnese = {
    ...initialAnamnese,
    ...preencherBeneficiaria(ag),
    psicologo_estagiario: nomeProfissional,
  };
  if (!existing?.prontuarios_psicologia_adulto) return base;
  const patch = dbParaFormStrings(
    existing.prontuarios_psicologia_adulto,
    ANAMNESE_DATE_FIELDS,
    ANAMNESE_BOOL_FIELDS,
  );
  return { ...base, ...(patch as Partial<FormAnamnese>) };
}

export interface FormulariosProntuario {
  anamneseAdulto: FormAnamnese;
  anamneseCrianca: FormCrianca;
  fisioterapia: FormFisioterapia;
  acupuntura: FormAcupuntura;
}

/** Parte do payload específica de cada ficha, mais a descrição do prontuário. */
export function montarPayloadFicha(
  modalType: ModalType | null,
  forms: FormulariosProntuario,
  nomeProfissional: string,
): { tipoData: Record<string, unknown>; descricao?: string } {
  switch (modalType) {
    case "anamnese_adulto":
      return {
        tipoData: { psicologia_adulto: forms.anamneseAdulto },
        descricao: forms.anamneseAdulto.queixa_principal,
      };
    case "anamnese_crianca": {
      const f = forms.anamneseCrianca;
      return {
        tipoData: {
          psicologia_crianca: {
            data_atendimento: f.data_atendimento,
            profissional: f.profissional,
            nome: f.nome,
            idade: f.idade,
            sexo: f.sexo,
            queixa_principal: f.queixa_principal,
            dados_json: JSON.stringify(f),
          },
        },
        descricao: f.queixa_principal,
      };
    }
    case "fisioterapia":
      return {
        tipoData: {
          fisioterapia: {
            ...forms.fisioterapia,
            dor_intensidade: parseInt(forms.fisioterapia.dor_intensidade) || 0,
          },
        },
        descricao: forms.fisioterapia.queixa_principal,
      };
    case "acupuntura": {
      const f = forms.acupuntura;
      const dataConsulta = f.data_consulta || hojeInputDate();
      return {
        tipoData: {
          acupuntura: {
            data_atendimento: dataConsulta,
            nome: f.nome,
            profissional: nomeProfissional,
            queixa_principal: f.historia,
            observacoes_clinicas: buildAcupunturaObservacoes(f),
            data_assinatura: dataConsulta,
          },
        },
        descricao: f.historia,
      };
    }
    default:
      return { tipoData: {} };
  }
}
