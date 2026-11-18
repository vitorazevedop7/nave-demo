import type { Visibilidade } from "@/lib/visibilidade";

export interface Agendamento {
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

export interface UsuarioLogado {
  id: string;
  nome: string;
  especialidade: string | null;
  perfis?: string[];
}

export interface ProntuarioView {
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

export type OrigemAcessoProntuario =
  | "COMPARTILHADO_COM_VOCE"
  | "ESPECIALIDADE"
  | "GESTORAS"
  | "EQUIPE_CLINICA";

export interface OutroProntuarioResumo {
  id: string;
  especialidade: string;
  criado_em?: string;
  origem_acesso: OrigemAcessoProntuario;
  beneficiarias: { id: string; nome: string };
  usuarios: { nome: string };
}

export type ResultadoBuscaAgendamento =
  | { estado: "AUSENTE" }
  | { estado: "RESTRITO"; prontuario: ProntuarioView }
  | { estado: "DISPONIVEL"; prontuario: ProntuarioView };

export type CheckboxFieldKey =
  | "orientacao_autoidentificatoria" | "orientacao_corporal" | "orientacao_temporal"
  | "orientacao_espacial" | "orientacao_patologia" | "pensamento_acelerado"
  | "pensamento_retardado" | "pensamento_fuga" | "pensamento_bloqueio"
  | "pensamento_prolixo" | "pensamento_repeticao" | "conteudo_obsessoes"
  | "conteudo_hipocondrias" | "conteudo_fobias" | "conteudo_delirios";
