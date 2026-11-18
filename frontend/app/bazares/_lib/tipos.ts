export interface UserInfo {
  id: string;
  perfis?: string[];
}

export interface FormBazar {
  nome: string;
  data: string;
  horario_inicio: string;
  horario_fim: string;
  local: string;
  descricao: string;
  observacoes: string;
  total_arrecadado: string;
  profissional_ids: string[];
}

export const FORM_BAZAR_VAZIO: FormBazar = {
  nome: "",
  data: "",
  horario_inicio: "",
  horario_fim: "",
  local: "",
  descricao: "",
  observacoes: "",
  total_arrecadado: "",
  profissional_ids: [],
};
