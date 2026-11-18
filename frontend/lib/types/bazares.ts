export interface BazarUsuario {
  id: string;
  nome: string;
  especialidade: string | null;
  email: string;
}

export interface BazarProfissional {
  id: string;
  usuarios: BazarUsuario;
}

export interface Bazar {
  id: string;
  nome: string;
  /** Data pura (coluna `date`), ver `lib/date.ts`. */
  data: string;
  horario_inicio: string | null;
  horario_fim: string | null;
  local: string | null;
  descricao: string | null;
  /** Coluna Decimal: o Prisma serializa como string ("915.5"). Converta com Number() antes de somar. */
  total_arrecadado: number | string | null;
  observacoes: string | null;
  criado_em: string;
  usuarios: { id: string; nome: string } | null;
  bazar_profissionais: BazarProfissional[];
}
