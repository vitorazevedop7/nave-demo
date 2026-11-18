import type { KeyboardEvent } from 'react';
import type { Agendamento } from '@/lib/agendamentos';

export type View = 'month' | 'week' | 'day';

/** Torna um elemento não-button acionável por teclado (Enter/Espaço). */
export function comoBotao(onAtivar: () => void) {
  return {
    role: 'button' as const,
    tabIndex: 0,
    onClick: onAtivar,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onAtivar();
      }
    },
  };
}

export const HORAS = Array.from({ length: 19 }, (_, i) => i + 5); // 05 – 23
export const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

export function isoLocal(dt: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T00:00:00`;
}

export function startOfWeek(d: Date): Date {
  const dt = new Date(d);
  dt.setDate(dt.getDate() - dt.getDay());
  dt.setHours(0, 0, 0, 0);
  return dt;
}

export function calcularRange(view: View, cursor: Date): { inicio: Date; fim: Date } {
  if (view === 'month') {
    const inicio = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const fim = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59);
    return { inicio, fim };
  }
  if (view === 'week') {
    const inicio = startOfWeek(cursor);
    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 6);
    fim.setHours(23, 59, 59);
    return { inicio, fim };
  }
  // day
  const inicio = new Date(cursor);
  inicio.setHours(0, 0, 0, 0);
  const fim = new Date(cursor);
  fim.setHours(23, 59, 59);
  return { inicio, fim };
}

export function moverCursor(view: View, cursor: Date, delta: -1 | 1): Date {
  const d = new Date(cursor);
  if (view === 'month') d.setMonth(d.getMonth() + delta);
  else if (view === 'week') d.setDate(d.getDate() + delta * 7);
  else d.setDate(d.getDate() + delta);
  return d;
}

export function formatarTituloView(view: View, cursor: Date): string {
  if (view === 'month') return `${MESES[cursor.getMonth()]} ${cursor.getFullYear()}`;
  if (view === 'week') {
    const ini = startOfWeek(cursor);
    const fim = new Date(ini); fim.setDate(fim.getDate() + 6);
    return `${ini.getDate()} – ${fim.getDate()} de ${MESES[fim.getMonth()]} ${fim.getFullYear()}`;
  }
  return cursor.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function agruparPorDia(agendamentos: Agendamento[]): Map<string, Agendamento[]> {
  const map = new Map<string, Agendamento[]>();
  for (const a of agendamentos) {
    const key = new Date(a.data_hora).toDateString();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(a);
  }
  return map;
}

export function corStatus(status: string): { bg: string; text: string } {
  const map: Record<string, { bg: string; text: string }> = {
    AGENDADO:   { bg: '#dbeafe', text: '#1d4ed8' },
    CONFIRMADO: { bg: '#e0f2fe', text: '#0369a1' },
    REALIZADO:  { bg: '#dcfce7', text: '#16a34a' },
    CANCELADO:  { bg: '#f1f5f9', text: '#64748b' },
  };
  return map[status] ?? { bg: '#f1f5f9', text: '#64748b' };
}

export function obterTituloAgendamento(ag: Agendamento): string {
  // 1. Se tiver beneficiária, é um agendamento normal (mostra o nome dela)
  if (ag.beneficiarias?.nome) {
    return ag.beneficiarias.nome;
  }

  // 2. Se não tiver, verifica se tem o nome do Bazar nas observações
  if (ag.observacoes && ag.observacoes.includes('Bazar:')) {
    return ag.observacoes.replace(/^\[bazar:[^\]]+\]\s*/, '');
  }

  // 3. Caso seja um evento bloqueado/genérico sem nome
  return 'Horário Reservado';
}

/** Dias do mês do cursor, com null para completar as semanas. */
export function gerarDiasCalendario(cursor: Date): (Date | null)[] {
  const ano = cursor.getFullYear();
  const mes = cursor.getMonth();
  const primeiroDia = new Date(ano, mes, 1).getDay();
  const totalDias = new Date(ano, mes + 1, 0).getDate();
  const dias: (Date | null)[] = Array(primeiroDia).fill(null);
  for (let d = 1; d <= totalDias; d++) dias.push(new Date(ano, mes, d));
  while (dias.length % 7 !== 0) dias.push(null);
  return dias;
}
