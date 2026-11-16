import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  chaveDia,
  chaveMes,
  diasDeCalendarioEntre,
  inicioDoDia,
  somarDias,
} from './datas';
import type { PeriodoDashboard } from './dto/dashboard-query.dto';

/** Mapa ordenado `AAAA-MM-DD → 0` com os últimos `diasAtras + 1` dias. */
function mapaDeDias(hoje: Date, diasAtras: number): Map<string, number> {
  const dias = new Map<string, number>();
  for (let i = diasAtras; i >= 0; i--) {
    dias.set(chaveDia(somarDias(hoje, -i)), 0);
  }
  return dias;
}

function contarPorDia(dias: Map<string, number>, datas: Date[]) {
  for (const data of datas) {
    const chave = chaveDia(data);
    const atual = dias.get(chave);
    if (atual !== undefined) dias.set(chave, atual + 1);
  }
  return Array.from(dias.entries()).map(([data, total]) => ({ data, total }));
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(
    userId: string,
    perfis: string[],
    periodo: PeriodoDashboard = 'semana',
  ) {
    if (perfis.includes('GESTORA')) return this.getGestoraStats(periodo);
    if (perfis.includes('TRIADORA')) return this.getTriadoraStats(periodo);
    return this.getProfissionalStats(userId, periodo);
  }

  private getDateRange(periodo: PeriodoDashboard) {
    const agora = new Date();
    const hoje = inicioDoDia(agora);
    const amanha = somarDias(hoje, 1);
    if (periodo === 'hoje') return { inicio: hoje, fim: amanha, diasAtras: 0 };
    if (periodo === 'semana') {
      return { inicio: somarDias(hoje, -6), fim: amanha, diasAtras: 6 };
    }
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    return { inicio: inicioMes, fim: amanha, diasAtras: agora.getDate() - 1 };
  }

  private async getGestoraStats(periodo: PeriodoDashboard) {
    const agora = new Date();
    const range = this.getDateRange(periodo);
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const hoje = inicioDoDia(agora);
    const amanha = somarDias(hoje, 1);
    const seisMesesAtras = new Date(
      agora.getFullYear(),
      agora.getMonth() - 5,
      1,
    );

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
      this.prisma.beneficiarias.count({
        where: { status: 'ATIVA', deletado_em: null },
      }),
      this.prisma.triagens.count({
        where: { criado_em: { gte: range.inicio, lt: range.fim } },
      }),
      this.prisma.encaminhamentos.count({ where: { status: 'PENDENTE' } }),
      this.prisma.doacoes.aggregate({
        _sum: { valor: true },
        where: { criado_em: { gte: inicioMes } },
      }),
      this.prisma.agendamentos.findMany({
        where: {
          status: 'REALIZADO',
          data_hora: { gte: range.inicio, lt: range.fim },
        },
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
    const atendimentosPorDia = contarPorDia(
      mapaDeDias(hoje, range.diasAtras),
      agendamentosRealizados.map((ag) => ag.data_hora),
    );

    // Doações por mês — últimos 6 meses
    const mesesMap = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
      mesesMap.set(chaveMes(d), 0);
    }
    for (const d of doacoesPorMesRaw) {
      if (!d.criado_em) continue;
      const key = chaveMes(d.criado_em);
      if (mesesMap.has(key))
        mesesMap.set(key, (mesesMap.get(key) ?? 0) + Number(d.valor ?? 0));
    }

    return {
      perfil: 'GESTORA' as const,
      metricas: {
        totalBeneficiariasAtivas,
        triagensMes,
        encaminhamentosPendentes,
        doacoesMesTotal: Number(doacoesMes._sum.valor ?? 0),
      },
      atendimentosPorDia,
      encaminhamentosPorEspecialidade: encaminhamentosGrouped.map((e) => ({
        especialidade: e.especialidade,
        total: e._count._all,
      })),
      doacoesPorMes: Array.from(mesesMap.entries()).map(([mes, total]) => ({
        mes,
        total,
      })),
      filaEspera,
      agendamentosHoje,
      bazaresNoPeriodo: bazaresRaw.map((b) => ({
        nome: b.nome,
        // Coluna DATE: o Prisma a entrega como meia-noite UTC, então aqui a
        // chave em UTC é a correta.
        data: b.data.toISOString().split('T')[0],
        total: Number(b.total_arrecadado ?? 0),
      })),
    };
  }

  private async getTriadoraStats(periodo: PeriodoDashboard) {
    const agora = new Date();
    const range = this.getDateRange(periodo);
    const hoje = inicioDoDia(agora);
    const amanha = somarDias(hoje, 1);

    const [
      triagensHoje,
      triagensMes,
      encaminhamentosPendentes,
      beneficiariasEmEspera,
      triagensSemanaRaw,
      encaminhamentosGrouped,
      filaEspera,
    ] = await Promise.all([
      this.prisma.triagens.count({
        where: { criado_em: { gte: hoje, lt: amanha } },
      }),
      this.prisma.triagens.count({
        where: { criado_em: { gte: range.inicio, lt: range.fim } },
      }),
      this.prisma.encaminhamentos.count({ where: { status: 'PENDENTE' } }),
      this.prisma.beneficiarias.count({
        where: { status: 'EM_ESPERA', deletado_em: null },
      }),
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

    const triagensPorDia = contarPorDia(
      mapaDeDias(hoje, range.diasAtras),
      triagensSemanaRaw.flatMap((t) => (t.criado_em ? [t.criado_em] : [])),
    );

    return {
      perfil: 'TRIADORA' as const,
      metricas: {
        triagensHoje,
        triagensMes,
        encaminhamentosPendentes,
        beneficiariasEmEspera,
      },
      triagensPorDia,
      encaminhamentosPorEspecialidade: encaminhamentosGrouped.map((e) => ({
        especialidade: e.especialidade,
        total: e._count._all,
      })),
      filaEspera,
    };
  }

  private async getProfissionalStats(
    userId: string,
    periodo: PeriodoDashboard,
  ) {
    const agora = new Date();
    const range = this.getDateRange(periodo);
    const hoje = inicioDoDia(agora);
    const amanha = somarDias(hoje, 1);
    const quatroSemanasAtras = somarDias(hoje, -27);

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
        where: {
          profissional_id: userId,
          data_hora: { gte: hoje, lt: amanha },
        },
      }),
      this.prisma.agendamentos.count({
        where: {
          profissional_id: userId,
          data_hora: { gte: hoje, lt: amanha },
          status: 'CONFIRMADO',
        },
      }),
      this.prisma.agendamentos.count({
        where: {
          profissional_id: userId,
          status: 'REALIZADO',
          data_hora: { gte: range.inicio, lt: range.fim },
        },
      }),
      this.prisma.agendamentos.count({
        where: {
          profissional_id: userId,
          status: 'CANCELADO',
          data_hora: { gte: range.inicio, lt: range.fim },
        },
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
        where: {
          profissional_id: userId,
          data_hora: { gte: hoje, lt: amanha },
        },
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

    // Atendimentos realizados por semana — últimas 4 semanas, em blocos de 7
    // dias de calendário contados a partir de hoje (hoje = 0 dias atrás).
    const labels = ['Há 3 sem.', 'Há 2 sem.', 'Sem. pas.', 'Esta sem.'];
    const totals = [0, 0, 0, 0];
    for (const ag of agendamentosRealizadosRaw) {
      const diasAtras = diasDeCalendarioEntre(ag.data_hora, hoje);
      if (diasAtras < 0) continue;
      const semanasAtras = Math.min(3, Math.floor(diasAtras / 7));
      totals[3 - semanasAtras]++;
    }

    return {
      perfil: 'PROFISSIONAL' as const,
      metricas: {
        agendamentosHoje: agendamentosHojeCount,
        confirmadosHoje,
        realizadosMes,
        canceladosMes,
      },
      agendamentosPorStatus: agendamentosGroupedStatus.map((s) => ({
        status: s.status ?? 'DESCONHECIDO',
        total: s._count._all,
      })),
      atendimentosPorSemana: labels.map((semana, i) => ({
        semana,
        total: totals[i],
      })),
      agendamentosHoje,
    };
  }
}
