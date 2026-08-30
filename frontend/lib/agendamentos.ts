import { fetchAuth } from './auth';
import { API_BASE } from './api';

const API = API_BASE;

export interface Agendamento {
  id: string;
  beneficiaria_id: string;
  profissional_id: string;
  encaminhamento_id: string | null;
  data_hora: string;
  status: string;
  observacoes: string | null;
  criado_em: string;
  beneficiarias?: { id: string; nome: string; telefone: string | null };
  usuarios?: { id: string; nome: string; especialidade: string | null };
  encaminhamentos?: { id: string; especialidade: string; status: string } | null;
  avisos?: string[];
}

export interface Profissional {
  id: string;
  nome: string;
  especialidade: string | null;
}

export const STATUS_AGENDAMENTO = [
  'AGENDADO',
  'CONFIRMADO',
  'REALIZADO',
  'CANCELADO',
] as const;

export type StatusAgendamento = (typeof STATUS_AGENDAMENTO)[number];

export interface ListarParams {
  data_inicio?: string;
  data_fim?: string;
  profissional_id?: string;
  beneficiaria_id?: string;
  status?: string;
}

export async function listarAgendamentos(params: ListarParams = {}): Promise<Agendamento[]> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v); });
  const res = await fetchAuth(`${API}/agendamentos?${qs}`);
  if (!res.ok) throw new Error('Erro ao buscar agendamentos');
  return res.json();
}

export async function buscarAgendamento(id: string): Promise<Agendamento> {
  const res = await fetchAuth(`${API}/agendamentos/${id}`);
  if (!res.ok) throw new Error('Agendamento não encontrado');
  return res.json();
}

export async function criarAgendamento(dto: {
  beneficiaria_id: string;
  profissional_id: string;
  encaminhamento_id?: string;
  data_hora: string;
  status?: string;
  observacoes?: string;
}): Promise<Agendamento> {
  const res = await fetchAuth(`${API}/agendamentos`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? 'Erro ao criar agendamento');
  }
  return res.json();
}

export async function editarAgendamento(
  id: string,
  dto: Partial<{
    beneficiaria_id: string;
    profissional_id: string;
    encaminhamento_id: string;
    data_hora: string;
    status: string;
    observacoes: string;
  }>,
): Promise<Agendamento> {
  const res = await fetchAuth(`${API}/agendamentos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? 'Erro ao editar agendamento');
  }
  return res.json();
}

export async function excluirAgendamento(id: string): Promise<void> {
  const res = await fetchAuth(`${API}/agendamentos/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erro ao excluir agendamento');
}

export async function meusAgendamentos(): Promise<Agendamento[]> {
  const res = await fetchAuth(`${API}/agendamentos/meus`);
  if (!res.ok) throw new Error('Erro ao buscar agendamentos');
  return res.json();
}

export async function listarProfissionais(): Promise<Profissional[]> {
  const res = await fetchAuth(`${API}/usuarios/profissionais`);
  if (!res.ok) throw new Error('Erro ao buscar profissionais');
  return res.json();
}
