import { fetchAuth } from './auth';
import { API_BASE } from './api';

const API = API_BASE;

export interface FilaItem {
  id: string;
  nome: string;
  criado_em: string;
}

export interface AgendaItem {
  id: string;
  data_hora: string;
  status: string;
  beneficiarias: { nome: string } | null;
  usuarios: { nome: string; especialidade: string | null } | null;
  encaminhamentos?: { especialidade: string } | null;
}

export interface GestoraStats {
  perfil: 'GESTORA';
  metricas: {
    totalBeneficiariasAtivas: number;
    triagensMes: number;
    encaminhamentosPendentes: number;
    doacoesMesTotal: number;
  };
  atendimentosPorDia: Array<{ data: string; total: number }>;
  encaminhamentosPorEspecialidade: Array<{ especialidade: string; total: number }>;
  doacoesPorMes: Array<{ mes: string; total: number }>;
  filaEspera: FilaItem[];
  agendamentosHoje: AgendaItem[];
  bazaresNoPeriodo: Array<{ nome: string; data: string; total: number }>;
}

export interface TriadoraStats {
  perfil: 'TRIADORA';
  metricas: {
    triagensHoje: number;
    triagensMes: number;
    encaminhamentosPendentes: number;
    beneficiariasEmEspera: number;
  };
  triagensPorDia: Array<{ data: string; total: number }>;
  encaminhamentosPorEspecialidade: Array<{ especialidade: string; total: number }>;
  filaEspera: FilaItem[];
}

export interface ProfissionalStats {
  perfil: 'PROFISSIONAL';
  metricas: {
    agendamentosHoje: number;
    confirmadosHoje: number;
    realizadosMes: number;
    canceladosMes: number;
  };
  agendamentosPorStatus: Array<{ status: string; total: number }>;
  atendimentosPorSemana: Array<{ semana: string; total: number }>;
  agendamentosHoje: AgendaItem[];
}

export type DashboardStats = GestoraStats | TriadoraStats | ProfissionalStats;

export async function fetchDashboardStats(period: 'hoje' | 'semana' | 'mes' = 'semana'): Promise<DashboardStats> {
  const res = await fetchAuth(`${API}/dashboard/stats?period=${period}`);
  if (!res.ok) throw new Error('Erro ao buscar dados do dashboard');
  return res.json() as Promise<DashboardStats>;
}
