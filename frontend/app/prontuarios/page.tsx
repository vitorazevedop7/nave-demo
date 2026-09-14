"use client";

import { useState, useEffect, useRef, useId } from "react";
import { Printer } from "lucide-react";
import { fetchAuth, getUsuario } from "@/lib/auth";
import { API_URL, extrairMensagemErro, mensagemDeErro } from "@/lib/api";
import { formatarTimestamp, hojeInputDate, paraInputDate, parseDataPura } from "@/lib/date";
import Button from "@/components/Button";
import { createPortal } from "react-dom";
import { CarimboRestrito } from "@/components/AcessoProntuario";
import ProntuarioSomenteLeitura from "@/components/ProntuarioSomenteLeitura";
import VisibilidadeSelector from "@/components/VisibilidadeSelector";
import { PDF_SECTIONS, abrirImpressao, gerarHtmlProntuario } from "@/lib/prontuario-pdf";
import type { FormAcupuntura, FormAnamnese, FormCrianca, FormFisioterapia, ModalType, Morador } from "@/lib/types/prontuario";
import { nomeEspecialidade, VISIBILIDADE_PADRAO, type UsuarioCompartilhavel, type Visibilidade } from "@/lib/visibilidade";

// ─── Interfaces de dados ──────────────────────────────────────────────────────

interface Agendamento {
  id: string;
  beneficiaria_id: string;
  profissional_id: string;
  data_hora: string;
  status?: string;
  observacoes?: string;
  beneficiarias: {
    nome: string;
    cpf?: string;
    data_nascimento?: string;
    telefone?: string;
    endereco?: string;
    estado_civil?: string;
    escolaridade?: string;
    ocupacao?: string;
    empregada?: boolean | null;
  };
  usuarios?: { especialidade: string | null };
  encaminhamentos?: { especialidade: string } | null;
}

interface UsuarioLogado {
  id: string;
  nome: string;
  especialidade: string | null;
  perfis?: string[];
}

interface ProntuarioView {
  id: string;
  especialidade: string;
  profissional_id?: string;
  descricao?: string;
  criado_em?: string;
  autor?: string;
  profissional?: string;
  beneficiarias?: { id: string; nome: string };
  visibilidade?: Visibilidade;
  // A API só devolve `compartilhamentos` para o autor.
  compartilhamentos?: string[];
  // Carimbo: veio sem conteúdo clínico. Os campos de ficha não existem.
  conteudo_restrito?: boolean;
  prontuarios_psicologia_adulto?: Record<string, unknown> | null;
  prontuarios_psicologia_crianca?: Record<string, unknown> | null;
  prontuarios_fisioterapia?: Record<string, unknown> | null;
  prontuarios_acupuntura?: Record<string, unknown> | null;
  prontuarios_psicologia?: Record<string, unknown> | null;
}

type OrigemAcessoProntuario =
  | "COMPARTILHADO_COM_VOCE"
  | "ESPECIALIDADE"
  | "GESTORAS"
  | "EQUIPE_CLINICA";

interface OutroProntuarioResumo {
  id: string;
  especialidade: string;
  criado_em?: string;
  origem_acesso: OrigemAcessoProntuario;
  beneficiarias: { id: string; nome: string };
  usuarios: { nome: string };
}

function rotuloOrigemAcesso(prontuario: OutroProntuarioResumo): string {
  switch (prontuario.origem_acesso) {
    case "COMPARTILHADO_COM_VOCE":
      return "Compartilhado com você";
    case "ESPECIALIDADE":
      return nomeEspecialidade(prontuario.especialidade);
    case "GESTORAS":
      return "Gestoras";
    case "EQUIPE_CLINICA":
      return "Equipe clínica";
  }
}

type ResultadoBuscaAgendamento =
  | { estado: "AUSENTE" }
  | { estado: "RESTRITO"; prontuario: ProntuarioView }
  | { estado: "DISPONIVEL"; prontuario: ProntuarioView };

// ─── Formulários (tipos em lib/types/prontuario.ts) ──────────────────────────


type CheckboxFieldKey =
  | "orientacao_autoidentificatoria" | "orientacao_corporal" | "orientacao_temporal"
  | "orientacao_espacial" | "orientacao_patologia" | "pensamento_acelerado"
  | "pensamento_retardado" | "pensamento_fuga" | "pensamento_bloqueio"
  | "pensamento_prolixo" | "pensamento_repeticao" | "conteudo_obsessoes"
  | "conteudo_hipocondrias" | "conteudo_fobias" | "conteudo_delirios";

// ─── Estado inicial ───────────────────────────────────────────────────────────

const initialAnamnese: FormAnamnese = {
  data_atendimento: "", psicologo_estagiario: "",
  nome: "", idade: "", sexo: "", nacionalidade: "", civil: "", data_nascimento: "",
  estado: "", escolaridade: "", profissao: "", desempregado: "", tempo_desemprego: "",
  residencia: "", telefone: "", ocupacao: "", hobbies: "",
  queixa_principal: "", queixa_secundaria: "", sintomas: "", psicoterapia_anterior: "",
  expectativas_objetivos: "", historico_infancia: "", rotina: "", vicios: "", trabalho: "",
  doencas_transtornos: "", medicamentos: "", uso_drogas: "", ideacao_suicida: "",
  pais_cuidadores: "", irmaos: "", conjuge: "", filhos: "", lar: "",
  patologia_pregressa: "", adolescencia: "", relacionamentos_atuais: "",
  aparencia: "", comportamento: "", atitude_entrevistador: "",
  orientacao_autoidentificatoria: false, orientacao_corporal: false,
  orientacao_temporal: false, orientacao_espacial: false, orientacao_patologia: false,
  orientacao_observacoes: "", atencao_vigilancia: "", atencao_tenacidade: "",
  memoria: "", inteligencia: "", sensopercpcao: "",
  pensamento_acelerado: false, pensamento_retardado: false, pensamento_fuga: false,
  pensamento_bloqueio: false, pensamento_prolixo: false, pensamento_repeticao: false,
  conteudo_obsessoes: false, conteudo_hipocondrias: false,
  conteudo_fobias: false, conteudo_delirios: false,
  expansao_eu_opcoes: "", retracao_eu_opcoes: "", negacao_eu_opcoes: "",
  linguagem_disturbios: "", afetividade: "", humor_opcoes: "", consciencia_doenca: "",
  observacao_linguagem_nao_verbal: "", observacoes_finais: "",
};

const initialCrianca: FormCrianca = {
  data_atendimento: "", profissional: "", nome: "", data_nascimento: "", idade: "", sexo: "", ano_escolar: "", religiao: "",
  resp_nome: "", resp_parentesco: "", resp_adocao: "", resp_idade: "", resp_escolaridade: "", resp_profissao: "", resp_cpf_rg: "",
  info_parentesco: "", info_endereco: "", info_contatos: "", info_familiar_atendido: "",
  disp_segunda: "", disp_terca: "", disp_quarta: "", disp_quinta: "", disp_sexta: "", disp_sabado: "",
  queixa_origem: "", queixa_encaminhamento: "", queixa_paciente_sabe: "", queixa_paciente_sabe_obs: "", queixa_principal: "",
  familia_moradores: "[]", familia_renda: "", familia_cuidador: "", familia_membros_trabalham: "", familia_auxilio: "",
  familia_pais_provedores: "", familia_casa_tipo: "", familia_valor_aluguel: "", familia_rua_pavimentada: "",
  familia_agua_energia: "", familia_seguranca: "", familia_cama_propria: "", familia_quarto_sozinho: "",
  familia_rotina_paciente: "", familia_rotina_familia: "", familia_clima_casa: "", familia_eventos_importantes: "",
  gest_planejada: "", gest_aceita: "", gest_semanas_descoberta: "", gest_pre_natal: "", gest_pre_natal_onde: "",
  gest_pre_natal_semanas: "", gest_relacao_familia: "", gest_trabalhou: "", gest_trabalhou_cargo: "", gest_trabalhou_semana: "",
  gest_hospitalizacoes: "", gest_hospitalizacoes_motivo: "", gest_cirurgias: "", gest_cirurgias_motivo: "",
  gest_medicamentos: "", gest_medicamentos_quais: "", gest_quedas: "", gest_quedas_periodo: "",
  gest_drogas: "", gest_drogas_especificar: "", gest_raio_x: "", gest_doencas_mae: "", gest_doencas_mae_especificar: "",
  gest_semanas_nascimento: "", gest_tipo_parto: "", gest_parto_induzido: "", gest_forceps: "", gest_local_nascimento: "",
  gest_tempo_bolsa: "", gest_bebe_roxo: "", gest_chorou_nascer: "", gest_cuidados_intensivos: "",
  gest_cuidados_intensivos_tempo: "", gest_respirou_sozinho: "",
  marcos_balbucios: "", marcos_palavras: "", marcos_frases: "", marcos_firmou_cabeca: "", marcos_sentou: "",
  marcos_passos_apoio: "", marcos_caminhou: "", marcos_sorriu: "", marcos_seguiu_olhar: "",
  marcos_apontou: "", marcos_fralda_dia: "", marcos_fralda_noite: "",
  dev1_curva: "", dev1_chorava: "", dev1_dormia_muito: "", dev1_dormia_pouco: "", dev1_colicas: "", dev1_vacinacao: "", dev1_ambiente: "",
  saude_internacoes: "", saude_internacoes_detalhes: "", saude_med_atual: "", saude_med_atual_detalhes: "",
  saude_med_passada: "", saude_med_passada_detalhes: "", saude_auditivo: "", saude_auditivo_corrigido: "",
  saude_visual: "", saude_visual_corrigido: "", saude_desmaios: "", saude_desmaios_detalhes: "",
  saude_convulsoes: "", saude_convulsoes_detalhes: "", saude_meningite: "", saude_encefalite: "",
  saude_sarampo: "", saude_rubeola: "", saude_caxumba: "", saude_coqueluche: "", saude_pneumonia: "",
  saude_alergias: "", saude_alergias_quais: "", saude_outras_doencas: "", saude_outras_doencas_quais: "",
  saude_acompanhamento: "", saude_acompanhamento_detalhes: "", saude_dores: "", saude_dores_quais: "",
  saude_dores_frequencia: "", saude_diagnosticos: "", saude_diagnosticos_quais: "",
  social_tem_amigos: "", social_melhor_amigo: "", social_preferencia_idade: "", social_bullying: "",
  social_busca_interacao: "", social_adapta_brincadeiras: "", social_conversa_grupos: "",
  social_relacao_pai: "", social_relacao_mae: "", social_relacao_irmaos: "", social_relacao_professor: "",
  social_reage_negacao: "", social_frequenta_amigos: "", social_familiar_proximo: "",
  social_interesses: "", social_interesse_especifico: "", social_lida_rotina: "", social_interesses_faixa_etaria: "",
  auto_dinheiro: "", auto_higiene: "", auto_refeicoes: "", auto_horas: "", auto_tempo: "",
  auto_vestir: "", auto_escolher_roupas: "", auto_escala: "",
  sono_pegar: "", sono_despertar: "", sono_movimenta: "", sono_pesadelos: "",
  sono_ronca: "", sono_ronca_desde: "", sono_ronca_freq: "",
  sono_enurese: "", sono_enurese_desde: "", sono_enurese_freq: "",
  sono_tempo: "", sono_rotina: "", sono_rotina_horario: "",
  alim_amamentou: "", alim_amamentou_idade: "", alim_peso: "", alim_restricao: "",
  alim_resistencia: "", alim_muita_fome: "", alim_muita_fome_primeiros: "", alim_padrao: "",
  narr_historias: "", narr_recontar: "", narr_humor: "", narr_piadas: "", narr_escola: "", narr_recados: "",
  ori_direita_esquerda: "", ori_cima_baixo: "", ori_atras_frente: "", ori_ontem_hoje_amanha: "",
  ori_manha_tarde_noite: "", ori_dias_semana: "", ori_calendario: "", ori_aniversario: "",
  ori_ambientes_novos: "", ori_propria_casa: "", ori_escola: "",
  esc_idade_inicio: "", esc_alfabetizado: "", esc_letras: "", esc_numeros: "", esc_cores: "",
  esc_reprovacao: "", esc_reprovacao_detalhes: "", esc_dificuldades_gerais: "", esc_dificuldades_especifica: "",
  esc_dificuldades_quais: "", esc_queixas_comportamento: "", esc_rotina_estudo: "",
  esc_ambiente_estudo: "", esc_suporte_tarefas: "", esc_horario_dever: "",
  par_castigos_fisicos: "", par_xingamentos: "", par_conversas: "", par_negociacoes: "", par_elogios: "", par_carinhos: "",
  gen_dificuldades_escola: "", gen_diagnostico_psiquiatrico: "", gen_sindrome: "",
  gen_medicacoes_controladas: "", gen_tentativa_suicidio: "", gen_tentativa_suicidio_parentesco: "", gen_morte_suicidio: "",
  temp_descricao: "", temp_dificuldades: "",
};

const initialAcupuntura: FormAcupuntura = {
  nome: "",
  endereco: "",
  idade: "",
  data_nascimento: "",
  telefone: "",
  profissao: "",
  estado_civil: "",
  filho: "",
  pacote: "",
  historia: "",
  ig: "",
  sono: "",
  alimentacao: "",
  lingua: "",
  data_consulta: "",
  tecnicas_utilizadas: "",
};

const initialFisio: FormFisioterapia = {
  nome: "", idade: "", sexo: "", ocupacao: "", cpf: "", rg: "", contato: "",
  caso_clinico: "", historico_medico: "", usa_medicamento: "", medicamentos_lista: "",
  sv_fc: "", sv_fr: "", sv_pa: "", apresentacao_paciente: "", inspecao_palpacao: "",
  exames_complementares: "", exames_complementares_obs: "",
  protese_ortese: "", protese_ortese_obs: "",
  limitacao_movimento: "", limitacao_movimento_obs: "",
  equilibrio_coordenacao: "", queixa_principal: "", historia_clinica: "",
  demais_observacoes: "", dor_intensidade: "0", objetivo_tratamento: "",
  recursos_terapeuticos: "", anotacoes_gerais: "", data_assinatura: "", assinatura: "",
};

// ─── Opções de selects ────────────────────────────────────────────────────────

const sexoOptions = [
  { value: "", label: "Selecione..." },
  { value: "Feminino", label: "Feminino" },
  { value: "Masculino", label: "Masculino" },
  { value: "Outro", label: "Outro" },
  { value: "Prefiro não informar", label: "Prefiro não informar" },
];
const estadoCivilOptions = [
  { value: "", label: "Selecione..." },
  { value: "Solteira", label: "Solteira" },
  { value: "Casada", label: "Casada" },
  { value: "Divorciada", label: "Divorciada" },
  { value: "Viúva", label: "Viúva" },
  { value: "União estável", label: "União estável" },
];
const escolaridadeOptions = [
  { value: "", label: "Selecione..." },
  { value: "Sem escolaridade", label: "Sem escolaridade" },
  { value: "Alfabetizada", label: "Alfabetizada" },
  { value: "Fundamental", label: "Fundamental" },
  { value: "Médio", label: "Médio" },
  { value: "Superior", label: "Superior" },
  { value: "Pós-graduação", label: "Pós-graduação" },
];
const desempregadoOptions = [
  { value: "", label: "Selecione..." },
  { value: "Empregada", label: "Empregada" },
  { value: "Desempregada", label: "Desempregada" },
];
const atitudeOptions = [
  { value: "", label: "Selecione..." },
  { value: "Cooperativo", label: "Cooperativo" },
  { value: "Resistente", label: "Resistente" },
  { value: "Indiferente", label: "Indiferente" },
];
const sensopercpcaoOptions = [
  { value: "", label: "Selecione..." },
  { value: "Normal", label: "Normal" },
  { value: "Alucinação", label: "Alucinação" },
];
const simNaoOptions = [
  { value: "", label: "Selecione..." },
  { value: "Sim", label: "Sim" },
  { value: "Não", label: "Não" },
];
const humorOptions = [
  { value: "", label: "Selecione..." },
  { value: "normal", label: "normal" },
  { value: "exaltado", label: "exaltado" },
  { value: "baixa_de_humor", label: "baixa de humor" },
  { value: "quebra_sudita", label: "quebra súbita da tonalidade do humor durante a entrevista" },
];
const conscienciaDoencaOptions = [
  { value: "", label: "Selecione..." },
  { value: "sim", label: "sim" },
  { value: "parcialmente", label: "parcialmente" },
  { value: "nao", label: "não" },
];
const expansaoEuOptions = [
  { value: "grandeza", label: "grandeza" },
  { value: "ciume", label: "ciúme" },
  { value: "reivindicacao", label: "reivindicação" },
  { value: "genealogico", label: "genealógico" },
  { value: "mistico", label: "místico, de missão salvadora" },
  { value: "deificacao", label: "deificação" },
  { value: "erotico", label: "erótico" },
  { value: "de_ciumes", label: "de ciúmes" },
  { value: "invencao", label: "invenção ou reforma" },
  { value: "ideias_fantasticas", label: "ideias fantásticas" },
  { value: "excessiva_saude", label: "excessiva saúde" },
  { value: "capacidade_fisica", label: "capacidade física" },
  { value: "beleza", label: "beleza" },
  { value: "outros", label: "outros" },
];
const retracaoEuOptions = [
  { value: "prejuizo", label: "prejuízo" },
  { value: "auto_referencia", label: "auto-referência" },
  { value: "perseguicao", label: "perseguição" },
  { value: "influencia", label: "influência" },
  { value: "possessao", label: "possessão" },
  { value: "humildades", label: "humildades" },
  { value: "experiencias_apocalipticas", label: "experiências apocalípticas" },
  { value: "outros", label: "outros" },
];
const negacaoEuOptions = [
  { value: "hipocondriaco", label: "hipocondríaco" },
  { value: "negacao_corporal", label: "negação e transformação corporal" },
  { value: "autoacusacao", label: "autoacusação" },
  { value: "culpa", label: "culpa" },
  { value: "ruina", label: "ruína" },
  { value: "niilismo", label: "niilismo" },
  { value: "tendencia_suicidio", label: "tendência ao suicídio" },
  { value: "outros", label: "outros" },
];
const linguagemOptions = [
  { value: "disartrias", label: "disartrias (má articulação)" },
  { value: "afasias", label: "afasias, verbigeração (repetição de palavras)" },
  { value: "parafasia", label: "parafasia (emprego inapropriado de palavras com sentidos parecidos)" },
  { value: "neologismo", label: "neologismo" },
  { value: "mussitacao", label: "mussitação (voz murmurada em tom baixo)" },
  { value: "logorreia", label: "logorréia (fluxo incessante e incoercível de palavras)" },
  { value: "para_respostas", label: "para-respostas (responde fora do contexto da pergunta)" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const normalizarTexto = (v?: string) =>
  (v || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const mapearEstadoCivil = (v?: string): string => {
  const n = normalizarTexto(v);
  if (!n) return "";
  if (n.includes("solteir")) return "Solteira";
  if (n.includes("casad")) return "Casada";
  if (n.includes("divorciad") || n.includes("separad")) return "Divorciada";
  if (n.includes("viuv")) return "Viúva";
  if (n.includes("uniao") || n.includes("estavel")) return "União estável";
  return "";
};

const mapearEscolaridade = (v?: string): string => {
  const n = normalizarTexto(v);
  if (!n) return "";
  if (n.includes("sem escolaridade") || n.includes("nao alfabetiz") || n.includes("não alfabetiz")) return "Sem escolaridade";
  if (n.includes("alfabetiz")) return "Alfabetizada";
  if (n.includes("fundamental")) return "Fundamental";
  if (n.includes("medio") || n.includes("médio")) return "Médio";
  if (n.includes("superior")) return "Superior";
  if (n.includes("pos") || n.includes("pós")) return "Pós-graduação";
  return "";
};

const normalizarSelecionavel = (key: keyof FormAnamnese, value: string): string => {
  if (key === "civil") return mapearEstadoCivil(value);
  if (key === "escolaridade") return mapearEscolaridade(value);
  return value;
};

const toDateInputValue = (v: unknown): string => {
  if (!v) return "";
  const s = String(v);
  const match = s.match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : "";
};

const parseAcupunturaExtras = (value?: string): Partial<FormAcupuntura> => {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    const extras: Partial<FormAcupuntura> = {};
    (Object.keys(initialAcupuntura) as Array<keyof FormAcupuntura>).forEach((key) => {
      const candidate = parsed[key];
      if (typeof candidate === "string") extras[key] = candidate;
    });
    return extras;
  } catch {
    return {};
  }
};

const buildAcupunturaObservacoes = (form: FormAcupuntura): string => JSON.stringify(form);

const ANAMNESE_DATE_FIELDS = new Set(["data_atendimento", "data_nascimento"]);
const ANAMNESE_BOOL_FIELDS = new Set([
  "orientacao_autoidentificatoria", "orientacao_corporal", "orientacao_temporal",
  "orientacao_espacial", "orientacao_patologia", "pensamento_acelerado",
  "pensamento_retardado", "pensamento_fuga", "pensamento_bloqueio", "pensamento_prolixo",
  "pensamento_repeticao", "conteudo_obsessoes", "conteudo_hipocondrias",
  "conteudo_fobias", "conteudo_delirios",
]);

function dbParaFormStrings(
  rec: Record<string, unknown>,
  dateFields: Set<string>,
  boolFields: Set<string> = new Set(),
): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (const [k, v] of Object.entries(rec)) {
    if (k === "id" || k === "prontuario_id") continue;
    if (boolFields.has(k)) {
      out[k] = v === true;
    } else if (dateFields.has(k)) {
      out[k] = toDateInputValue(v);
    } else if (typeof v === "number") {
      out[k] = String(v);
    } else {
      out[k] = v != null ? String(v) : "";
    }
  }
  return out;
}

const stepsAnamnese = [
  { number: 1, title: "Cabeçalho e Identificação", description: "Data do atendimento e dados de identificação do paciente" },
  { number: 2, title: "Atendimento e Demanda", description: "Queixa principal e histórico de saúde" },
  { number: 3, title: "Histórico Pessoal e Familiar", description: "Rotina, relações e família" },
  { number: 4, title: "Exame Psíquico - Parte 1", description: "Apresentação, comportamento, orientação e atenção" },
  { number: 5, title: "Exame Psíquico - Parte 2", description: "Pensamento, conteúdo, afetividade e consciência da doença" },
  { number: 6, title: "Observações Finais", description: "Observações clínicas e linguagem não verbal" },
];

const stepsFisio = [
  { number: 1, title: "Identificação e Histórico", description: "Dados do paciente e histórico clínico" },
  { number: 2, title: "Exame Físico e Tratamento", description: "Exame físico, queixa, objetivos e recursos" },
];

const stepsCrianca = [
  { number: 1, title: "Dados Pessoais e Responsável", description: "Identificação da criança e responsável legal" },
  { number: 2, title: "Informante e Disponibilidade", description: "Informante da anamnese e horários disponíveis" },
  { number: 3, title: "Queixa", description: "Motivo da busca e percepção do paciente" },
  { number: 4, title: "Família e Moradia", description: "Composição familiar, renda e ambiente doméstico" },
  { number: 5, title: "Gestação e Parto", description: "Histórico gestacional e condições do nascimento" },
  { number: 6, title: "Marcos do Desenvolvimento", description: "Desenvolvimento motor, linguagem e 1º ano de vida" },
  { number: 7, title: "Histórico de Saúde", description: "Internações, medicações, doenças e acompanhamentos" },
  { number: 8, title: "Socialização e Autonomia", description: "Vínculos sociais e capacidade de autonomia" },
  { number: 9, title: "Sono e Alimentação", description: "Padrões de sono, alimentação e habilidades narrativas" },
  { number: 10, title: "Orientação e Vida Escolar", description: "Orientação tempo/espaço e desempenho escolar" },
  { number: 11, title: "Estilo Parental e Histórico Genético", description: "Práticas parentais, genética familiar e temperamento" },
];

const segurancaOptions = [
  { value: "", label: "Selecione..." },
  { value: "Sempre insegura", label: "Sempre insegura" },
  { value: "Frequentemente insegura", label: "Frequentemente insegura" },
  { value: "Às vezes me sinto insegura", label: "Às vezes me sinto insegura" },
  { value: "Frequentemente me sinto segura", label: "Frequentemente me sinto segura" },
  { value: "Sempre me sinto segura", label: "Sempre me sinto segura" },
];

const casaTipoOptions = [
  { value: "", label: "Selecione..." },
  { value: "Própria", label: "Própria" },
  { value: "Cedida", label: "Cedida" },
  { value: "Alugada", label: "Alugada" },
];

const tipoPartoOptions = [
  { value: "", label: "Selecione..." },
  { value: "Normal", label: "Normal" },
  { value: "Cesárea", label: "Cesárea" },
];

const pacienteSabeOptions = [
  { value: "", label: "Selecione..." },
  { value: "Quer", label: "Quer" },
  { value: "Não quer", label: "Não quer" },
  { value: "Não sabe", label: "Não sabe" },
];

const labelEspecialidade: Record<string, string> = {
  FISIOTERAPIA: "Ficha Fisioterapia",
  ACUPUNTURA: "Ficha Acupuntura",
  PSICOLOGIA: "Ficha Psicologia",
};

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Prontuarios() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [usuarioLogado, setUsuarioLogado] = useState<UsuarioLogado | null>(null);
  const [aba, setAba] = useState<"meus" | "outros">("meus");
  const [outrosProntuarios, setOutrosProntuarios] = useState<OutroProntuarioResumo[]>([]);
  const [loadingOutrosProntuarios, setLoadingOutrosProntuarios] = useState(true);
  const [erroOutrosProntuarios, setErroOutrosProntuarios] = useState("");
  const [detalheOutroProntuario, setDetalheOutroProntuario] = useState<ProntuarioView | null>(null);
  const [loadingOutroProntuarioId, setLoadingOutroProntuarioId] = useState<string | null>(null);
  const [erroConsultaAgendamento, setErroConsultaAgendamento] = useState("");

  const [modalType, setModalType] = useState<ModalType | null>(null);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<Agendamento | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [existingProntuarioId, setExistingProntuarioId] = useState<string | null>(null);

  // Visibilidade
  const [visibilidade, setVisibilidade] = useState<Visibilidade>(VISIBILIDADE_PADRAO);
  const [compartilhamentos, setCompartilhamentos] = useState<string[]>([]);
  const [especialidadeProntuario, setEspecialidadeProntuario] = useState<string | null>(null);
  const [usuariosCompartilhaveis, setUsuariosCompartilhaveis] = useState<UsuarioCompartilhavel[]>([]);
  // Existe registro desta beneficiária/especialidade que este usuário não pode ler.
  const [temRegistroRestrito, setTemRegistroRestrito] = useState(false);
  const [loadingAgId, setLoadingAgId] = useState<string | null>(null);
  const [resultadoAgendamento, setResultadoAgendamento] = useState<ResultadoBuscaAgendamento | null>(null);

  // Anamnese adulto
  const [currentStep, setCurrentStep] = useState(1);
  const [formAnamnese, setFormAnamnese] = useState<FormAnamnese>(initialAnamnese);

  // Anamnese criança
  const [formCrianca, setFormCrianca] = useState<FormCrianca>(initialCrianca);
  const [criancaStep, setCriancaStep] = useState(1);
  const [moradores, setMoradores] = useState<Morador[]>([]);

  // Acupuntura / Psicologia
  const [formAcupuntura, setFormAcupuntura] = useState<FormAcupuntura>(initialAcupuntura);

  // Fisioterapia
  const [formFisio, setFormFisio] = useState<FormFisioterapia>(initialFisio);
  const [fisioStep, setFisioStep] = useState(1);

  // Seletor PDF
  const [showPdfSelector, setShowPdfSelector] = useState(false);
  // Atalho de PDF direto da listagem: guarda o agendamento ate o prontuario carregar
  const [pdfDiretoAgId, setPdfDiretoAgId] = useState<string | null>(null);
  const [pdfSelectedSections, setPdfSelectedSections] = useState<Set<string>>(new Set());
  const [pdfSectionsData, setPdfSectionsData] = useState<Array<{key: string; label: string; fields: Array<{key: string; label: string}>}>>([]);
  const [pdfSelectedFields, setPdfSelectedFields] = useState<Record<string, Set<string>>>({});

  useEffect(() => {
    const usuario = getUsuario();
    if (usuario) {
      setUsuarioLogado(usuario);
      carregarAgendamentos();
      carregarOutrosProntuarios();
      carregarUsuariosCompartilhaveis();
    }
  }, []);

  // Draft para anamnese adulto
  useEffect(() => {
    if (modalType === "anamnese_adulto" && agendamentoSelecionado) {
      const draft = sessionStorage.getItem(`anamnese_draft_${agendamentoSelecionado.id}`);
      if (draft) {
        try {
          const draftData = JSON.parse(draft) as Partial<FormAnamnese>;
          setFormAnamnese((prev) => {
            const merged = { ...prev };
            (Object.keys(draftData) as Array<keyof FormAnamnese>).forEach((key) => {
              const value = draftData[key];
              if (typeof value === "string") {
                if (value.trim() !== "") merged[key] = normalizarSelecionavel(key, value) as never;
              } else if (typeof value === "boolean") {
                merged[key] = value as never;
              }
            });
            return merged;
          });
        } catch {
          // Rascunho corrompido: descarta para não reaparecer a cada abertura.
          sessionStorage.removeItem(`anamnese_draft_${agendamentoSelecionado.id}`);
        }
      }
    }
  }, [modalType, agendamentoSelecionado]);

  const carregarUsuariosCompartilhaveis = async () => {
    try {
      const res = await fetchAuth(`${API_URL}/usuarios/compartilhaveis`);
      if (!res.ok) return;
      const data = await res.json();
      setUsuariosCompartilhaveis(Array.isArray(data) ? data : []);
    } catch {
      setUsuariosCompartilhaveis([]);
    }
  };

  const carregarAgendamentos = async () => {
    try {
      const res = await fetchAuth(
        `${API_URL}/agendamentos/meus?apenas_com_beneficiaria=true`,
      );
      if (!res.ok) throw new Error(await extrairMensagemErro(res, "Não foi possível carregar os agendamentos."));
      const data = await res.json();
      if (Array.isArray(data)) setAgendamentos(data);
    } catch (err: unknown) {
      setErroConsultaAgendamento(mensagemDeErro(err, "Não foi possível carregar os agendamentos."));
    } finally {
      setLoading(false);
    }
  };

  const carregarOutrosProntuarios = async () => {
    try {
      setErroOutrosProntuarios("");
      const res = await fetchAuth(`${API_URL}/prontuarios/outros`);
      if (!res.ok) throw new Error("Erro ao buscar prontuários de outros profissionais");
      const data = await res.json();
      setOutrosProntuarios(Array.isArray(data) ? data : []);
    } catch {
      setErroOutrosProntuarios("Não foi possível carregar os prontuários de outros profissionais.");
      setOutrosProntuarios([]);
    } finally {
      setLoadingOutrosProntuarios(false);
    }
  };

  const abrirOutroProntuario = async (resumo: OutroProntuarioResumo) => {
    try {
      setErroOutrosProntuarios("");
      setLoadingOutroProntuarioId(resumo.id);
      const res = await fetchAuth(`${API_URL}/prontuarios/${resumo.id}`);
      if (!res.ok) throw new Error("Erro ao abrir prontuário de outro profissional");
      setDetalheOutroProntuario((await res.json()) as ProntuarioView);
    } catch {
      setErroOutrosProntuarios("Não foi possível abrir o prontuário de outro profissional.");
    } finally {
      setLoadingOutroProntuarioId(null);
    }
  };

  const calcularIdade = (dataNascimento?: string): string => {
    const nascimento = parseDataPura(dataNascimento);
    if (!nascimento) return "";
    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) idade -= 1;
    return String(Math.max(idade, 0));
  };

  const ehCrianca = (ag: Agendamento): boolean => {
    const dn = ag.beneficiarias?.data_nascimento;
    if (!dn) return false;
    const idade = parseInt(calcularIdade(dn), 10);
    return !isNaN(idade) && idade < 18;
  };

  const preencherBeneficiaria = (ag: Agendamento): Partial<FormAnamnese> => {
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
  };

  const fecharModal = () => {
    setModalType(null);
    setAgendamentoSelecionado(null);
    setCurrentStep(1);
    setFisioStep(1);
    setCriancaStep(1);
    setMoradores([]);
    setErrors({});
    setExistingProntuarioId(null);
    setVisibilidade(VISIBILIDADE_PADRAO);
    setCompartilhamentos([]);
    setEspecialidadeProntuario(null);
    setTemRegistroRestrito(false);
    setResultadoAgendamento(null);
    setFormAnamnese(initialAnamnese);
    setFormCrianca(initialCrianca);
    setFormAcupuntura(initialAcupuntura);
    setFormFisio(initialFisio);
  };

  const buscarProntuarioDoAgendamento = async (
    agendamento_id: string,
  ): Promise<ResultadoBuscaAgendamento> => {
    const res = await fetchAuth(
      `${API_URL}/prontuarios/agendamento/${agendamento_id}`,
    );
    if (!res.ok) throw new Error("Erro ao buscar prontuário do agendamento");
    return (await res.json()) as ResultadoBuscaAgendamento;
  };

  // Só entra no formulário o prontuário que este usuário pode ler E editar.
  // `conteudo_restrito` chega sem os campos de ficha: carregá-lo encheria o
  // formulário de vazios e um PATCH morreria no guard de autoria do backend.
  // Prontuário legível de outro profissional também fica de fora — leitura não
  // é edição.
  const ehEditavelPeloUsuario = (p: ProntuarioView) =>
    !p.conteudo_restrito && p.profissional_id === usuarioLogado?.id;

  // Carrega no estado a visibilidade do registro aberto (ou o padrão fechado).
  const aplicarVisibilidade = (
    existing: ProntuarioView | null,
    especialidadeNovoProntuario: string | null,
  ) => {
    setVisibilidade(existing?.visibilidade ?? VISIBILIDADE_PADRAO);
    setCompartilhamentos(existing?.compartilhamentos ?? []);
    setEspecialidadeProntuario(
      existing?.especialidade ?? especialidadeNovoProntuario,
    );
  };

  const abrirModalEspecialidade = async (ag: Agendamento) => {
    const esp = ag.usuarios?.especialidade ?? "";
    const espNorm = normalizarTexto(esp);
    setLoadingAgId(ag.id);
    setErrors({});
    setErroConsultaAgendamento("");

    let busca: ResultadoBuscaAgendamento;
    try {
      busca = await buscarProntuarioDoAgendamento(ag.id);
    } catch {
      setErroConsultaAgendamento("Não foi possível consultar o prontuário deste atendimento.");
      setLoadingAgId(null);
      return;
    }

    setResultadoAgendamento(busca);
    setAgendamentoSelecionado(ag);
    if (busca.estado === "RESTRITO") {
      setTemRegistroRestrito(true);
      setLoadingAgId(null);
      return;
    }

    const encontrado = busca.estado === "DISPONIVEL" ? busca.prontuario : null;
    const existing =
      encontrado && ehEditavelPeloUsuario(encontrado) ? encontrado : null;
    setTemRegistroRestrito(false);

    if (espNorm.includes("fisio")) {
      setExistingProntuarioId(existing?.id ?? null);
      aplicarVisibilidade(existing, ag.usuarios?.especialidade ?? null);
      const base: FormFisioterapia = {
        ...initialFisio,
        nome: ag.beneficiarias?.nome || "",
        idade: calcularIdade(ag.beneficiarias?.data_nascimento),
        cpf: ag.beneficiarias?.cpf || "",
        contato: ag.beneficiarias?.telefone || "",
        ocupacao: ag.beneficiarias?.ocupacao || "",
        data_assinatura: hojeInputDate(),
        assinatura: usuarioLogado?.nome || "",
      };
      if (existing?.prontuarios_fisioterapia) {
        const patch = dbParaFormStrings(
          existing.prontuarios_fisioterapia as Record<string, unknown>,
          new Set(["data_assinatura"]),
        );
        setFormFisio({ ...base, ...(patch as Partial<FormFisioterapia>) });
      } else {
        setFormFisio(base);
      }
      setFisioStep(1);
      setModalType("fisioterapia");
    } else if (espNorm.includes("acupun")) {
      setExistingProntuarioId(existing?.id ?? null);
      aplicarVisibilidade(existing, ag.usuarios?.especialidade ?? null);
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
      if (existing?.prontuarios_acupuntura) {
        const patch = dbParaFormStrings(
          existing.prontuarios_acupuntura as Record<string, unknown>,
          new Set(["data_atendimento", "data_assinatura"]),
        );
        const patchAcupuntura = patch as Record<string, string>;
        const extras = parseAcupunturaExtras(patchAcupuntura.observacoes_clinicas);
        setFormAcupuntura({
          ...base,
          ...extras,
          nome: patchAcupuntura.nome || base.nome,
          data_consulta:
            toDateInputValue(patchAcupuntura.data_atendimento)
            || toDateInputValue(patchAcupuntura.data_assinatura)
            || extras.data_consulta
            || base.data_consulta,
          historia: patchAcupuntura.queixa_principal || extras.historia || base.historia,
          tecnicas_utilizadas: extras.tecnicas_utilizadas || base.tecnicas_utilizadas,
        });
      } else {
        setFormAcupuntura(base);
      }
      setModalType("acupuntura");
    } else {
      const crianca = ehCrianca(ag);
      if (crianca) {
        setExistingProntuarioId(existing?.id ?? null);
        aplicarVisibilidade(existing, ag.usuarios?.especialidade ?? null);
        const base: FormCrianca = {
          ...initialCrianca,
          nome: ag.beneficiarias?.nome || "",
          data_nascimento: paraInputDate(ag.beneficiarias?.data_nascimento),
          profissional: usuarioLogado?.nome || "",
          idade: calcularIdade(ag.beneficiarias?.data_nascimento),
          data_atendimento: hojeInputDate(),
        };
        let loaded = base;
        if (existing?.prontuarios_psicologia_crianca) {
          const patch = dbParaFormStrings(
            existing.prontuarios_psicologia_crianca as Record<string, unknown>,
            new Set(["data_atendimento", "data_nascimento"]),
          );
          loaded = { ...base, ...(patch as Partial<FormCrianca>) };
          // Restore full form from JSON blob if available
          if (typeof patch.dados_json === "string" && patch.dados_json) {
            try {
              const fromJson = JSON.parse(patch.dados_json) as Partial<FormCrianca>;
              loaded = { ...loaded, ...fromJson };
            } catch { /* ignore parse errors */ }
          }
        }
        setFormCrianca(loaded);
        try {
          const m = loaded.familia_moradores ? JSON.parse(loaded.familia_moradores) : [];
          setMoradores(Array.isArray(m) ? m : []);
        } catch { setMoradores([]); }
        setCriancaStep(1);
        setModalType("anamnese_crianca");
      } else {
        setExistingProntuarioId(existing?.id ?? null);
        aplicarVisibilidade(existing, ag.usuarios?.especialidade ?? null);
        const base: FormAnamnese = {
          ...initialAnamnese,
          ...preencherBeneficiaria(ag),
          psicologo_estagiario: usuarioLogado?.nome || "",
        };
        if (existing?.prontuarios_psicologia_adulto) {
          const patch = dbParaFormStrings(
            existing.prontuarios_psicologia_adulto as Record<string, unknown>,
            ANAMNESE_DATE_FIELDS,
            ANAMNESE_BOOL_FIELDS,
          );
          setFormAnamnese({ ...base, ...(patch as Partial<FormAnamnese>) });
        } else {
          setFormAnamnese(base);
        }
        setCurrentStep(1);
        setModalType("anamnese_adulto");
      }
    }

    setLoadingAgId(null);
  };

  const saveDraft = (form: FormAnamnese) => {
    if (agendamentoSelecionado)
      sessionStorage.setItem(`anamnese_draft_${agendamentoSelecionado.id}`, JSON.stringify(form));
  };

  const handleAnamnese = (field: keyof FormAnamnese, value: string | boolean) => {
    setFormAnamnese((prev) => {
      const updated = { ...prev, [field]: value };
      saveDraft(updated);
      return updated;
    });
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleCheckbox = (field: CheckboxFieldKey, checked: boolean) => handleAnamnese(field, checked);

  const handleCrianca = (field: keyof FormCrianca, value: string) =>
    setFormCrianca((prev) => ({ ...prev, [field]: value }));

  const handleMoradores = (next: Morador[]) => {
    setMoradores(next);
    setFormCrianca((prev) => ({ ...prev, familia_moradores: JSON.stringify(next) }));
  };


  const handleAcupuntura = (field: keyof FormAcupuntura, value: string) =>
    setFormAcupuntura((prev) => ({ ...prev, [field]: value }));

  const handleFisio = (field: keyof FormFisioterapia, value: string) =>
    setFormFisio((prev) => ({ ...prev, [field]: value }));

  const validarStepAnamnese = (step: number): boolean => {
    const errs: Record<string, string> = {};
    if (step === 1) {
      if (!formAnamnese.data_atendimento?.trim()) errs.data_atendimento = "Data obrigatória";
      if (!formAnamnese.nome?.trim()) errs.nome = "Nome obrigatório";
    } else if (step === 2) {
      if (!formAnamnese.queixa_principal?.trim()) errs.queixa_principal = "Queixa principal obrigatória";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const salvarProntuario = async () => {
    if (!usuarioLogado || !agendamentoSelecionado) return;
    setSubmitting(true);
    try {
      let tipoData: Record<string, unknown> = {};
      let descricao: string | undefined = undefined;

      if (modalType === "anamnese_adulto") {
        tipoData = { psicologia_adulto: formAnamnese };
        descricao = formAnamnese.queixa_principal;
      } else if (modalType === "anamnese_crianca") {
        tipoData = {
          psicologia_crianca: {
            data_atendimento: formCrianca.data_atendimento,
            profissional: formCrianca.profissional,
            nome: formCrianca.nome,
            idade: formCrianca.idade,
            sexo: formCrianca.sexo,
            queixa_principal: formCrianca.queixa_principal,
            dados_json: JSON.stringify(formCrianca),
          },
        };
        descricao = formCrianca.queixa_principal;
      } else if (modalType === "fisioterapia") {
        tipoData = { fisioterapia: { ...formFisio, dor_intensidade: parseInt(formFisio.dor_intensidade) || 0 } };
        descricao = formFisio.queixa_principal;
      } else if (modalType === "acupuntura") {
        const dataConsulta = formAcupuntura.data_consulta || hojeInputDate();
        tipoData = {
          acupuntura: {
            data_atendimento: dataConsulta,
            nome: formAcupuntura.nome,
            profissional: usuarioLogado.nome,
            queixa_principal: formAcupuntura.historia,
            observacoes_clinicas: buildAcupunturaObservacoes(formAcupuntura),
            data_assinatura: dataConsulta,
          },
        };
        descricao = formAcupuntura.historia;
      }

      let res: Response;
      if (existingProntuarioId) {
        res = await fetchAuth(`${API_URL}/prontuarios/${existingProntuarioId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...(descricao ? { descricao } : {}), visibilidade, compartilhamentos, ...tipoData }),
        });
      } else {
        res = await fetchAuth(`${API_URL}/prontuarios`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            beneficiaria_id: agendamentoSelecionado.beneficiaria_id,
            agendamento_id: agendamentoSelecionado.id,
            descricao,
            visibilidade,
            compartilhamentos,
            ...tipoData,
          }),
        });
      }

      if (res.ok) {
        if (modalType === "anamnese_adulto")
          sessionStorage.removeItem(`anamnese_draft_${agendamentoSelecionado.id}`);
        fecharModal();
        carregarAgendamentos();
      } else {
        setErrors({ submit: await extrairMensagemErro(res, "Erro ao salvar prontuário.") });
      }
    } catch {
      setErrors({ submit: "Erro ao conectar com o servidor." });
    } finally {
      setSubmitting(false);
    }
  };

  // Nunca gerar PDF a partir de um payload que veio reduzido: pdfCampo e
  // pdfSecao descartam campo vazio em silêncio, então um laudo incompleto sai
  // com cara de documento completo.
  const podeGerarPdf = !temRegistroRestrito;

  const dadosPdf = {
    anamneseAdulto: formAnamnese,
    anamneseCrianca: formCrianca,
    moradores,
    fisioterapia: formFisio,
    acupuntura: formAcupuntura,
  };

  const abrirSeletorPdf = () => {
    if (!modalType || !agendamentoSelecionado || !podeGerarPdf) return;
    const nome = agendamentoSelecionado.beneficiarias?.nome || "Paciente";

    const html = gerarHtmlProntuario(modalType, dadosPdf, nome, usuarioLogado?.nome || "");

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const sections: Array<{key: string; label: string; fields: Array<{key: string; label: string}>}> = [];
    doc.querySelectorAll("[data-key]").forEach((sEl) => {
      const sKey = sEl.getAttribute("data-key") || "";
      const sLabel = PDF_SECTIONS[modalType].find((s) => s.key === sKey)?.label || sKey;
      const fields: Array<{key: string; label: string}> = [];
      sEl.querySelectorAll("[data-field]").forEach((fEl) => {
        const fKey = fEl.getAttribute("data-field") || "";
        const labelEl = fEl.querySelector("label");
        const fLabel = labelEl?.textContent?.trim() || fKey;
        if (fKey) fields.push({ key: fKey, label: fLabel });
      });
      if (sKey) sections.push({ key: sKey, label: sLabel, fields });
    });

    const allSections = new Set(sections.map((s) => s.key));
    const allFields: Record<string, Set<string>> = {};
    sections.forEach((s) => { allFields[s.key] = new Set(s.fields.map((f) => f.key)); });

    setPdfSectionsData(sections);
    setPdfSelectedSections(allSections);
    setPdfSelectedFields(allFields);
    setShowPdfSelector(true);
  };

  // Atalho de PDF a partir da coluna de acoes: abrirModalEspecialidade carrega o
  // prontuario de forma assincrona, entao o seletor so pode abrir depois que o
  // modalType e os formularios ja estiverem preenchidos.
  useEffect(() => {
    if (!pdfDiretoAgId) return;
    if (!agendamentoSelecionado || agendamentoSelecionado.id !== pdfDiretoAgId) return;
    if (!modalType) {
      if (temRegistroRestrito || erroConsultaAgendamento) setPdfDiretoAgId(null);
      return;
    }
    if (podeGerarPdf) abrirSeletorPdf();
    setPdfDiretoAgId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfDiretoAgId, modalType, agendamentoSelecionado, podeGerarPdf, temRegistroRestrito, erroConsultaAgendamento]);

  const imprimirDaListagem = (ag: Agendamento) => {
    setPdfDiretoAgId(ag.id);
    void abrirModalEspecialidade(ag);
  };

  const imprimirProntuario = (selectedSections: Set<string>, selectedFields: Record<string, Set<string>>) => {
    if (!agendamentoSelecionado) return;
    const nome = agendamentoSelecionado.beneficiarias?.nome || "Paciente";
    const sel = [...selectedSections];
    const flds: Record<string, string[]> = {};
    Object.entries(selectedFields).forEach(([k, v]) => { flds[k] = [...v]; });

    if (!modalType) return;
    const html = gerarHtmlProntuario(modalType, dadosPdf, nome, usuarioLogado?.nome || "", sel, flds);
    if (!html) return;
    abrirImpressao(html);
  };

  const formatarDataHora = (iso: string) =>
    formatarTimestamp(iso, {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  // Só o autor gerencia visibilidade. Aqui ou o prontuário é novo (o autor é
  // quem está preenchendo), ou é um dos que ehEditavelPeloUsuario deixou passar.
  const blocoVisibilidade = (
    <div style={{ marginTop: "24px", display: "grid", gap: "12px" }}>
      {temRegistroRestrito && (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: "16px",
            background: "#FDE8E4",
            border: "0.5px solid #F4CFC9",
            fontSize: "12px",
            color: "#C05A48",
            lineHeight: 1.5,
          }}
        >
          Esta beneficiária tem registro clínico que você não pode ler. A geração
          de PDF fica indisponível aqui — um documento montado sem esse conteúdo
          sairia incompleto sem avisar.
        </div>
      )}
      <VisibilidadeSelector
        visibilidade={visibilidade}
        onVisibilidadeChange={setVisibilidade}
        compartilhamentos={compartilhamentos}
        onCompartilhamentosChange={setCompartilhamentos}
        especialidade={especialidadeProntuario}
        usuarios={usuariosCompartilhaveis}
        autorId={usuarioLogado?.id}
      />
    </div>
  );

  const stepAnamnese = stepsAnamnese[currentStep - 1];
  const stepFisio = stepsFisio[fisioStep - 1];
  const stepCrianca = stepsCrianca[criancaStep - 1];
  const avisoProntuarioAusente = resultadoAgendamento?.estado === "AUSENTE" ? (
    <div style={{ margin: "16px 24px 0", padding: "10px 14px", borderRadius: "10px", background: "#F4F1EC", color: "#6B5E54", fontSize: "12px", fontWeight: 600 }}>
      Nenhum prontuário registrado.
    </div>
  ) : null;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: "36px 32px", minHeight: "100vh", backgroundColor: "#faf9f6" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#2B1F14", margin: 0 }}>
            Meus Prontuários
          </h1>
          <p style={{ fontSize: "13px", color: "#6B5E54", marginTop: "4px" }}>
            Visualize seus agendamentos e crie prontuários
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          {([
            ["meus", "Meus atendimentos"],
            ["outros", "Outros prontuários"],
          ] as const).map(([valor, rotulo]) => (
            <button
              key={valor}
              type="button"
              onClick={() => setAba(valor)}
              style={{
                padding: "9px 14px",
                borderRadius: "8px",
                border: aba === valor ? "1px solid #E07A6E" : "1px solid #D8CFC5",
                background: aba === valor ? "#FDF0EE" : "#FFF",
                color: aba === valor ? "#A9473C" : "#6B5E54",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {rotulo}
            </button>
          ))}
        </div>

        {aba === "meus" ? (
        <div style={{ background: "#fff", borderRadius: "16px", border: "0.5px solid #d2c3b2", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          {erroConsultaAgendamento && (
            <div role="alert" style={{ padding: "12px 20px", background: "#FDE8E4", color: "#A9473C", fontSize: "12px" }}>
              {erroConsultaAgendamento}
            </div>
          )}
          {loading ? (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", border: "2.5px solid #e0dbd2", borderTopColor: "#E07A6E", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
              <p style={{ fontSize: "13px", color: "#9B8E84" }}>Carregando agendamentos...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : agendamentos.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <p style={{ fontSize: "13px", color: "#9B8E84", fontWeight: 600 }}>Nenhum agendamento registrado</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "0.5px solid #e0dbd2", fontSize: "10px", color: "#9B8E84", textAlign: "left", background: "#faf9f6" }}>
                  <th style={{ padding: "12px 20px", fontWeight: 700 }}>BENEFICIÁRIA</th>
                  <th style={{ padding: "12px 20px", fontWeight: 700 }}>DATA/HORA</th>
                  <th style={{ padding: "12px 20px", fontWeight: 700 }}>ESPECIALIDADE</th>
                  <th style={{ padding: "12px 20px", fontWeight: 700 }}>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {agendamentos.map((ag) => {
                  const esp = ag.usuarios?.especialidade ?? "Sem especialidade";
                  const espNorm = normalizarTexto(esp);
                  const labelBtn = espNorm.includes("psicol")
                    ? (ehCrianca(ag) ? "Anamnese Criança" : "Anamnese Adulto")
                    : (labelEspecialidade[esp.toUpperCase()] || `Ficha ${esp}`);
                  const isLoadingRow = loadingAgId === ag.id;
                  return (
                    <tr key={ag.id}
                      style={{ borderBottom: "0.5px solid #f0ece4", fontSize: "13px", transition: "background 0.1s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#faf9f6")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "14px 20px", fontWeight: 600, color: "#2B1F14" }}>
                        {ag.beneficiarias?.nome || "—"}
                      </td>
                      <td style={{ padding: "14px 20px", color: "#6B5E54", fontSize: "12px" }}>
                        {formatarDataHora(ag.data_hora)}
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ display: "inline-block", background: "#f0f0f0", color: "#6B5E54", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 500 }}>
                          {esp}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button
                          onClick={() => abrirModalEspecialidade(ag)}
                          disabled={!!loadingAgId || !ag.beneficiaria_id}
                          title={!ag.beneficiaria_id ? "Agendamento sem beneficiária vinculada" : undefined}
                          style={{ background: "#E07A6E", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: (loadingAgId || !ag.beneficiaria_id) ? "not-allowed" : "pointer", opacity: (loadingAgId || !ag.beneficiaria_id) ? 0.6 : 1 }}
                        >
                          {isLoadingRow ? "Carregando..." : labelBtn}
                        </button>
                        <button
                          type="button"
                          onClick={() => imprimirDaListagem(ag)}
                          disabled={!!loadingAgId || !ag.beneficiaria_id}
                          title="Imprimir PDF"
                          aria-label="Imprimir PDF"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "30px",
                            height: "30px",
                            flexShrink: 0,
                            background: "transparent",
                            border: "1px solid #e8ded3",
                            borderRadius: "6px",
                            color: "#6B5E54",
                            cursor: (loadingAgId || !ag.beneficiaria_id) ? "not-allowed" : "pointer",
                            opacity: (loadingAgId || !ag.beneficiaria_id) ? 0.5 : 1,
                          }}
                        >
                          <Printer size={14} />
                        </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: "16px", border: "0.5px solid #d2c3b2", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            {erroOutrosProntuarios && (
              <div role="alert" style={{ padding: "12px 20px", background: "#FDE8E4", color: "#A9473C", fontSize: "12px" }}>
                {erroOutrosProntuarios}
              </div>
            )}
            {loadingOutrosProntuarios ? (
              <div style={{ padding: "48px 20px", textAlign: "center", color: "#9B8E84", fontSize: "13px" }}>
                Carregando prontuários de outros profissionais...
              </div>
            ) : outrosProntuarios.length === 0 ? (
              <div style={{ padding: "48px 20px", textAlign: "center", color: "#9B8E84", fontSize: "13px", fontWeight: 600 }}>
                Nenhum prontuário de outros profissionais está acessível para você.
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "0.5px solid #e0dbd2", fontSize: "10px", color: "#9B8E84", textAlign: "left", background: "#faf9f6" }}>
                    <th style={{ padding: "12px 20px" }}>BENEFICIÁRIA</th>
                    <th style={{ padding: "12px 20px" }}>AUTOR</th>
                    <th style={{ padding: "12px 20px" }}>ESPECIALIDADE</th>
                    <th style={{ padding: "12px 20px" }}>ACESSO</th>
                    <th style={{ padding: "12px 20px" }}>DATA</th>
                    <th style={{ padding: "12px 20px" }}>AÇÕES</th>
                  </tr>
                </thead>
                <tbody>
                  {outrosProntuarios.map((item) => (
                    <tr key={item.id} style={{ borderBottom: "0.5px solid #f0ece4", fontSize: "13px" }}>
                      <td style={{ padding: "14px 20px", fontWeight: 600 }}>{item.beneficiarias.nome}</td>
                      <td style={{ padding: "14px 20px", color: "#6B5E54" }}>{item.usuarios.nome}</td>
                      <td style={{ padding: "14px 20px", color: "#6B5E54" }}>{nomeEspecialidade(item.especialidade)}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ display: "inline-block", padding: "4px 9px", borderRadius: "999px", background: "#F1EEE8", color: "#6B5E54", fontSize: "11px", fontWeight: 700, whiteSpace: "nowrap" }}>
                          {rotuloOrigemAcesso(item)}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px", color: "#6B5E54" }}>
                        {item.criado_em ? formatarDataHora(item.criado_em) : "—"}
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <button
                          type="button"
                          onClick={() => abrirOutroProntuario(item)}
                          disabled={loadingOutroProntuarioId !== null}
                          style={{ background: "#E07A6E", color: "#fff", border: 0, padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                        >
                          {loadingOutroProntuarioId === item.id ? "Abrindo..." : "Abrir"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {detalheOutroProntuario && (
        <Modal
          titulo={`Prontuário — ${detalheOutroProntuario.beneficiarias?.nome || "Beneficiária"}`}
          subtitulo="Somente leitura"
          onClose={() => setDetalheOutroProntuario(null)}
        >
          <ProntuarioSomenteLeitura prontuario={detalheOutroProntuario} />
        </Modal>
      )}

      {resultadoAgendamento?.estado === "RESTRITO" && agendamentoSelecionado && (
        <Modal
          titulo={`Prontuário — ${agendamentoSelecionado.beneficiarias?.nome || "Beneficiária"}`}
          subtitulo="Registro existente — conteúdo restrito"
          onClose={fecharModal}
        >
          <div style={{ padding: "24px" }}>
            <CarimboRestrito
              profissional={resultadoAgendamento.prontuario.profissional}
              especialidade={resultadoAgendamento.prontuario.especialidade}
            />
          </div>
        </Modal>
      )}

      {/* ── Modal Anamnese Adulto ─────────────────────────────────────────────── */}
      {modalType === "anamnese_adulto" && agendamentoSelecionado && (
        <Modal titulo={agendamentoSelecionado.beneficiarias?.nome ? `Anamnese Adulto — ${agendamentoSelecionado.beneficiarias.nome}` : "Anamnese Adulto"} subtitulo={stepAnamnese.title} onClose={fecharModal}>
          {avisoProntuarioAusente}
          <ProgressBar total={6} current={currentStep} descricao={stepAnamnese.description} />
          <ModalBody errors={errors}>

            {currentStep === 1 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <SectionTitle>Informações do Atendimento</SectionTitle>
                <Field label="Data do Atendimento *" error={errors.data_atendimento} type="date" value={formAnamnese.data_atendimento} onChange={(v) => handleAnamnese("data_atendimento", v)} />
                <Field label="Psicólogo/Estagiário" value={formAnamnese.psicologo_estagiario} onChange={(v) => handleAnamnese("psicologo_estagiario", v)} disabled />

                <SectionTitle>Identificação do Paciente</SectionTitle>
                <Field label="Nome *" error={errors.nome} value={formAnamnese.nome} onChange={(v) => handleAnamnese("nome", v)} gridSpan={2} />
                <Field label="Data de Nascimento" type="date" value={formAnamnese.data_nascimento} onChange={(v) => handleAnamnese("data_nascimento", v)} />
                <Field label="Idade" value={formAnamnese.idade} onChange={(v) => handleAnamnese("idade", v)} />
                <Field label="Sexo" value={formAnamnese.sexo} onChange={(v) => handleAnamnese("sexo", v)} options={sexoOptions} />
                <Field label="Nacionalidade" value={formAnamnese.nacionalidade} onChange={(v) => handleAnamnese("nacionalidade", v)} />
                <Field label="Estado Civil" value={formAnamnese.civil} onChange={(v) => handleAnamnese("civil", v)} options={estadoCivilOptions} />
                <Field label="Telefone" value={formAnamnese.telefone} onChange={(v) => handleAnamnese("telefone", v)} />
                <Field label="Residência (Endereço)" value={formAnamnese.residencia} onChange={(v) => handleAnamnese("residencia", v)} gridSpan={2} />

                <SectionTitle>Aspectos Sociais e Profissionais</SectionTitle>
                <Field label="Escolaridade" value={formAnamnese.escolaridade} onChange={(v) => handleAnamnese("escolaridade", v)} options={escolaridadeOptions} />
                <Field label="Ocupação Atual" value={formAnamnese.ocupacao} onChange={(v) => handleAnamnese("ocupacao", v)} />
                <Field label="Profissão (Formação)" value={formAnamnese.profissao} onChange={(v) => handleAnamnese("profissao", v)} />
                <div />
                <Field label="Desempregado?" value={formAnamnese.desempregado} onChange={(v) => handleAnamnese("desempregado", v)} options={desempregadoOptions} />
                {formAnamnese.desempregado === "Sim" && (
                  <Field label="Tempo Desemprego" value={formAnamnese.tempo_desemprego} onChange={(v) => handleAnamnese("tempo_desemprego", v)} />
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
                <SectionTitle>Queixa e Demanda Atual</SectionTitle>
                <Field label="Queixa Principal *" error={errors.queixa_principal} value={formAnamnese.queixa_principal} onChange={(v) => handleAnamnese("queixa_principal", v)} textarea />
                <Field label="Queixa Secundária" value={formAnamnese.queixa_secundaria} onChange={(v) => handleAnamnese("queixa_secundaria", v)} textarea />
                <Field label="Sintomas" value={formAnamnese.sintomas} onChange={(v) => handleAnamnese("sintomas", v)} textarea />
                <Field label="Expectativas e Objetivos com a Terapia" value={formAnamnese.expectativas_objetivos} onChange={(v) => handleAnamnese("expectativas_objetivos", v)} textarea />

                <SectionTitle>Histórico de Saúde e Hábitos</SectionTitle>
                <Field label="Psicoterapia Anterior" value={formAnamnese.psicoterapia_anterior} onChange={(v) => handleAnamnese("psicoterapia_anterior", v)} textarea />
                <Field label="Doenças / Transtornos Psiquiátricos" value={formAnamnese.doencas_transtornos} onChange={(v) => handleAnamnese("doencas_transtornos", v)} textarea />
                <Field label="Patologia Pregressa" value={formAnamnese.patologia_pregressa} onChange={(v) => handleAnamnese("patologia_pregressa", v)} textarea />
                <div style={{ background: "#f9f9f9", padding: "12px", borderRadius: "8px", border: "1px solid #e0dbd2", display: "grid", gap: "12px" }}>
                  <Field label="Uso de Medicamentos" value={formAnamnese.medicamentos} onChange={(v) => handleAnamnese("medicamentos", v)} textarea />
                  <Field label="Uso de Drogas / Substâncias" value={formAnamnese.uso_drogas} onChange={(v) => handleAnamnese("uso_drogas", v)} textarea />
                  <Field label="Ideação Suicida" value={formAnamnese.ideacao_suicida} onChange={(v) => handleAnamnese("ideacao_suicida", v)} textarea />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
                <SectionTitle>Histórico Pessoal e Rotina</SectionTitle>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <Field label="Infância" value={formAnamnese.historico_infancia} onChange={(v) => handleAnamnese("historico_infancia", v)} textarea />
                  <Field label="Adolescência" value={formAnamnese.adolescencia} onChange={(v) => handleAnamnese("adolescencia", v)} textarea />
                </div>
                <Field label="Rotina Diária" value={formAnamnese.rotina} onChange={(v) => handleAnamnese("rotina", v)} textarea />
                <Field label="Dinâmica de Trabalho" value={formAnamnese.trabalho} onChange={(v) => handleAnamnese("trabalho", v)} textarea />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <Field label="Vícios ou Hábitos" value={formAnamnese.vicios} onChange={(v) => handleAnamnese("vicios", v)} textarea />
                  <Field label="Hobbies e Lazer" value={formAnamnese.hobbies} onChange={(v) => handleAnamnese("hobbies", v)} textarea />
                </div>

                <SectionTitle>Histórico Familiar e Social</SectionTitle>
                <Field label="Composição do Lar" value={formAnamnese.lar} onChange={(v) => handleAnamnese("lar", v)} textarea />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <Field label="Pais/Cuidadores" value={formAnamnese.pais_cuidadores} onChange={(v) => handleAnamnese("pais_cuidadores", v)} textarea />
                  <Field label="Irmãos" value={formAnamnese.irmaos} onChange={(v) => handleAnamnese("irmaos", v)} textarea />
                  <Field label="Cônjuge" value={formAnamnese.conjuge} onChange={(v) => handleAnamnese("conjuge", v)} textarea />
                  <Field label="Filhos" value={formAnamnese.filhos} onChange={(v) => handleAnamnese("filhos", v)} textarea />
                </div>
                <Field label="Relacionamentos Atuais" value={formAnamnese.relacionamentos_atuais} onChange={(v) => handleAnamnese("relacionamentos_atuais", v)} textarea />
              </div>
            )}

            {currentStep === 4 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
                <SectionTitle>Aspectos Gerais</SectionTitle>
                <Field label="Aparência" value={formAnamnese.aparencia} onChange={(v) => handleAnamnese("aparencia", v)} textarea />
                <Field label="Comportamento Geral" value={formAnamnese.comportamento} onChange={(v) => handleAnamnese("comportamento", v)} textarea />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <Field label="Atitude com o entrevistador" value={formAnamnese.atitude_entrevistador} onChange={(v) => handleAnamnese("atitude_entrevistador", v)} options={atitudeOptions} />
                </div>

                <SectionTitle>Orientação</SectionTitle>
                <div style={{ background: "#f9f9f9", padding: "16px", borderRadius: "8px", border: "1px solid #e0dbd2" }}>
                  <label style={labelStyle}>O paciente encontra-se orientado de forma:</label>
                  <CheckboxGroup items={[
                    { key: "orientacao_autoidentificatoria", label: "Autoidentificatória (sabe quem é)" },
                    { key: "orientacao_corporal", label: "Corporal (reconhece o próprio corpo)" },
                    { key: "orientacao_temporal", label: "Temporal (sabe data, hora, ano)" },
                    { key: "orientacao_espacial", label: "Espacial (sabe onde está)" },
                    { key: "orientacao_patologia", label: "Em relação à patologia (sabe por que está ali)" },
                  ]} form={formAnamnese} onChange={handleCheckbox} />
                </div>
                <Field label="Observações sobre Orientação" value={formAnamnese.orientacao_observacoes} onChange={(v) => handleAnamnese("orientacao_observacoes", v)} textarea />

                <SectionTitle>Atenção e Funções Cognitivas</SectionTitle>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <Field label="Atenção — Vigilância (capacidade de focar)" value={formAnamnese.atencao_vigilancia} onChange={(v) => handleAnamnese("atencao_vigilancia", v)} textarea />
                  <Field label="Atenção — Tenacidade (capacidade de manter o foco)" value={formAnamnese.atencao_tenacidade} onChange={(v) => handleAnamnese("atencao_tenacidade", v)} textarea />
                  <Field label="Memória (imediata, recente, remota)" value={formAnamnese.memoria} onChange={(v) => handleAnamnese("memoria", v)} textarea />
                  <Field label="Inteligência (aparente/estimada)" value={formAnamnese.inteligencia} onChange={(v) => handleAnamnese("inteligencia", v)} textarea />
                </div>

                <SectionTitle>Sensopercepção</SectionTitle>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <Field label="Sensopercepção" value={formAnamnese.sensopercpcao} onChange={(v) => handleAnamnese("sensopercpcao", v)} options={sensopercpcaoOptions} />
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
                <SectionTitle>Pensamento e Conteúdo</SectionTitle>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                  <div style={{ background: "#f9f9f9", padding: "16px", borderRadius: "8px", border: "1px solid #e0dbd2" }}>
                    <label style={labelStyle}>Curso do Pensamento:</label>
                    <CheckboxGroup items={[
                      { key: "pensamento_acelerado", label: "Acelerado" },
                      { key: "pensamento_retardado", label: "Retardado" },
                      { key: "pensamento_fuga", label: "Fuga de Ideias" },
                      { key: "pensamento_bloqueio", label: "Bloqueio" },
                      { key: "pensamento_prolixo", label: "Prolixo" },
                      { key: "pensamento_repeticao", label: "Repetição" },
                    ]} form={formAnamnese} onChange={handleCheckbox} />
                  </div>
                  <div style={{ background: "#f9f9f9", padding: "16px", borderRadius: "8px", border: "1px solid #e0dbd2" }}>
                    <label style={labelStyle}>Conteúdo Predominante:</label>
                    <CheckboxGroup items={[
                      { key: "conteudo_obsessoes", label: "Obsessões" },
                      { key: "conteudo_hipocondrias", label: "Hipocondrias" },
                      { key: "conteudo_fobias", label: "Fobias" },
                      { key: "conteudo_delirios", label: "Delírios" },
                    ]} form={formAnamnese} onChange={handleCheckbox} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginTop: "8px" }}>
                  <div style={{ background: "#f9f9f9", padding: "12px", borderRadius: "8px", border: "1px solid #e0dbd2" }}>
                    <label style={labelStyle}>Expansão do Eu:</label>
                    <MultiSelectGroup value={formAnamnese.expansao_eu_opcoes} options={expansaoEuOptions} onChange={(v) => handleAnamnese("expansao_eu_opcoes", v)} />
                  </div>
                  <div style={{ background: "#f9f9f9", padding: "12px", borderRadius: "8px", border: "1px solid #e0dbd2" }}>
                    <label style={labelStyle}>Retração do Eu:</label>
                    <MultiSelectGroup value={formAnamnese.retracao_eu_opcoes} options={retracaoEuOptions} onChange={(v) => handleAnamnese("retracao_eu_opcoes", v)} />
                  </div>
                  <div style={{ background: "#f9f9f9", padding: "12px", borderRadius: "8px", border: "1px solid #e0dbd2" }}>
                    <label style={labelStyle}>Negação do Eu:</label>
                    <MultiSelectGroup value={formAnamnese.negacao_eu_opcoes} options={negacaoEuOptions} onChange={(v) => handleAnamnese("negacao_eu_opcoes", v)} />
                  </div>
                </div>

                <SectionTitle>Linguagem e Afetividade</SectionTitle>
                <div style={{ background: "#f9f9f9", padding: "12px", borderRadius: "8px", border: "1px solid #e0dbd2" }}>
                  <label style={labelStyle}>Distúrbios de Linguagem:</label>
                  <MultiSelectGroup value={formAnamnese.linguagem_disturbios} options={linguagemOptions} onChange={(v) => handleAnamnese("linguagem_disturbios", v)} />
                </div>
                <Field label="Afetividade" value={formAnamnese.afetividade} onChange={(v) => handleAnamnese("afetividade", v)} textarea />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <Field label="Humor" value={formAnamnese.humor_opcoes} onChange={(v) => handleAnamnese("humor_opcoes", v)} options={humorOptions} />
                  <Field label="Consciência da Doença Atual" value={formAnamnese.consciencia_doenca} onChange={(v) => handleAnamnese("consciencia_doenca", v)} options={conscienciaDoencaOptions} />
                </div>
              </div>
            )}

            {currentStep === 6 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
                <SectionTitle>Síntese e Conclusão</SectionTitle>
                <Field label="Observação / Linguagem Não Verbal" value={formAnamnese.observacao_linguagem_nao_verbal} onChange={(v) => handleAnamnese("observacao_linguagem_nao_verbal", v)} textarea />
                <Field label="Observações Finais e Conduta" value={formAnamnese.observacoes_finais} onChange={(v) => handleAnamnese("observacoes_finais", v)} textarea />
                {blocoVisibilidade}
              </div>
            )}
          </ModalBody>
          <ModalFooter
            onBack={currentStep > 1 ? () => setCurrentStep((s) => s - 1) : undefined}
            onNext={currentStep < 6 ? () => { if (validarStepAnamnese(currentStep)) setCurrentStep((s) => s + 1); } : undefined}
            onSave={currentStep === 6 ? salvarProntuario : undefined}
            onPrint={currentStep === 6 && podeGerarPdf ? abrirSeletorPdf : undefined}
            submitting={submitting}
            isUpdate={!!existingProntuarioId}
          />
        </Modal>
      )}

      {/* ── Modal Anamnese Criança ────────────────────────────────────────────── */}
      {modalType === "anamnese_crianca" && agendamentoSelecionado && (
        <Modal titulo={`Anamnese Criança — ${agendamentoSelecionado.beneficiarias?.nome}`} subtitulo={stepCrianca.title} onClose={fecharModal}>
          {avisoProntuarioAusente}
          <ProgressBar total={11} current={criancaStep} descricao={stepCrianca.description} />
          <ModalBody errors={errors}>

            {/* ─ Step 1: Dados Pessoais + Responsável Legal ─ */}
            {criancaStep === 1 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <SectionTitle>Informações do Atendimento</SectionTitle>
                <Field label="Data do Atendimento" type="date" value={formCrianca.data_atendimento} onChange={(v) => handleCrianca("data_atendimento", v)} />
                <Field label="Profissional" value={formCrianca.profissional} onChange={(v) => handleCrianca("profissional", v)} disabled />

                <SectionTitle>Dados Pessoais</SectionTitle>
                <Field label="Nome" value={formCrianca.nome} onChange={(v) => handleCrianca("nome", v)} gridSpan={2} />
                <Field label="Data de Nascimento" type="date" value={formCrianca.data_nascimento} onChange={(v) => handleCrianca("data_nascimento", v)} />
                <Field label="Idade" value={formCrianca.idade} onChange={(v) => handleCrianca("idade", v)} />
                <Field label="Sexo" value={formCrianca.sexo} onChange={(v) => handleCrianca("sexo", v)} options={sexoOptions} />
                <Field label="Ano Escolar" value={formCrianca.ano_escolar} onChange={(v) => handleCrianca("ano_escolar", v)} />
                <Field label="Religião" value={formCrianca.religiao} onChange={(v) => handleCrianca("religiao", v)} gridSpan={2} />

                <SectionTitle>Responsável Legal</SectionTitle>
                <Field label="Nome do Responsável" value={formCrianca.resp_nome} onChange={(v) => handleCrianca("resp_nome", v)} gridSpan={2} />
                <Field label="Parentesco" value={formCrianca.resp_parentesco} onChange={(v) => handleCrianca("resp_parentesco", v)} />
                <Field label="Pai/Mãe através de adoção?" value={formCrianca.resp_adocao} onChange={(v) => handleCrianca("resp_adocao", v)} options={simNaoOptions} />
                <Field label="Idade do Responsável" value={formCrianca.resp_idade} onChange={(v) => handleCrianca("resp_idade", v)} />
                <Field label="Escolaridade" value={formCrianca.resp_escolaridade} onChange={(v) => handleCrianca("resp_escolaridade", v)} options={escolaridadeOptions} />
                <Field label="Profissão" value={formCrianca.resp_profissao} onChange={(v) => handleCrianca("resp_profissao", v)} />
                <Field label="CPF ou RG" value={formCrianca.resp_cpf_rg} onChange={(v) => handleCrianca("resp_cpf_rg", v)} />
              </div>
            )}

            {/* ─ Step 2: Informante + Disponibilidade ─ */}
            {criancaStep === 2 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <SectionTitle>Informante da Anamnese</SectionTitle>
                <Field label="Parentesco com o paciente" value={formCrianca.info_parentesco} onChange={(v) => handleCrianca("info_parentesco", v)} />
                <Field label="Endereço" value={formCrianca.info_endereco} onChange={(v) => handleCrianca("info_endereco", v)} />
                <Field label="Contatos" value={formCrianca.info_contatos} onChange={(v) => handleCrianca("info_contatos", v)} />
                <Field label="Tem algum outro familiar atendido por mim?" value={formCrianca.info_familiar_atendido} onChange={(v) => handleCrianca("info_familiar_atendido", v)} />

                <SectionTitle>Disponibilidade para Atendimento</SectionTitle>
                <div style={{ gridColumn: "1 / -1" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                    <thead>
                      <tr style={{ background: "#faf9f6", borderBottom: "0.5px solid #e0dbd2" }}>
                        <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "#2B1F14", width: "40%" }}>Dia da Semana</th>
                        <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "#2B1F14" }}>Horário disponível</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { key: "disp_segunda" as keyof FormCrianca, dia: "Segunda-feira" },
                        { key: "disp_terca" as keyof FormCrianca, dia: "Terça-feira" },
                        { key: "disp_quarta" as keyof FormCrianca, dia: "Quarta-feira" },
                        { key: "disp_quinta" as keyof FormCrianca, dia: "Quinta-feira" },
                        { key: "disp_sexta" as keyof FormCrianca, dia: "Sexta-feira" },
                        { key: "disp_sabado" as keyof FormCrianca, dia: "Sábado" },
                      ].map(({ key, dia }) => (
                        <tr key={key} style={{ borderBottom: "0.5px solid #f0ece4" }}>
                          <td style={{ padding: "8px 12px", color: "#6B5E54", fontWeight: 600 }}>{dia}</td>
                          <td style={{ padding: "6px 12px" }}>
                            <input
                              type="text"
                              value={formCrianca[key] as string}
                              onChange={(e) => handleCrianca(key, e.target.value)}
                              placeholder="Ex: 14h às 18h"
                              style={{ width: "100%", padding: "6px 10px", border: "0.5px solid #d6d0c4", borderRadius: "6px", fontSize: "12px", fontFamily: "inherit" }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ─ Step 3: Queixa ─ */}
            {criancaStep === 3 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
                <SectionTitle>Queixa</SectionTitle>
                <Field label="De quem partiu o interesse/procura pela Psicoterapia?" value={formCrianca.queixa_origem} onChange={(v) => handleCrianca("queixa_origem", v)} textarea />
                <Field label="Se houve encaminhamento de outro profissional, de qual foi?" value={formCrianca.queixa_encaminhamento} onChange={(v) => handleCrianca("queixa_encaminhamento", v)} textarea />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <Field label="O paciente sabe do atendimento?" value={formCrianca.queixa_paciente_sabe} onChange={(v) => handleCrianca("queixa_paciente_sabe", v)} options={pacienteSabeOptions} />
                  {formCrianca.queixa_paciente_sabe === "Não sabe" && (
                    <Field label="Por que não sabe?" value={formCrianca.queixa_paciente_sabe_obs} onChange={(v) => handleCrianca("queixa_paciente_sabe_obs", v)} />
                  )}
                </div>
                <Field label="Qual o motivo principal da procura? (como, quando, onde, com quem, desde quando)" value={formCrianca.queixa_principal} onChange={(v) => handleCrianca("queixa_principal", v)} textarea />
              </div>
            )}

            {/* ─ Step 4: Família e Moradia ─ */}
            {criancaStep === 4 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <SectionTitle>Família e Moradia</SectionTitle>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Quem reside na casa (adicione um por vez):</label>
                  {moradores.map((m, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "8px", marginBottom: "8px", alignItems: "end" }}>
                      <div>
                        <label style={{ fontSize: "10px", fontWeight: 700, color: "#9B8E84", display: "block", marginBottom: "3px" }}>Nome</label>
                        <input value={m.nome} onChange={(e) => { const n = [...moradores]; n[i] = { ...n[i], nome: e.target.value }; handleMoradores(n); }} style={{ width: "100%", padding: "8px 10px", border: "0.5px solid #d6d0c4", borderRadius: "6px", fontSize: "12px", fontFamily: "inherit" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: "10px", fontWeight: 700, color: "#9B8E84", display: "block", marginBottom: "3px" }}>Parentesco</label>
                        <input value={m.parentesco} onChange={(e) => { const n = [...moradores]; n[i] = { ...n[i], parentesco: e.target.value }; handleMoradores(n); }} style={{ width: "100%", padding: "8px 10px", border: "0.5px solid #d6d0c4", borderRadius: "6px", fontSize: "12px", fontFamily: "inherit" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: "10px", fontWeight: 700, color: "#9B8E84", display: "block", marginBottom: "3px" }}>Idade</label>
                        <input value={m.idade} onChange={(e) => { const n = [...moradores]; n[i] = { ...n[i], idade: e.target.value }; handleMoradores(n); }} style={{ width: "100%", padding: "8px 10px", border: "0.5px solid #d6d0c4", borderRadius: "6px", fontSize: "12px", fontFamily: "inherit" }} />
                      </div>
                      <button type="button" aria-label="Remover morador" onClick={() => handleMoradores(moradores.filter((_, j) => j !== i))} style={{ background: "#fef2f2", color: "#DC2626", border: "1px solid #fca5a5", borderRadius: "6px", padding: "8px 10px", fontSize: "11px", cursor: "pointer", fontWeight: 700 }}>✕</button>
                    </div>
                  ))}
                  <button onClick={() => handleMoradores([...moradores, { nome: "", parentesco: "", idade: "" }])} style={{ background: "#f0f5f0", color: "#4a7a4e", border: "1px solid #c5dbc6", borderRadius: "6px", padding: "7px 14px", fontSize: "12px", cursor: "pointer", fontWeight: 600, marginTop: "4px" }}>
                    + Adicionar morador
                  </button>
                </div>

                <Field label="Renda familiar" value={formCrianca.familia_renda} onChange={(v) => handleCrianca("familia_renda", v)} gridSpan={2} />
                <Field label="O paciente possui cuidador/babá?" value={formCrianca.familia_cuidador} onChange={(v) => handleCrianca("familia_cuidador", v)} options={simNaoOptions} />
                <Field label="Quais membros da família trabalham?" value={formCrianca.familia_membros_trabalham} onChange={(v) => handleCrianca("familia_membros_trabalham", v)} />
                <Field label="Recebe auxílio governamental?" value={formCrianca.familia_auxilio} onChange={(v) => handleCrianca("familia_auxilio", v)} options={simNaoOptions} />
                <Field label="Se pais separados, ambos são provedores do sustento dos filhos?" value={formCrianca.familia_pais_provedores} onChange={(v) => handleCrianca("familia_pais_provedores", v)} options={simNaoOptions} />
                <Field label="A casa é:" value={formCrianca.familia_casa_tipo} onChange={(v) => handleCrianca("familia_casa_tipo", v)} options={casaTipoOptions} />
                <Field label="Valor do aluguel ou financiamento" value={formCrianca.familia_valor_aluguel} onChange={(v) => handleCrianca("familia_valor_aluguel", v)} />
                <Field label="A rua é pavimentada?" value={formCrianca.familia_rua_pavimentada} onChange={(v) => handleCrianca("familia_rua_pavimentada", v)} options={simNaoOptions} />
                <Field label="Tem acesso à água encanada e energia elétrica?" value={formCrianca.familia_agua_energia} onChange={(v) => handleCrianca("familia_agua_energia", v)} options={simNaoOptions} />
                <Field label="Sensação de segurança no bairro" value={formCrianca.familia_seguranca} onChange={(v) => handleCrianca("familia_seguranca", v)} options={segurancaOptions} gridSpan={2} />
                <Field label="Paciente dorme na própria cama?" value={formCrianca.familia_cama_propria} onChange={(v) => handleCrianca("familia_cama_propria", v)} options={simNaoOptions} />
                <Field label="Dorme sozinho no quarto?" value={formCrianca.familia_quarto_sozinho} onChange={(v) => handleCrianca("familia_quarto_sozinho", v)} options={simNaoOptions} />
                <Field label="Rotina diária do paciente" value={formCrianca.familia_rotina_paciente} onChange={(v) => handleCrianca("familia_rotina_paciente", v)} textarea gridSpan={2} />
                <Field label="Rotina geral dos outros membros da família" value={formCrianca.familia_rotina_familia} onChange={(v) => handleCrianca("familia_rotina_familia", v)} textarea gridSpan={2} />
                <Field label="Clima geral entre os moradores da casa atualmente" value={formCrianca.familia_clima_casa} onChange={(v) => handleCrianca("familia_clima_casa", v)} textarea gridSpan={2} />
                <Field label="Eventos importantes que afetaram o funcionamento da família (abusos, separação, morte)" value={formCrianca.familia_eventos_importantes} onChange={(v) => handleCrianca("familia_eventos_importantes", v)} textarea gridSpan={2} />
              </div>
            )}

            {/* ─ Step 5: Gestação e Parto ─ */}
            {criancaStep === 5 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <SectionTitle>Gestação</SectionTitle>
                <Field label="Gestação foi planejada?" value={formCrianca.gest_planejada} onChange={(v) => handleCrianca("gest_planejada", v)} options={simNaoOptions} />
                <Field label="Gestação foi aceita?" value={formCrianca.gest_aceita} onChange={(v) => handleCrianca("gest_aceita", v)} options={simNaoOptions} />
                <Field label="Gestação descoberta com quantas semanas?" value={formCrianca.gest_semanas_descoberta} onChange={(v) => handleCrianca("gest_semanas_descoberta", v)} />
                <Field label="Realizou pré-natal?" value={formCrianca.gest_pre_natal} onChange={(v) => handleCrianca("gest_pre_natal", v)} options={simNaoOptions} />
                {formCrianca.gest_pre_natal === "Sim" && (<>
                  <Field label="Onde realizou?" value={formCrianca.gest_pre_natal_onde} onChange={(v) => handleCrianca("gest_pre_natal_onde", v)} />
                  <Field label="A partir de quantas semanas?" value={formCrianca.gest_pre_natal_semanas} onChange={(v) => handleCrianca("gest_pre_natal_semanas", v)} />
                </>)}
                <Field label="Qualidade da relação entre gestante e família durante a gestação" value={formCrianca.gest_relacao_familia} onChange={(v) => handleCrianca("gest_relacao_familia", v)} textarea gridSpan={2} />
                <Field label="Trabalhou no período gestacional?" value={formCrianca.gest_trabalhou} onChange={(v) => handleCrianca("gest_trabalhou", v)} options={simNaoOptions} />
                {formCrianca.gest_trabalhou === "Sim" && (<>
                  <Field label="Qual cargo exercia?" value={formCrianca.gest_trabalhou_cargo} onChange={(v) => handleCrianca("gest_trabalhou_cargo", v)} />
                  <Field label="Trabalhou até que semana gestacional?" value={formCrianca.gest_trabalhou_semana} onChange={(v) => handleCrianca("gest_trabalhou_semana", v)} />
                </>)}
                <Field label="Hospitalizações durante a gravidez?" value={formCrianca.gest_hospitalizacoes} onChange={(v) => handleCrianca("gest_hospitalizacoes", v)} options={simNaoOptions} />
                {formCrianca.gest_hospitalizacoes === "Sim" && <Field label="Motivo e duração" value={formCrianca.gest_hospitalizacoes_motivo} onChange={(v) => handleCrianca("gest_hospitalizacoes_motivo", v)} />}
                <Field label="Intervenções cirúrgicas?" value={formCrianca.gest_cirurgias} onChange={(v) => handleCrianca("gest_cirurgias", v)} options={simNaoOptions} />
                {formCrianca.gest_cirurgias === "Sim" && <Field label="Motivo" value={formCrianca.gest_cirurgias_motivo} onChange={(v) => handleCrianca("gest_cirurgias_motivo", v)} />}
                <Field label="Uso de medicamentos?" value={formCrianca.gest_medicamentos} onChange={(v) => handleCrianca("gest_medicamentos", v)} options={simNaoOptions} />
                {formCrianca.gest_medicamentos === "Sim" && <Field label="Quais?" value={formCrianca.gest_medicamentos_quais} onChange={(v) => handleCrianca("gest_medicamentos_quais", v)} />}
                <Field label="Quedas durante período gestacional?" value={formCrianca.gest_quedas} onChange={(v) => handleCrianca("gest_quedas", v)} options={simNaoOptions} />
                {formCrianca.gest_quedas === "Sim" && <Field label="Período da gestação em que ocorreu" value={formCrianca.gest_quedas_periodo} onChange={(v) => handleCrianca("gest_quedas_periodo", v)} />}
                <Field label="Uso de álcool, cigarro ou drogas?" value={formCrianca.gest_drogas} onChange={(v) => handleCrianca("gest_drogas", v)} options={simNaoOptions} />
                {formCrianca.gest_drogas === "Sim" && <Field label="Especificar" value={formCrianca.gest_drogas_especificar} onChange={(v) => handleCrianca("gest_drogas_especificar", v)} />}
                <Field label="Realização de raio-x durante gestação?" value={formCrianca.gest_raio_x} onChange={(v) => handleCrianca("gest_raio_x", v)} options={simNaoOptions} />
                <Field label="Alguma doença na mãe durante a gestação?" value={formCrianca.gest_doencas_mae} onChange={(v) => handleCrianca("gest_doencas_mae", v)} options={simNaoOptions} />
                {formCrianca.gest_doencas_mae === "Sim" && <Field label="Especificar" value={formCrianca.gest_doencas_mae_especificar} onChange={(v) => handleCrianca("gest_doencas_mae_especificar", v)} />}

                <SectionTitle>Parto</SectionTitle>
                <Field label="Nascimento ocorreu com quantas semanas gestacionais?" value={formCrianca.gest_semanas_nascimento} onChange={(v) => handleCrianca("gest_semanas_nascimento", v)} />
                <Field label="Tipo de parto" value={formCrianca.gest_tipo_parto} onChange={(v) => handleCrianca("gest_tipo_parto", v)} options={tipoPartoOptions} />
                <Field label="Parto foi induzido ou ocorreu de forma natural?" value={formCrianca.gest_parto_induzido} onChange={(v) => handleCrianca("gest_parto_induzido", v)} />
                <Field label="Uso de fórceps?" value={formCrianca.gest_forceps} onChange={(v) => handleCrianca("gest_forceps", v)} options={simNaoOptions} />
                <Field label="Local de nascimento" value={formCrianca.gest_local_nascimento} onChange={(v) => handleCrianca("gest_local_nascimento", v)} />
                <Field label="Tempo estimado entre rompimento da bolsa e nascimento" value={formCrianca.gest_tempo_bolsa} onChange={(v) => handleCrianca("gest_tempo_bolsa", v)} />
                <Field label="Bebê nasceu roxinho?" value={formCrianca.gest_bebe_roxo} onChange={(v) => handleCrianca("gest_bebe_roxo", v)} options={simNaoOptions} />
                <Field label="Chorou logo ao nascer?" value={formCrianca.gest_chorou_nascer} onChange={(v) => handleCrianca("gest_chorou_nascer", v)} options={simNaoOptions} />
                <Field label="Bebê precisou de cuidados intensivos?" value={formCrianca.gest_cuidados_intensivos} onChange={(v) => handleCrianca("gest_cuidados_intensivos", v)} options={simNaoOptions} />
                {formCrianca.gest_cuidados_intensivos === "Sim" && <Field label="Por quanto tempo?" value={formCrianca.gest_cuidados_intensivos_tempo} onChange={(v) => handleCrianca("gest_cuidados_intensivos_tempo", v)} />}
                <Field label="Bebê respirou sozinho?" value={formCrianca.gest_respirou_sozinho} onChange={(v) => handleCrianca("gest_respirou_sozinho", v)} options={simNaoOptions} />
              </div>
            )}

            {/* ─ Step 6: Marcos do Desenvolvimento + 1º Ano ─ */}
            {criancaStep === 6 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <SectionTitle>Marcos do Desenvolvimento</SectionTitle>
                <Field label="Idade dos primeiros balbucios" value={formCrianca.marcos_balbucios} onChange={(v) => handleCrianca("marcos_balbucios", v)} />
                <Field label="Idade das primeiras palavras" value={formCrianca.marcos_palavras} onChange={(v) => handleCrianca("marcos_palavras", v)} />
                <Field label="Idade das primeiras frases completas" value={formCrianca.marcos_frases} onChange={(v) => handleCrianca("marcos_frases", v)} />
                <Field label="Idade em que firmou a cabeça" value={formCrianca.marcos_firmou_cabeca} onChange={(v) => handleCrianca("marcos_firmou_cabeca", v)} />
                <Field label="Idade em que sentou sozinho" value={formCrianca.marcos_sentou} onChange={(v) => handleCrianca("marcos_sentou", v)} />
                <Field label="Idade dos primeiros passos com apoio" value={formCrianca.marcos_passos_apoio} onChange={(v) => handleCrianca("marcos_passos_apoio", v)} />
                <Field label="Idade em que caminhou sem apoio" value={formCrianca.marcos_caminhou} onChange={(v) => handleCrianca("marcos_caminhou", v)} />
                <Field label="Idade em que sorriu para outras pessoas" value={formCrianca.marcos_sorriu} onChange={(v) => handleCrianca("marcos_sorriu", v)} />
                <Field label="Idade em que seguiu o olhar de adultos" value={formCrianca.marcos_seguiu_olhar} onChange={(v) => handleCrianca("marcos_seguiu_olhar", v)} />
                <Field label="Idade em que iniciou o apontar objetos" value={formCrianca.marcos_apontou} onChange={(v) => handleCrianca("marcos_apontou", v)} />
                <Field label="Cessou uso de fraldas — dia" value={formCrianca.marcos_fralda_dia} onChange={(v) => handleCrianca("marcos_fralda_dia", v)} />
                <Field label="Cessou uso de fraldas — noite" value={formCrianca.marcos_fralda_noite} onChange={(v) => handleCrianca("marcos_fralda_noite", v)} />

                <SectionTitle>Desenvolvimento no 1º Ano de Vida</SectionTitle>
                <Field label="Acompanhou a curva de crescimento?" value={formCrianca.dev1_curva} onChange={(v) => handleCrianca("dev1_curva", v)} options={simNaoOptions} />
                <Field label="Chorava muito?" value={formCrianca.dev1_chorava} onChange={(v) => handleCrianca("dev1_chorava", v)} options={simNaoOptions} />
                <Field label="Dormia muito?" value={formCrianca.dev1_dormia_muito} onChange={(v) => handleCrianca("dev1_dormia_muito", v)} options={simNaoOptions} />
                <Field label="Dormia pouco?" value={formCrianca.dev1_dormia_pouco} onChange={(v) => handleCrianca("dev1_dormia_pouco", v)} options={simNaoOptions} />
                <Field label="Teve muitas cólicas?" value={formCrianca.dev1_colicas} onChange={(v) => handleCrianca("dev1_colicas", v)} options={simNaoOptions} />
                <Field label="Vacinação completa no primeiro ano?" value={formCrianca.dev1_vacinacao} onChange={(v) => handleCrianca("dev1_vacinacao", v)} options={simNaoOptions} />
                <Field label="Como era o ambiente familiar nos primeiros anos de vida?" value={formCrianca.dev1_ambiente} onChange={(v) => handleCrianca("dev1_ambiente", v)} textarea gridSpan={2} />
              </div>
            )}

            {/* ─ Step 7: Histórico de Saúde ─ */}
            {criancaStep === 7 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <SectionTitle>Histórico de Saúde</SectionTitle>
                <Field label="Internações?" value={formCrianca.saude_internacoes} onChange={(v) => handleCrianca("saude_internacoes", v)} options={simNaoOptions} />
                {formCrianca.saude_internacoes === "Sim" && <Field label="Quantas, idades e duração" value={formCrianca.saude_internacoes_detalhes} onChange={(v) => handleCrianca("saude_internacoes_detalhes", v)} textarea />}
                <Field label="Uso de medicações atual?" value={formCrianca.saude_med_atual} onChange={(v) => handleCrianca("saude_med_atual", v)} options={simNaoOptions} />
                {formCrianca.saude_med_atual === "Sim" && <Field label="Quais e tempo de uso" value={formCrianca.saude_med_atual_detalhes} onChange={(v) => handleCrianca("saude_med_atual_detalhes", v)} textarea />}
                <Field label="Uso de medicações passada?" value={formCrianca.saude_med_passada} onChange={(v) => handleCrianca("saude_med_passada", v)} options={simNaoOptions} />
                {formCrianca.saude_med_passada === "Sim" && <Field label="Quais e tempo de uso" value={formCrianca.saude_med_passada_detalhes} onChange={(v) => handleCrianca("saude_med_passada_detalhes", v)} textarea />}
                <Field label="Problemas auditivos?" value={formCrianca.saude_auditivo} onChange={(v) => handleCrianca("saude_auditivo", v)} options={simNaoOptions} />
                {formCrianca.saude_auditivo === "Sim" && <Field label="Corrigidos?" value={formCrianca.saude_auditivo_corrigido} onChange={(v) => handleCrianca("saude_auditivo_corrigido", v)} options={simNaoOptions} />}
                <Field label="Problemas visuais?" value={formCrianca.saude_visual} onChange={(v) => handleCrianca("saude_visual", v)} options={simNaoOptions} />
                {formCrianca.saude_visual === "Sim" && <Field label="Corrigidos?" value={formCrianca.saude_visual_corrigido} onChange={(v) => handleCrianca("saude_visual_corrigido", v)} options={simNaoOptions} />}
                <Field label="Desmaios?" value={formCrianca.saude_desmaios} onChange={(v) => handleCrianca("saude_desmaios", v)} options={simNaoOptions} />
                {formCrianca.saude_desmaios === "Sim" && <Field label="Quantos e idades de ocorrência" value={formCrianca.saude_desmaios_detalhes} onChange={(v) => handleCrianca("saude_desmaios_detalhes", v)} />}
                <Field label="Convulsões?" value={formCrianca.saude_convulsoes} onChange={(v) => handleCrianca("saude_convulsoes", v)} options={simNaoOptions} />
                {formCrianca.saude_convulsoes === "Sim" && <Field label="Quantas e idades de ocorrência" value={formCrianca.saude_convulsoes_detalhes} onChange={(v) => handleCrianca("saude_convulsoes_detalhes", v)} />}

                <SectionTitle>Histórico de doenças</SectionTitle>
                <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                  {([
                    { key: "saude_meningite", label: "Meningite" },
                    { key: "saude_encefalite", label: "Encefalite" },
                    { key: "saude_sarampo", label: "Sarampo" },
                    { key: "saude_rubeola", label: "Rubéola" },
                    { key: "saude_caxumba", label: "Caxumba" },
                    { key: "saude_coqueluche", label: "Coqueluche" },
                    { key: "saude_pneumonia", label: "Pneumonia" },
                  ] as { key: keyof FormCrianca; label: string }[]).map(({ key, label }) => (
                    <label key={key} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", cursor: "pointer", padding: "8px 10px", border: "0.5px solid #e0dbd2", borderRadius: "8px", background: formCrianca[key] === "Sim" ? "#f0f5f0" : "#fff" }}>
                      <input type="checkbox" checked={formCrianca[key] === "Sim"} onChange={(e) => handleCrianca(key, e.target.checked ? "Sim" : "")} style={{ cursor: "pointer" }} />
                      {label}
                    </label>
                  ))}
                </div>
                <Field label="Alergias?" value={formCrianca.saude_alergias} onChange={(v) => handleCrianca("saude_alergias", v)} options={simNaoOptions} />
                {formCrianca.saude_alergias === "Sim" && <Field label="Quais?" value={formCrianca.saude_alergias_quais} onChange={(v) => handleCrianca("saude_alergias_quais", v)} />}
                <Field label="Outras doenças?" value={formCrianca.saude_outras_doencas} onChange={(v) => handleCrianca("saude_outras_doencas", v)} options={simNaoOptions} />
                {formCrianca.saude_outras_doencas === "Sim" && <Field label="Quais?" value={formCrianca.saude_outras_doencas_quais} onChange={(v) => handleCrianca("saude_outras_doencas_quais", v)} />}
                <Field label="Realiza ou realizou acompanhamento com profissionais da saúde/educação?" value={formCrianca.saude_acompanhamento} onChange={(v) => handleCrianca("saude_acompanhamento", v)} options={simNaoOptions} />
                {formCrianca.saude_acompanhamento === "Sim" && <Field label="Quais profissionais, duração e objetivos" value={formCrianca.saude_acompanhamento_detalhes} onChange={(v) => handleCrianca("saude_acompanhamento_detalhes", v)} textarea />}
                <Field label="Reclama de dores físicas?" value={formCrianca.saude_dores} onChange={(v) => handleCrianca("saude_dores", v)} options={simNaoOptions} />
                {formCrianca.saude_dores === "Sim" && (<>
                  <Field label="Quais?" value={formCrianca.saude_dores_quais} onChange={(v) => handleCrianca("saude_dores_quais", v)} />
                  <Field label="Frequência" value={formCrianca.saude_dores_frequencia} onChange={(v) => handleCrianca("saude_dores_frequencia", v)} />
                </>)}
                <Field label="Diagnósticos prévios?" value={formCrianca.saude_diagnosticos} onChange={(v) => handleCrianca("saude_diagnosticos", v)} options={simNaoOptions} />
                {formCrianca.saude_diagnosticos === "Sim" && <Field label="Quais?" value={formCrianca.saude_diagnosticos_quais} onChange={(v) => handleCrianca("saude_diagnosticos_quais", v)} textarea />}
              </div>
            )}

            {/* ─ Step 8: Socialização + Autonomia ─ */}
            {criancaStep === 8 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <SectionTitle>Socialização</SectionTitle>
                <Field label="Tem amigos?" value={formCrianca.social_tem_amigos} onChange={(v) => handleCrianca("social_tem_amigos", v)} options={simNaoOptions} />
                <Field label="Tem um melhor amigo(a)?" value={formCrianca.social_melhor_amigo} onChange={(v) => handleCrianca("social_melhor_amigo", v)} options={simNaoOptions} />
                <Field label="Preferência por interação com crianças mais novas ou mais velhas?" value={formCrianca.social_preferencia_idade} onChange={(v) => handleCrianca("social_preferencia_idade", v)} gridSpan={2} />
                <Field label="Histórico de bullying na escola?" value={formCrianca.social_bullying} onChange={(v) => handleCrianca("social_bullying", v)} options={simNaoOptions} />
                <Field label="Ao chegar em ambientes novos, busca interação com outras pessoas?" value={formCrianca.social_busca_interacao} onChange={(v) => handleCrianca("social_busca_interacao", v)} textarea />
                <Field label="Consegue/conseguia se adaptar a brincadeiras propostas por outras crianças?" value={formCrianca.social_adapta_brincadeiras} onChange={(v) => handleCrianca("social_adapta_brincadeiras", v)} options={simNaoOptions} />
                <Field label="Mantém conversas com grupos sobre assuntos diversos?" value={formCrianca.social_conversa_grupos} onChange={(v) => handleCrianca("social_conversa_grupos", v)} options={simNaoOptions} />
                <Field label="Como você descreve a relação do paciente com o pai?" value={formCrianca.social_relacao_pai} onChange={(v) => handleCrianca("social_relacao_pai", v)} textarea gridSpan={2} />
                <Field label="Como você descreve a relação do paciente com a mãe?" value={formCrianca.social_relacao_mae} onChange={(v) => handleCrianca("social_relacao_mae", v)} textarea gridSpan={2} />
                <Field label="Como você descreve a relação do paciente com irmãos?" value={formCrianca.social_relacao_irmaos} onChange={(v) => handleCrianca("social_relacao_irmaos", v)} textarea gridSpan={2} />
                <Field label="Como você descreve a relação do paciente com professor(a)?" value={formCrianca.social_relacao_professor} onChange={(v) => handleCrianca("social_relacao_professor", v)} textarea gridSpan={2} />
                <Field label="Como reage quando é negado algum desejo?" value={formCrianca.social_reage_negacao} onChange={(v) => handleCrianca("social_reage_negacao", v)} textarea gridSpan={2} />
                <Field label="Frequenta casa de amigos ou eles frequentam a casa do paciente?" value={formCrianca.social_frequenta_amigos} onChange={(v) => handleCrianca("social_frequenta_amigos", v)} options={simNaoOptions} />
                <Field label="Tem outro familiar ou pessoa de quem o paciente é muito próximo?" value={formCrianca.social_familiar_proximo} onChange={(v) => handleCrianca("social_familiar_proximo", v)} textarea />
                <Field label="Tem interesses? Quais?" value={formCrianca.social_interesses} onChange={(v) => handleCrianca("social_interesses", v)} textarea gridSpan={2} />
                <Field label="Tem algum interesse específico? Apresenta dificuldades para mudar o foco?" value={formCrianca.social_interesse_especifico} onChange={(v) => handleCrianca("social_interesse_especifico", v)} textarea gridSpan={2} />
                <Field label="Como a criança lida com a rotina e com mudanças em sua rotina?" value={formCrianca.social_lida_rotina} onChange={(v) => handleCrianca("social_lida_rotina", v)} textarea gridSpan={2} />
                <Field label="Considera os interesses da criança apropriados para a faixa etária?" value={formCrianca.social_interesses_faixa_etaria} onChange={(v) => handleCrianca("social_interesses_faixa_etaria", v)} options={simNaoOptions} />

                <SectionTitle>Autonomia</SectionTitle>
                <Field label="Reconhece, maneja dinheiro e lida com troco?" value={formCrianca.auto_dinheiro} onChange={(v) => handleCrianca("auto_dinheiro", v)} textarea gridSpan={2} />
                <Field label="Realiza atividades de higiene pessoal sozinho? (se não, especificar)" value={formCrianca.auto_higiene} onChange={(v) => handleCrianca("auto_higiene", v)} textarea gridSpan={2} />
                <Field label="É capaz de fazer refeições simples sozinho(a)?" value={formCrianca.auto_refeicoes} onChange={(v) => handleCrianca("auto_refeicoes", v)} options={simNaoOptions} />
                <Field label="É capaz de olhar as horas?" value={formCrianca.auto_horas} onChange={(v) => handleCrianca("auto_horas", v)} options={simNaoOptions} />
                <Field label="É capaz de gerenciar o próprio tempo?" value={formCrianca.auto_tempo} onChange={(v) => handleCrianca("auto_tempo", v)} options={simNaoOptions} />
                <Field label="É capaz de vestir sozinho(a)?" value={formCrianca.auto_vestir} onChange={(v) => handleCrianca("auto_vestir", v)} options={simNaoOptions} />
                <Field label="É capaz de escolher as próprias roupas sozinho(a)?" value={formCrianca.auto_escolher_roupas} onChange={(v) => handleCrianca("auto_escolher_roupas", v)} options={simNaoOptions} />
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Escala de autonomia (0 = nada dependente, 3 = completamente dependente)</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {[
                      { v: "0", label: "0 — nunca é dependente" },
                      { v: "1", label: "1 — às vezes é dependente" },
                      { v: "2", label: "2 — frequentemente é dependente" },
                      { v: "3", label: "3 — sempre é dependente" },
                    ].map(({ v, label }) => {
                      const sel = formCrianca.auto_escala === v;
                      return (
                        <button type="button" key={v} aria-pressed={sel} onClick={() => handleCrianca("auto_escala", v)} style={{ flex: 1, fontFamily: "inherit", textAlign: "center", padding: "10px 8px", cursor: "pointer", borderRadius: "8px", fontSize: "12px", fontWeight: 600, background: sel ? "#E07A6E" : "#f0ece4", color: sel ? "#fff" : "#2B1F14", border: sel ? "none" : "0.5px solid #d6d0c4", transition: "all 0.15s" }}>
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ─ Step 9: Sono + Alimentação + Habilidades Narrativas ─ */}
            {criancaStep === 9 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <SectionTitle>Sono</SectionTitle>
                <Field label="Dificuldades para pegar no sono?" value={formCrianca.sono_pegar} onChange={(v) => handleCrianca("sono_pegar", v)} options={simNaoOptions} />
                <Field label="Dificuldades em despertar do sono?" value={formCrianca.sono_despertar} onChange={(v) => handleCrianca("sono_despertar", v)} options={simNaoOptions} />
                <Field label="Se movimenta muito dormindo?" value={formCrianca.sono_movimenta} onChange={(v) => handleCrianca("sono_movimenta", v)} options={simNaoOptions} />
                <Field label="Reclama de pesadelos?" value={formCrianca.sono_pesadelos} onChange={(v) => handleCrianca("sono_pesadelos", v)} options={simNaoOptions} />
                <Field label="Ronca?" value={formCrianca.sono_ronca} onChange={(v) => handleCrianca("sono_ronca", v)} options={simNaoOptions} />
                {formCrianca.sono_ronca === "Sim" && (<>
                  <Field label="Desde quando?" value={formCrianca.sono_ronca_desde} onChange={(v) => handleCrianca("sono_ronca_desde", v)} />
                  <Field label="Com que frequência?" value={formCrianca.sono_ronca_freq} onChange={(v) => handleCrianca("sono_ronca_freq", v)} />
                </>)}
                <Field label="Enurese (xixi na cama)?" value={formCrianca.sono_enurese} onChange={(v) => handleCrianca("sono_enurese", v)} options={simNaoOptions} />
                {formCrianca.sono_enurese === "Sim" && (<>
                  <Field label="Desde quando?" value={formCrianca.sono_enurese_desde} onChange={(v) => handleCrianca("sono_enurese_desde", v)} />
                  <Field label="Com que frequência?" value={formCrianca.sono_enurese_freq} onChange={(v) => handleCrianca("sono_enurese_freq", v)} />
                </>)}
                <Field label="Tempo médio de sono por noite" value={formCrianca.sono_tempo} onChange={(v) => handleCrianca("sono_tempo", v)} />
                <Field label="Tem rotina de sono?" value={formCrianca.sono_rotina} onChange={(v) => handleCrianca("sono_rotina", v)} options={simNaoOptions} />
                {formCrianca.sono_rotina === "Sim" && <Field label="Horário" value={formCrianca.sono_rotina_horario} onChange={(v) => handleCrianca("sono_rotina_horario", v)} />}

                <SectionTitle>Alimentação</SectionTitle>
                <Field label="Amamentou no peito?" value={formCrianca.alim_amamentou} onChange={(v) => handleCrianca("alim_amamentou", v)} options={simNaoOptions} />
                {formCrianca.alim_amamentou === "Sim" && <Field label="Até qual idade?" value={formCrianca.alim_amamentou_idade} onChange={(v) => handleCrianca("alim_amamentou_idade", v)} />}
                <Field label="Peso compatível ao esperado para tamanho e idade?" value={formCrianca.alim_peso} onChange={(v) => handleCrianca("alim_peso", v)} options={simNaoOptions} />
                <Field label="Restrição alérgica a algum alimento?" value={formCrianca.alim_restricao} onChange={(v) => handleCrianca("alim_restricao", v)} options={simNaoOptions} />
                <Field label="Apresenta resistência a ingestão de algum alimento?" value={formCrianca.alim_resistencia} onChange={(v) => handleCrianca("alim_resistencia", v)} options={simNaoOptions} />
                <Field label="Tem muita fome?" value={formCrianca.alim_muita_fome} onChange={(v) => handleCrianca("alim_muita_fome", v)} options={simNaoOptions} />
                <Field label="Tinha muita fome nos primeiros anos de vida?" value={formCrianca.alim_muita_fome_primeiros} onChange={(v) => handleCrianca("alim_muita_fome_primeiros", v)} options={simNaoOptions} />
                <Field label="Como descreve o padrão alimentar do(a) filho(a)?" value={formCrianca.alim_padrao} onChange={(v) => handleCrianca("alim_padrao", v)} textarea gridSpan={2} />

                <SectionTitle>Habilidades Narrativas</SectionTitle>
                <Field label="A criança se interessa por histórias (leitura, filmes)?" value={formCrianca.narr_historias} onChange={(v) => handleCrianca("narr_historias", v)} options={simNaoOptions} />
                <Field label="Consegue recontá-las de forma coesa e coerente?" value={formCrianca.narr_recontar} onChange={(v) => handleCrianca("narr_recontar", v)} options={simNaoOptions} />
                <Field label="Consegue entender humor (piadas)?" value={formCrianca.narr_humor} onChange={(v) => handleCrianca("narr_humor", v)} options={simNaoOptions} />
                <Field label="Consegue recontar piadas de forma engraçada?" value={formCrianca.narr_piadas} onChange={(v) => handleCrianca("narr_piadas", v)} options={simNaoOptions} />
                <Field label="Explica situações vivenciadas na escola de forma a se fazer entender?" value={formCrianca.narr_escola} onChange={(v) => handleCrianca("narr_escola", v)} options={simNaoOptions} />
                <Field label="Repassa recados de forma funcional?" value={formCrianca.narr_recados} onChange={(v) => handleCrianca("narr_recados", v)} options={simNaoOptions} />
              </div>
            )}

            {/* ─ Step 10: Orientação + Vida Escolar ─ */}
            {criancaStep === 10 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <SectionTitle>Orientação no Tempo e Espaço</SectionTitle>
                <div style={{ gridColumn: "1 / -1", background: "#faf9f6", borderRadius: "10px", padding: "16px", border: "0.5px solid #e0dbd2" }}>
                  <label style={labelStyle}>A criança entende os seguintes conceitos?</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    {([
                      { key: "ori_direita_esquerda", label: "Direita / Esquerda" },
                      { key: "ori_cima_baixo", label: "Cima / Baixo" },
                      { key: "ori_atras_frente", label: "Atrás / Frente" },
                      { key: "ori_ontem_hoje_amanha", label: "Ontem / Hoje / Amanhã" },
                      { key: "ori_manha_tarde_noite", label: "Manhã / Tarde / Noite" },
                      { key: "ori_dias_semana", label: "Sabe os dias da semana" },
                      { key: "ori_calendario", label: "Sabe olhar no calendário" },
                      { key: "ori_aniversario", label: "Sabe a data do próprio aniversário" },
                      { key: "ori_ambientes_novos", label: "Sabe andar sozinha em ambientes novos" },
                      { key: "ori_propria_casa", label: "Sabe se locomover sozinha na própria casa" },
                      { key: "ori_escola", label: "Sabe se locomover sozinha na escola" },
                    ] as { key: keyof FormCrianca; label: string }[]).map(({ key, label }) => (
                      <label key={key} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", cursor: "pointer", padding: "6px 10px", borderRadius: "6px", background: formCrianca[key] === "Sim" ? "#e8f2e8" : "#fff", border: "0.5px solid #e0dbd2" }}>
                        <input type="checkbox" checked={formCrianca[key] === "Sim"} onChange={(e) => handleCrianca(key, e.target.checked ? "Sim" : "Não")} style={{ cursor: "pointer" }} />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>

                <SectionTitle>Vida Escolar</SectionTitle>
                <Field label="Iniciou a vida escolar com qual idade?" value={formCrianca.esc_idade_inicio} onChange={(v) => handleCrianca("esc_idade_inicio", v)} />
                <Field label="É alfabetizado(a)?" value={formCrianca.esc_alfabetizado} onChange={(v) => handleCrianca("esc_alfabetizado", v)} options={simNaoOptions} />
                <Field label="Reconhece letras?" value={formCrianca.esc_letras} onChange={(v) => handleCrianca("esc_letras", v)} options={simNaoOptions} />
                <Field label="Reconhece números?" value={formCrianca.esc_numeros} onChange={(v) => handleCrianca("esc_numeros", v)} options={simNaoOptions} />
                <Field label="Reconhece e identifica cores?" value={formCrianca.esc_cores} onChange={(v) => handleCrianca("esc_cores", v)} options={simNaoOptions} />
                <Field label="Histórico de reprovação?" value={formCrianca.esc_reprovacao} onChange={(v) => handleCrianca("esc_reprovacao", v)} options={simNaoOptions} />
                {formCrianca.esc_reprovacao === "Sim" && <Field label="Anos de reprovação e quantidade" value={formCrianca.esc_reprovacao_detalhes} onChange={(v) => handleCrianca("esc_reprovacao_detalhes", v)} />}
                <Field label="Dificuldades generalizadas em disciplinas escolares?" value={formCrianca.esc_dificuldades_gerais} onChange={(v) => handleCrianca("esc_dificuldades_gerais", v)} options={simNaoOptions} />
                <Field label="Dificuldades em alguma disciplina específica?" value={formCrianca.esc_dificuldades_especifica} onChange={(v) => handleCrianca("esc_dificuldades_especifica", v)} options={simNaoOptions} />
                {formCrianca.esc_dificuldades_especifica === "Sim" && <Field label="Qual(is)?" value={formCrianca.esc_dificuldades_quais} onChange={(v) => handleCrianca("esc_dificuldades_quais", v)} />}
                <Field label="Queixas de comportamento no ambiente escolar?" value={formCrianca.esc_queixas_comportamento} onChange={(v) => handleCrianca("esc_queixas_comportamento", v)} textarea gridSpan={2} />
                <Field label="Rotina de estudo em casa?" value={formCrianca.esc_rotina_estudo} onChange={(v) => handleCrianca("esc_rotina_estudo", v)} options={simNaoOptions} />
                <Field label="Que horas realiza o dever em casa?" value={formCrianca.esc_horario_dever} onChange={(v) => handleCrianca("esc_horario_dever", v)} />
                <Field label="Descreva o ambiente em que a criança estuda em casa" value={formCrianca.esc_ambiente_estudo} onChange={(v) => handleCrianca("esc_ambiente_estudo", v)} textarea gridSpan={2} />
                <Field label="Quem dá suporte na realização de tarefas escolares?" value={formCrianca.esc_suporte_tarefas} onChange={(v) => handleCrianca("esc_suporte_tarefas", v)} textarea gridSpan={2} />
              </div>
            )}

            {/* ─ Step 11: Estilo Parental + Histórico Genético + Temperamento ─ */}
            {criancaStep === 11 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <SectionTitle>Estilo Parental</SectionTitle>
                <Field label="Adoção de castigos físicos com a criança?" value={formCrianca.par_castigos_fisicos} onChange={(v) => handleCrianca("par_castigos_fisicos", v)} textarea gridSpan={2} />
                <Field label="Uso de xingamentos e ameaças com a criança?" value={formCrianca.par_xingamentos} onChange={(v) => handleCrianca("par_xingamentos", v)} textarea gridSpan={2} />
                <Field label="Adoção de conversas sobre comportamentos-problema?" value={formCrianca.par_conversas} onChange={(v) => handleCrianca("par_conversas", v)} textarea gridSpan={2} />
                <Field label="Adoção de negociações com a criança?" value={formCrianca.par_negociacoes} onChange={(v) => handleCrianca("par_negociacoes", v)} textarea gridSpan={2} />
                <Field label="Adoção de elogios com a criança?" value={formCrianca.par_elogios} onChange={(v) => handleCrianca("par_elogios", v)} textarea gridSpan={2} />
                <Field label="Hábito de troca de carinhos físicos (abraços, carinhos)?" value={formCrianca.par_carinhos} onChange={(v) => handleCrianca("par_carinhos", v)} textarea gridSpan={2} />

                <SectionTitle>Histórico Genético Familiar</SectionTitle>
                <Field label="Algum familiar apresenta dificuldades na escola? (grau de parentesco e dificuldades)" value={formCrianca.gen_dificuldades_escola} onChange={(v) => handleCrianca("gen_dificuldades_escola", v)} textarea gridSpan={2} />
                <Field label="Algum familiar apresenta diagnóstico psiquiátrico ou suspeita?" value={formCrianca.gen_diagnostico_psiquiatrico} onChange={(v) => handleCrianca("gen_diagnostico_psiquiatrico", v)} textarea gridSpan={2} />
                <Field label="Algum familiar apresenta diagnóstico de síndrome genética?" value={formCrianca.gen_sindrome} onChange={(v) => handleCrianca("gen_sindrome", v)} textarea gridSpan={2} />
                <Field label="Algum familiar faz uso de medicações controladas?" value={formCrianca.gen_medicacoes_controladas} onChange={(v) => handleCrianca("gen_medicacoes_controladas", v)} textarea gridSpan={2} />
                <Field label="Algum membro da família já teve tentativa de suicídio?" value={formCrianca.gen_tentativa_suicidio} onChange={(v) => handleCrianca("gen_tentativa_suicidio", v)} options={simNaoOptions} />
                {formCrianca.gen_tentativa_suicidio === "Sim" && <Field label="Grau de parentesco" value={formCrianca.gen_tentativa_suicidio_parentesco} onChange={(v) => handleCrianca("gen_tentativa_suicidio_parentesco", v)} />}
                <Field label="Algum membro da família já morreu por suicídio?" value={formCrianca.gen_morte_suicidio} onChange={(v) => handleCrianca("gen_morte_suicidio", v)} options={simNaoOptions} />

                <SectionTitle>Temperamento</SectionTitle>
                <Field label="Como você descreve o funcionamento da criança? (ativa/plácida, irritadiça/calma, desafiadora/adequada às regras, busca por contato social)" value={formCrianca.temp_descricao} onChange={(v) => handleCrianca("temp_descricao", v)} textarea gridSpan={2} />
                <Field label="Descreva as maiores dificuldades na interação com seu filho(a) atualmente (liste até 6):" value={formCrianca.temp_dificuldades} onChange={(v) => handleCrianca("temp_dificuldades", v)} textarea gridSpan={2} />
                <div style={{ gridColumn: "1 / -1" }}>{blocoVisibilidade}</div>
              </div>
            )}

          </ModalBody>
          <ModalFooter
            onBack={criancaStep > 1 ? () => setCriancaStep((s) => s - 1) : undefined}
            onNext={criancaStep < 11 ? () => setCriancaStep((s) => s + 1) : undefined}
            onSave={criancaStep === 11 ? salvarProntuario : undefined}
            onPrint={criancaStep === 11 && podeGerarPdf ? abrirSeletorPdf : undefined}
            submitting={submitting}
            isUpdate={!!existingProntuarioId}
          />
        </Modal>
      )}

      {/* ── Modal Fisioterapia ────────────────────────────────────────────────── */}
      {modalType === "fisioterapia" && agendamentoSelecionado && (
        <Modal titulo={`Ficha Fisioterapia — ${agendamentoSelecionado.beneficiarias?.nome}`} subtitulo={stepFisio.title} onClose={fecharModal}>
          {avisoProntuarioAusente}
          <ProgressBar total={2} current={fisioStep} descricao={stepFisio.description} />
          <ModalBody errors={errors}>

            {fisioStep === 1 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <SectionTitle>Identificação</SectionTitle>
                <Field label="Nome" value={formFisio.nome} onChange={(v) => handleFisio("nome", v)} />
                <Field label="Idade" value={formFisio.idade} onChange={(v) => handleFisio("idade", v)} />
                <Field label="Sexo" value={formFisio.sexo} onChange={(v) => handleFisio("sexo", v)} options={sexoOptions} />
                <Field label="Ocupação" value={formFisio.ocupacao} onChange={(v) => handleFisio("ocupacao", v)} />
                <Field label="CPF" value={formFisio.cpf} onChange={(v) => handleFisio("cpf", v)} />
                <Field label="RG" value={formFisio.rg} onChange={(v) => handleFisio("rg", v)} />
                <Field label="Contato" value={formFisio.contato} onChange={(v) => handleFisio("contato", v)} gridSpan={2} />

                <SectionTitle>Histórico Clínico</SectionTitle>
                <Field label="Caso Clínico" value={formFisio.caso_clinico} onChange={(v) => handleFisio("caso_clinico", v)} textarea gridSpan={2} />
                <Field label="Histórico Médico" value={formFisio.historico_medico} onChange={(v) => handleFisio("historico_medico", v)} textarea gridSpan={2} />
                <Field label="Usa Medicamento?" value={formFisio.usa_medicamento} onChange={(v) => handleFisio("usa_medicamento", v)} options={simNaoOptions} />
                {formFisio.usa_medicamento === "Sim" && (
                  <Field label="Quais Medicamentos" value={formFisio.medicamentos_lista} onChange={(v) => handleFisio("medicamentos_lista", v)} />
                )}
              </div>
            )}

            {fisioStep === 2 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <SectionTitle>Sinais Vitais</SectionTitle>
                <Field label="FC (bpm)" value={formFisio.sv_fc} onChange={(v) => handleFisio("sv_fc", v)} />
                <Field label="FR (rpm)" value={formFisio.sv_fr} onChange={(v) => handleFisio("sv_fr", v)} />
                <Field label="PA (mmHg)" value={formFisio.sv_pa} onChange={(v) => handleFisio("sv_pa", v)} />
                <div />

                <SectionTitle>Exame Físico</SectionTitle>
                <Field label="Apresentação do Paciente" value={formFisio.apresentacao_paciente} onChange={(v) => handleFisio("apresentacao_paciente", v)} textarea gridSpan={2} />
                <Field label="Inspeção / Palpação" value={formFisio.inspecao_palpacao} onChange={(v) => handleFisio("inspecao_palpacao", v)} textarea gridSpan={2} />
                <Field label="Exames Complementares?" value={formFisio.exames_complementares} onChange={(v) => handleFisio("exames_complementares", v)} options={simNaoOptions} />
                {formFisio.exames_complementares === "Sim" && (
                  <Field label="Observações" value={formFisio.exames_complementares_obs} onChange={(v) => handleFisio("exames_complementares_obs", v)} />
                )}
                <Field label="Prótese / Órtese?" value={formFisio.protese_ortese} onChange={(v) => handleFisio("protese_ortese", v)} options={simNaoOptions} />
                {formFisio.protese_ortese === "Sim" && (
                  <Field label="Qual" value={formFisio.protese_ortese_obs} onChange={(v) => handleFisio("protese_ortese_obs", v)} />
                )}
                <Field label="Limitação de Movimento?" value={formFisio.limitacao_movimento} onChange={(v) => handleFisio("limitacao_movimento", v)} options={simNaoOptions} />
                {formFisio.limitacao_movimento === "Sim" && (
                  <Field label="Qual" value={formFisio.limitacao_movimento_obs} onChange={(v) => handleFisio("limitacao_movimento_obs", v)} />
                )}
                <Field label="Equilíbrio / Coordenação" value={formFisio.equilibrio_coordenacao} onChange={(v) => handleFisio("equilibrio_coordenacao", v)} gridSpan={2} />

                <SectionTitle>Avaliação de Dor e Diagnóstico</SectionTitle>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Intensidade da Dor (0 a 10)</label>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px", overflowX: "auto" }}>
                    {[...Array(11)].map((_, i) => {
                      const isSelected = String(i) === String(formFisio.dor_intensidade);
                      let bgColor = "#e0dbd2";
                      let color = "#2B1F14";
                      if (isSelected) {
                        if (i <= 3) { bgColor = "#3D7845"; color = "#fff"; } // Leve
                        else if (i <= 7) { bgColor = "#eab308"; color = "#fff"; } // Moderada
                        else { bgColor = "#ef4444"; color = "#fff"; } // Intensa
                      }

                      return (
                        <div
                          key={i}
                          onClick={() => handleFisio("dor_intensidade", String(i))}
                          style={{
                            flex: 1, minWidth: "32px", textAlign: "center", padding: "8px 0", cursor: "pointer",
                            borderRadius: "6px", fontSize: "14px", fontWeight: 700,
                            background: bgColor, color, border: isSelected ? "none" : "1px solid #d6d0c4",
                            transition: "all 0.2s"
                          }}
                        >
                          {i}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#9B8E84", fontWeight: 600 }}>
                    <span>Leve (0-3)</span>
                    <span>Moderada (4-7)</span>
                    <span>Intensa (8-10)</span>
                  </div>
                </div>

                <Field label="Queixa Principal" value={formFisio.queixa_principal} onChange={(v) => handleFisio("queixa_principal", v)} textarea gridSpan={2} />
                <Field label="História Clínica" value={formFisio.historia_clinica} onChange={(v) => handleFisio("historia_clinica", v)} textarea gridSpan={2} />
                <Field label="Demais Observações" value={formFisio.demais_observacoes} onChange={(v) => handleFisio("demais_observacoes", v)} textarea gridSpan={2} />

                <SectionTitle>Plano de Tratamento</SectionTitle>
                <Field label="Objetivo do Tratamento" value={formFisio.objetivo_tratamento} onChange={(v) => handleFisio("objetivo_tratamento", v)} textarea gridSpan={2} />
                <Field label="Recursos Terapêuticos" value={formFisio.recursos_terapeuticos} onChange={(v) => handleFisio("recursos_terapeuticos", v)} textarea gridSpan={2} />
                <Field label="Anotações Gerais" value={formFisio.anotacoes_gerais} onChange={(v) => handleFisio("anotacoes_gerais", v)} textarea gridSpan={2} />

                <div style={{ gridColumn: "1 / -1", borderTop: "1px dashed #d6d0c4", margin: "8px 0" }} />
                <Field label="Data Assinatura" type="date" value={formFisio.data_assinatura} onChange={(v) => handleFisio("data_assinatura", v)} />
                <Field label="Assinatura" value={formFisio.assinatura} onChange={(v) => handleFisio("assinatura", v)} />
                <div style={{ gridColumn: "1 / -1" }}>{blocoVisibilidade}</div>
              </div>
            )}
          </ModalBody>
          <ModalFooter
            onBack={fisioStep > 1 ? () => setFisioStep((s) => s - 1) : undefined}
            onNext={fisioStep < 2 ? () => setFisioStep((s) => s + 1) : undefined}
            onSave={fisioStep === 2 ? salvarProntuario : undefined}
            onPrint={fisioStep === 2 && podeGerarPdf ? abrirSeletorPdf : undefined}
            submitting={submitting}
            isUpdate={!!existingProntuarioId}
          />
        </Modal>
      )}

      {/* ── Modal Acupuntura ──────────────────────────────────────────────────── */}
      {modalType === "acupuntura" && agendamentoSelecionado && (
        <Modal titulo={`Ficha Acupuntura — ${agendamentoSelecionado.beneficiarias?.nome}`} subtitulo="Atendimento clínico" onClose={fecharModal}>
          {avisoProntuarioAusente}
          <ModalBody errors={errors}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <Field label="Nome" value={formAcupuntura.nome} onChange={(v) => handleAcupuntura("nome", v)} gridSpan={2} />
              <Field label="Endereço" value={formAcupuntura.endereco} onChange={(v) => handleAcupuntura("endereco", v)} gridSpan={2} />
              <Field label="Idade" value={formAcupuntura.idade} onChange={(v) => handleAcupuntura("idade", v)} />
              <Field label="Data nasc." type="date" value={formAcupuntura.data_nascimento} onChange={(v) => handleAcupuntura("data_nascimento", v)} />
              <Field label="Telefone" value={formAcupuntura.telefone} onChange={(v) => handleAcupuntura("telefone", v)} />
              <Field label="Profissão" value={formAcupuntura.profissao} onChange={(v) => handleAcupuntura("profissao", v)} />
              <Field label="Estado civil" value={formAcupuntura.estado_civil} onChange={(v) => handleAcupuntura("estado_civil", v)} options={estadoCivilOptions} />
              <Field label="Filho" value={formAcupuntura.filho} onChange={(v) => handleAcupuntura("filho", v)} />
              <Field label="Pacote" value={formAcupuntura.pacote} onChange={(v) => handleAcupuntura("pacote", v)} />
              <Field label="História" value={formAcupuntura.historia} onChange={(v) => handleAcupuntura("historia", v)} textarea gridSpan={2} />
              <Field label="IG" value={formAcupuntura.ig} onChange={(v) => handleAcupuntura("ig", v)} />
              <Field label="Sono" value={formAcupuntura.sono} onChange={(v) => handleAcupuntura("sono", v)} />
              <Field label="Alimentação" value={formAcupuntura.alimentacao} onChange={(v) => handleAcupuntura("alimentacao", v)} />
              <Field label="Língua" value={formAcupuntura.lingua} onChange={(v) => handleAcupuntura("lingua", v)} />
              <Field label="Data da consulta" type="date" value={formAcupuntura.data_consulta} onChange={(v) => handleAcupuntura("data_consulta", v)} />
              <Field label="Técnicas utilizadas" value={formAcupuntura.tecnicas_utilizadas} onChange={(v) => handleAcupuntura("tecnicas_utilizadas", v)} textarea gridSpan={2} />
              <div style={{ gridColumn: "1 / -1" }}>{blocoVisibilidade}</div>
            </div>
          </ModalBody>
          <ModalFooter onSave={salvarProntuario} onPrint={podeGerarPdf ? abrirSeletorPdf : undefined} submitting={submitting} isUpdate={!!existingProntuarioId} />
        </Modal>
      )}

      {/* ── Seletor de seções para PDF ────────────────────────────────────────── */}
      {showPdfSelector && modalType && (
        <PdfSelectorModal
          sections={pdfSectionsData}
          selectedSections={pdfSelectedSections}
          selectedFields={pdfSelectedFields}
          onToggleSection={(key) => {
            const isSelected = pdfSelectedSections.has(key);
            setPdfSelectedSections((prev) => {
              const next = new Set(prev);
              if (isSelected) { next.delete(key); } else { next.add(key); }
              return next;
            });
            if (!isSelected) {
              const section = pdfSectionsData.find((s) => s.key === key);
              if (section) {
                setPdfSelectedFields((prev) => ({
                  ...prev,
                  [key]: new Set(section.fields.map((f) => f.key)),
                }));
              }
            }
          }}
          onToggleField={(sKey, fKey) => {
            setPdfSelectedFields((prev) => {
              const fieldSet = new Set(prev[sKey] || []);
              if (fieldSet.has(fKey)) { fieldSet.delete(fKey); } else { fieldSet.add(fKey); }
              return { ...prev, [sKey]: fieldSet };
            });
            if (!pdfSelectedSections.has(sKey)) {
              setPdfSelectedSections((prev) => new Set([...prev, sKey]));
            }
          }}
          onToggleAll={(all) => {
            if (all) {
              setPdfSelectedSections(new Set(pdfSectionsData.map((s) => s.key)));
              const allFields: Record<string, Set<string>> = {};
              pdfSectionsData.forEach((s) => { allFields[s.key] = new Set(s.fields.map((f) => f.key)); });
              setPdfSelectedFields(allFields);
            } else {
              setPdfSelectedSections(new Set());
              const noFields: Record<string, Set<string>> = {};
              pdfSectionsData.forEach((s) => { noFields[s.key] = new Set(); });
              setPdfSelectedFields(noFields);
            }
          }}
          onConfirm={() => {
            setShowPdfSelector(false);
            imprimirProntuario(pdfSelectedSections, pdfSelectedFields);
          }}
          onCancel={() => setShowPdfSelector(false)}
        />
      )}
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function SectionCheckbox({ checked, indeterminate, onChange }: { checked: boolean; indeterminate: boolean; onChange: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      type="checkbox"
      ref={ref}
      checked={checked}
      onChange={onChange}
      style={{ cursor: "pointer", accentColor: "#E07A6E", width: "14px", height: "14px", flexShrink: 0 }}
    />
  );
}

function PdfSelectorModal({
  sections, selectedSections, selectedFields,
  onToggleSection, onToggleField, onToggleAll, onConfirm, onCancel,
}: {
  sections: Array<{ key: string; label: string; fields: Array<{ key: string; label: string }> }>;
  selectedSections: Set<string>;
  selectedFields: Record<string, Set<string>>;
  onToggleSection: (key: string) => void;
  onToggleField: (sectionKey: string, fieldKey: string) => void;
  onToggleAll: (all: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);
  const allSelected = sections.length > 0 && sections.every((s) => {
    if (!selectedSections.has(s.key)) return false;
    const flds = selectedFields[s.key] || new Set<string>();
    return s.fields.length === 0 || s.fields.every((f) => flds.has(f.key));
  });
  const noneSelected = sections.every((s) => !selectedSections.has(s.key));

  const toggleExpand = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); } else { next.add(key); }
      return next;
    });
  };

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Selecionar conteúdo do PDF" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000 }}>
      <div style={{ background: "#fff", borderRadius: "16px", width: "90%", maxWidth: "520px", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 12px 40px rgba(0,0,0,0.22)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", borderBottom: "0.5px solid #e0dbd2" }}>
          <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#2B1F14" }}>Selecionar conteúdo para impressão</h2>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#9B8E84" }}>Escolha seções e campos específicos para o PDF</p>
        </div>
        <div style={{ padding: "14px 24px", borderBottom: "0.5px solid #f0ece4", display: "flex", gap: "8px" }}>
          <button onClick={() => onToggleAll(true)} style={{ fontSize: "11px", padding: "4px 12px", border: "0.5px solid #d6d0c4", borderRadius: "6px", cursor: "pointer", background: allSelected ? "#E07A6E" : "#fff", color: allSelected ? "#fff" : "#2B1F14", fontWeight: 600 }}>
            Selecionar tudo
          </button>
          <button onClick={() => onToggleAll(false)} style={{ fontSize: "11px", padding: "4px 12px", border: "0.5px solid #d6d0c4", borderRadius: "6px", cursor: "pointer", background: noneSelected ? "#E07A6E" : "#fff", color: noneSelected ? "#fff" : "#2B1F14", fontWeight: 600 }}>
            Remover tudo
          </button>
        </div>
        <div style={{ padding: "10px 24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
          {sections.map((section) => {
            const isSel = selectedSections.has(section.key);
            const sFields = selectedFields[section.key] || new Set<string>();
            const allFieldsSel = section.fields.length === 0 || section.fields.every((f) => sFields.has(f.key));
            const someFieldsSel = section.fields.some((f) => sFields.has(f.key));
            const isExpanded = expanded.has(section.key);
            const hasFields = section.fields.length > 0;
            return (
              <div key={section.key}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", border: `0.5px solid ${isSel ? "#E07A6E" : "#e0dbd2"}`, borderRadius: isExpanded && hasFields ? "8px 8px 0 0" : "8px", background: isSel ? "#fef6f5" : "#fff", transition: "all 0.15s" }}>
                  <SectionCheckbox
                    checked={isSel && allFieldsSel}
                    indeterminate={isSel && !allFieldsSel && someFieldsSel}
                    onChange={() => onToggleSection(section.key)}
                  />
                  <span style={{ flex: 1, fontSize: "12px", fontWeight: 600, color: isSel ? "#2B1F14" : "#6B5E54", cursor: "pointer" }} onClick={() => onToggleSection(section.key)}>
                    {section.label}
                  </span>
                  {hasFields && (
                    <button onClick={() => toggleExpand(section.key)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "#9B8E84", padding: "0 4px", lineHeight: 1, fontWeight: 700 }}>
                      {isExpanded ? "▾" : "▸"}
                    </button>
                  )}
                </div>
                {isExpanded && hasFields && (
                  <div style={{ padding: "8px 12px 8px 36px", border: "0.5px solid #E07A6E", borderTop: "none", borderRadius: "0 0 8px 8px", background: "#fffaf9", display: "flex", flexDirection: "column", gap: "4px" }}>
                    {section.fields.map((field) => {
                      const isFieldSel = sFields.has(field.key);
                      return (
                        <label key={field.key} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", cursor: "pointer", padding: "5px 8px", borderRadius: "6px", background: isFieldSel ? "#fef0ee" : "transparent" }}>
                          <input
                            type="checkbox"
                            checked={isFieldSel}
                            onChange={() => onToggleField(section.key, field.key)}
                            style={{ cursor: "pointer", accentColor: "#E07A6E", width: "12px", height: "12px", flexShrink: 0 }}
                          />
                          <span style={{ color: isFieldSel ? "#2B1F14" : "#9B8E84", fontWeight: isFieldSel ? 600 : 400 }}>{field.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ padding: "16px 24px", borderTop: "0.5px solid #e0dbd2", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <Button variant="ghost" size="sm" onClick={onCancel} style={{ padding: "8px 16px", fontSize: "12px" }}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={noneSelected}
            style={{ padding: "8px 16px", fontSize: "12px" }}
          >
            Gerar PDF ({selectedSections.size} {selectedSections.size === 1 ? "seção" : "seções"})
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "11px", fontWeight: 700, color: "#2B1F14", marginBottom: "8px",
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#2B1F14", gridColumn: "1 / -1" }}>{children}</h3>;
}

function Modal({ titulo, subtitulo, onClose, children }: {
  titulo: string; subtitulo: string; onClose: () => void; children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={titulo} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
      <div style={{ background: "#fff", borderRadius: "16px", width: "95%", maxWidth: "700px", maxHeight: "90vh", overflow: "auto", boxShadow: "0 10px 40px rgba(0,0,0,0.2)", position: "relative" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "24px", borderBottom: "0.5px solid #e0dbd2", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#2B1F14" }}>{titulo}</h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#9B8E84" }}>{subtitulo}</p>
          </div>
          <button type="button" aria-label="Fechar" onClick={onClose} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#9B8E84", lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

function ProgressBar({ total, current, descricao }: { total: number; current: number; descricao: string }) {
  return (
    <div style={{ padding: "16px 24px", borderBottom: "0.5px solid #e0dbd2" }}>
      <div style={{ display: "flex", gap: "8px" }}>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} style={{ flex: 1, height: "6px", background: current >= i + 1 ? "#E07A6E" : "#e0dbd2", borderRadius: "3px", transition: "background 0.2s" }} />
        ))}
      </div>
      <p style={{ fontSize: "11px", color: "#9B8E84", margin: "8px 0 0 0", fontWeight: 600 }}>
        Etapa {current} de {total} — {descricao}
      </p>
    </div>
  );
}

function ModalBody({ errors, children }: { errors: Record<string, string>; children: React.ReactNode }) {
  return (
    <div style={{ padding: "24px" }}>
      {errors.submit && (
        <div style={{ background: "#fee", color: "#c33", padding: "12px", borderRadius: "8px", fontSize: "12px", marginBottom: "16px" }}>
          {errors.submit}
        </div>
      )}
      {children}
    </div>
  );
}

function ModalFooter({ onBack, onNext, onSave, onPrint, submitting, isUpdate }: {
  onBack?: () => void;
  onNext?: () => void;
  onSave?: () => void;
  onPrint?: () => void;
  submitting: boolean;
  isUpdate?: boolean;
}) {
  return (
    <div style={{ padding: "16px 24px", borderTop: "0.5px solid #e0dbd2", display: "flex", gap: "12px", justifyContent: "flex-end", position: "sticky", bottom: 0, background: "#fff" }}>
      {onBack && (
        <Button variant="ghost" size="sm" onClick={onBack} style={{ padding: "8px 16px", fontSize: "12px" }}>
          Anterior
        </Button>
      )}
      {onPrint && (
        <Button variant="ghost" size="sm" onClick={onPrint} style={{ padding: "8px 16px", fontSize: "12px" }}>
          Imprimir PDF
        </Button>
      )}
      {onNext && (
        <Button size="sm" onClick={onNext} style={{ padding: "8px 16px", fontSize: "12px" }}>
          Próximo
        </Button>
      )}
      {onSave && (
        <Button size="sm" onClick={onSave} disabled={submitting} style={{ padding: "8px 16px", fontSize: "12px" }}>
          {submitting ? "Salvando..." : isUpdate ? "Atualizar Prontuário" : "Salvar Prontuário"}
        </Button>
      )}
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

type FieldProps = {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; error?: string; disabled?: boolean;
  textarea?: boolean; gridSpan?: number;
  options?: { value: string; label: string }[];
};

function Field({ label, value, onChange, type = "text", error, disabled = false, textarea = false, gridSpan = 1, options }: FieldProps) {
  const border = error ? "1px solid #c33" : "0.5px solid #d6d0c4";
  const base: React.CSSProperties = { width: "100%", padding: "10px 12px", border, borderRadius: "8px", fontSize: "12px", fontFamily: "inherit", opacity: disabled ? 0.6 : 1 };
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const campoId = useId();
  const erroId = `${campoId}-erro`;
  const ariaCampo = { id: campoId, "aria-invalid": error ? true : undefined, "aria-describedby": error ? erroId : undefined };

  useEffect(() => {
    if (!textarea || !textareaRef.current) return;
    const el = textareaRef.current;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [textarea, value]);

  const handleTextareaInput = () => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  return (
    <div style={{ gridColumn: gridSpan > 1 ? "1 / -1" : undefined }}>
      <label htmlFor={campoId} style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#2B1F14", marginBottom: "6px" }}>{label}</label>
      {textarea ? (
        <textarea
          {...ariaCampo}
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onInput={handleTextareaInput}
          disabled={disabled}
          style={{ ...base, minHeight: "60px", resize: "none", overflow: "hidden" }}
        />
      ) : options ? (
        <select {...ariaCampo} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} style={{ ...base, background: disabled ? "#f7f7f7" : "#fff" }}>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input {...ariaCampo} type={type} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} style={base} />
      )}
      {error && <p id={erroId} role="alert" style={{ fontSize: "11px", color: "#c33", margin: "4px 0 0 0" }}>{error}</p>}
    </div>
  );
}

// ─── CheckboxGroup ────────────────────────────────────────────────────────────

type CheckboxGroupProps = {
  items: { key: CheckboxFieldKey; label: string }[];
  form: FormAnamnese;
  onChange: (field: CheckboxFieldKey, checked: boolean) => void;
};

function CheckboxGroup({ items, form, onChange }: CheckboxGroupProps) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
      {items.map((item) => (
        <label key={item.key} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", cursor: "pointer" }}>
          <input type="checkbox" checked={Boolean(form[item.key])} onChange={(e) => onChange(item.key, e.target.checked)} style={{ cursor: "pointer" }} />
          {item.label}
        </label>
      ))}
    </div>
  );
}

// ─── MultiSelectGroup ─────────────────────────────────────────────────────────

function MultiSelectGroup({ value, options, onChange }: { value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  const selected = value ? value.split(" | ").map((s) => s.trim()).filter(Boolean) : [];
  const toggle = (label: string) => {
    const next = selected.includes(label) ? selected.filter((s) => s !== label) : [...selected, label];
    onChange(next.join(" | "));
  };
  return (
    <div style={{ display: "grid", gap: "8px" }}>
      {options.map((o) => (
        <label key={o.value} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12px", cursor: "pointer", lineHeight: 1.35 }}>
          <input type="checkbox" checked={selected.includes(o.label)} onChange={() => toggle(o.label)} style={{ cursor: "pointer", marginTop: "2px" }} />
          <span>{o.label}</span>
        </label>
      ))}
    </div>
  );
}
