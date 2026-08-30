import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(userId: string, perfis: string[], period: 'hoje' | 'semana' | 'mes' = 'semana') {
    if (perfis.includes('GESTORA')) return this.getGestoraStats(period);
    if (perfis.includes('TRIADORA')) return this.getTriadoraStats(period);
    return this.getProfissionalStats(userId, period);
  }

  private getDateRange(period: 'hoje' | 'semana' | 'mes') {
    const agora = new Date();
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const amanha = new Date(hoje.getTime() + 24 * 60 * 60 * 1000);
    if (period === 'hoje') return { inicio: hoje, fim: amanha, diasAtras: 0 };
    if (period === 'semana') return { inicio: new Date(hoje.getTime() - 6 * 24 * 60 * 60 * 1000), fim: amanha, diasAtras: 6 };
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    return { inicio: inicioMes, fim: amanha, diasAtras: agora.getDate() - 1 };
  }

  private async getGestoraStats(period: 'hoje' | 'semana' | 'mes') {
    const agora = new Date();
    const range = this.getDateRange(period);
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const amanha = new Date(hoje.getTime() + 24 * 60 * 60 * 1000);
    const seisMesesAtras = new Date(agora.getFullYear(), agora.getMonth() - 5, 1);

    const [
      totalBeneficiariasAtivas,
      triagensMes,
      encaminhamentosPendentes,
      doacoesMes,
      agendamentosRealizados,
      encaminhamentosGrouped,
      doacoesPorMesRaw,
      filaEspera,
      agendamentosHoje,
      bazaresRaw,
    ] = await Promise.all([
      this.prisma.beneficiarias.count({ where: { status: 'ATIVA', deletado_em: null } }),
      this.prisma.triagens.count({ where: { criado_em: { gte: range.inicio, lt: range.fim } } }),
      this.prisma.encaminhamentos.count({ where: { status: 'PENDENTE' } }),
      this.prisma.doacoes.aggregate({
        _sum: { valor: true },
        where: { criado_em: { gte: inicioMes } },
      }),
      this.prisma.agendamentos.findMany({
        where: { status: 'REALIZADO', data_hora: { gte: range.inicio, lt: range.fim } },
        select: { data_hora: true },
      }),
      this.prisma.encaminhamentos.groupBy({
        by: ['especialidade'],
        _count: { _all: true },
      }),
      this.prisma.doacoes.findMany({
        where: { criado_em: { gte: seisMesesAtras } },
        select: { valor: true, criado_em: true },
      }),
      this.prisma.beneficiarias.findMany({
        where: { status: 'EM_ESPERA', deletado_em: null },
        select: { id: true, nome: true, criado_em: true },
        orderBy: { criado_em: 'asc' },
        take: 6,
      }),
      this.prisma.agendamentos.findMany({
        where: { data_hora: { gte: hoje, lt: amanha } },
        select: {
          id: true,
          data_hora: true,
          status: true,
          beneficiarias: { select: { nome: true } },
          usuarios: { select: { nome: true, especialidade: true } },
        },
        orderBy: { data_hora: 'asc' },
      }),
      this.prisma.bazares.findMany({
        where: { data: { gte: range.inicio, lt: range.fim } },
        select: { id: true, nome: true, data: true, total_arrecadado: true },
        orderBy: { data: 'asc' },
      }),
    ]);

    // Atendimentos por dia — janela do período selecionado
    const diasMap = new Map<string, number>();
    for (let i = range.diasAtras; i >= 0; i--) {
      const d = new Date(hoje.getTime() - i * 24 * 60 * 60 * 1000);
      diasMap.set(d.toISOString().split('T')[0], 0);
    }
    for (const ag of agendamentosRealizados) {
      const key = ag.data_hora.toISOString().split('T')[0];
      if (diasMap.has(key)) diasMap.set(key, (diasMap.get(key) ?? 0) + 1);
    }

    // Doações por mês — últimos 6 meses
    const mesesMap = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      mesesMap.set(key, 0);
    }
    for (const d of doacoesPorMesRaw) {
      if (!d.criado_em) continue;
      const key = `${d.criado_em.getFullYear()}-${String(d.criado_em.getMonth() + 1).padStart(2, '0')}`;
      if (mesesMap.has(key)) mesesMap.set(key, (mesesMap.get(key) ?? 0) + Number(d.valor ?? 0));
    }

    return {
      perfil: 'GESTORA',
      metricas: {
        totalBeneficiariasAtivas,
        triagensMes,
        encaminhamentosPendentes,
        doacoesMesTotal: Number(doacoesMes._sum.valor ?? 0),
      },
      atendimentosPorDia: Array.from(diasMap.entries()).map(([data, total]) => ({ data, total })),
      encaminhamentosPorEspecialidade: encaminhamentosGrouped.map((e) => ({
        especialidade: e.especialidade,
        total: e._count._all,
      })),
      doacoesPorMes: Array.from(mesesMap.entries()).map(([mes, total]) => ({ mes, total })),
      filaEspera,
      agendamentosHoje,
      bazaresNoPeriodo: bazaresRaw.map((b) => ({
        nome: b.nome,
        data: b.data.toISOString().split('T')[0],
        total: Number(b.total_arrecadado ?? 0),
      })),
    };
  }

  private async getTriadoraStats(period: 'hoje' | 'semana' | 'mes') {
    const agora = new Date();
    const range = this.getDateRange(period);
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const amanha = new Date(hoje.getTime() + 24 * 60 * 60 * 1000);

    const [
      triagensHoje,
      triagensMes,
      encaminhamentosPendentes,
      beneficiariasEmEspera,
      triagensSemanaRaw,
      encaminhamentosGrouped,
      filaEspera,
    ] = await Promise.all([
      this.prisma.triagens.count({ where: { criado_em: { gte: hoje, lt: amanha } } }),
      this.prisma.triagens.count({ where: { criado_em: { gte: range.inicio, lt: range.fim } } }),
      this.prisma.encaminhamentos.count({ where: { status: 'PENDENTE' } }),
      this.prisma.beneficiarias.count({ where: { status: 'EM_ESPERA', deletado_em: null } }),
      this.prisma.triagens.findMany({
        where: { criado_em: { gte: range.inicio, lt: range.fim } },
        select: { criado_em: true },
      }),
      this.prisma.encaminhamentos.groupBy({
        by: ['especialidade'],
        _count: { _all: true },
      }),
      this.prisma.beneficiarias.findMany({
        where: { status: 'EM_ESPERA', deletado_em: null },
        select: { id: true, nome: true, criado_em: true },
        orderBy: { criado_em: 'asc' },
        take: 6,
      }),
    ]);

    const diasMap = new Map<string, number>();
    for (let i = range.diasAtras; i >= 0; i--) {
      const d = new Date(hoje.getTime() - i * 24 * 60 * 60 * 1000);
      diasMap.set(d.toISOString().split('T')[0], 0);
    }
    for (const t of triagensSemanaRaw) {
      if (!t.criado_em) continue;
      const key = t.criado_em.toISOString().split('T')[0];
      if (diasMap.has(key)) diasMap.set(key, (diasMap.get(key) ?? 0) + 1);
    }

    return {
      perfil: 'TRIADORA',
      metricas: { triagensHoje, triagensMes, encaminhamentosPendentes, beneficiariasEmEspera },
      triagensPorDia: Array.from(diasMap.entries()).map(([data, total]) => ({ data, total })),
      encaminhamentosPorEspecialidade: encaminhamentosGrouped.map((e) => ({
        especialidade: e.especialidade,
        total: e._count._all,
      })),
      filaEspera,
    };
  }

  private async getProfissionalStats(userId: string, period: 'hoje' | 'semana' | 'mes') {
    const agora = new Date();
    const range = this.getDateRange(period);
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const amanha = new Date(hoje.getTime() + 24 * 60 * 60 * 1000);
    const quatroSemanasAtras = new Date(hoje.getTime() - 27 * 24 * 60 * 60 * 1000);

    const [
      agendamentosHojeCount,
      confirmadosHoje,
      realizadosMes,
      canceladosMes,
      agendamentosGroupedStatus,
      agendamentosRealizadosRaw,
      agendamentosHoje,
    ] = await Promise.all([
      this.prisma.agendamentos.count({
        where: { profissional_id: userId, data_hora: { gte: hoje, lt: amanha } },
      }),
      this.prisma.agendamentos.count({
        where: { profissional_id: userId, data_hora: { gte: hoje, lt: amanha }, status: 'CONFIRMADO' },
      }),
      this.prisma.agendamentos.count({
        where: { profissional_id: userId, status: 'REALIZADO', data_hora: { gte: range.inicio, lt: range.fim } },
      }),
      this.prisma.agendamentos.count({
        where: { profissional_id: userId, status: 'CANCELADO', data_hora: { gte: range.inicio, lt: range.fim } },
      }),
      this.prisma.agendamentos.groupBy({
        by: ['status'],
        _count: { _all: true },
        where: { profissional_id: userId },
      }),
      this.prisma.agendamentos.findMany({
        where: {
          profissional_id: userId,
          status: 'REALIZADO',
          data_hora: { gte: quatroSemanasAtras, lt: amanha },
        },
        select: { data_hora: true },
      }),
      this.prisma.agendamentos.findMany({
        where: { profissional_id: userId, data_hora: { gte: hoje, lt: amanha } },
        select: {
          id: true,
          data_hora: true,
          status: true,
          beneficiarias: { select: { nome: true } },
          encaminhamentos: { select: { especialidade: true } },
        },
        orderBy: { data_hora: 'asc' },
      }),
    ]);

    // Atendimentos realizados por semana — últimas 4 semanas
    const labels = ['Há 3 sem.', 'Há 2 sem.', 'Sem. pas.', 'Esta sem.'];
    const totals = [0, 0, 0, 0];
    for (const ag of agendamentosRealizadosRaw) {
      const diffDays = Math.floor((hoje.getTime() - ag.data_hora.getTime()) / (24 * 60 * 60 * 1000));
      const weekIdx = Math.min(3, Math.floor(diffDays / 7));
      totals[3 - weekIdx]++;
    }

    return {
      perfil: 'PROFISSIONAL',
      metricas: { agendamentosHoje: agendamentosHojeCount, confirmadosHoje, realizadosMes, canceladosMes },
      agendamentosPorStatus: agendamentosGroupedStatus.map((s) => ({
        status: s.status ?? 'DESCONHECIDO',
        total: s._count._all,
      })),
      atendimentosPorSemana: labels.map((semana, i) => ({ semana, total: totals[i] })),
      agendamentosHoje,
    };
  }
}
