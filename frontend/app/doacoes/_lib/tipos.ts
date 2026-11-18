export interface Doador {
  id: string;
  nome: string;
  tipo: string | null;
  telefone: string | null;
  email: string | null;
}

export interface Campanha {
  id: string;
  nome: string;
  descricao: string | null;
  meta_valor: number | null;
  criado_em: string;
  encerrada_em: string | null;
  _count?: { doacoes: number };
  total_arrecadado?: number;
}

export interface Doacao {
  id: string;
  tipo: string;
  valor: number | null;
  quantidade: string | null;
  data: string;
  observacao: string | null;
  criado_em: string;
  campanha_id: string | null;
  doadores: Doador | null;
  campanhas_doacoes: { nome: string } | null;
}

export type ModalType = "doacao" | "doador" | "campanha" | "gerenciar-doadores" | null;

export interface FormDoacao {
  doador_id: string;
  tipo: string;
  valor: string;
  quantidade: string;
  data: string;
  observacao: string;
  campanha_id: string;
}

export interface FormDoador {
  nome: string;
  tipo: string;
  telefone: string;
  email: string;
}

export interface FormCampanha {
  nome: string;
  descricao: string;
  meta_valor: string;
}

export interface ExclusaoPendente {
  type: "doacao" | "doador" | "campanha";
  id: string;
  name?: string;
}
