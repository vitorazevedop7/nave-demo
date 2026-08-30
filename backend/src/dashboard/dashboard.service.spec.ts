import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

const MOCK_UUID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

function makeDate(daysOffset: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(10, 0, 0, 0);
  return d;
}

describe('DashboardService', () => {
  let service: DashboardService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      beneficiarias:    { count: jest.fn(), findMany: jest.fn() },
      triagens:         { count: jest.fn(), findMany: jest.fn() },
      encaminhamentos:  { count: jest.fn(), groupBy: jest.fn() },
      doacoes:          { aggregate: jest.fn(), findMany: jest.fn() },
      agendamentos:     { count: jest.fn(), findMany: jest.fn(), groupBy: jest.fn() },
      bazares:          { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── Roteamento por perfil ────────────────────────────────────────────

  describe('getStats — roteamento por perfil', () => {
    function setupGestoraReturns() {
      mockPrisma.beneficiarias.count.mockResolvedValue(10);
      mockPrisma.triagens.count.mockResolvedValue(5);
      mockPrisma.encaminhamentos.count.mockResolvedValue(2);
      mockPrisma.doacoes.aggregate.mockResolvedValue({ _sum: { valor: 500 } });
      mockPrisma.agendamentos.findMany.mockResolvedValue([]);
      mockPrisma.encaminhamentos.groupBy.mockResolvedValue([]);
      mockPrisma.doacoes.findMany.mockResolvedValue([]);
      mockPrisma.beneficiarias.findMany.mockResolvedValue([]);
      mockPrisma.bazares.findMany.mockResolvedValue([]);
    }

    function setupTriadoraReturns() {
      mockPrisma.triagens.count.mockResolvedValue(3);
      mockPrisma.encaminhamentos.count.mockResolvedValue(1);
      mockPrisma.beneficiarias.count.mockResolvedValue(4);
      mockPrisma.triagens.findMany.mockResolvedValue([]);
      mockPrisma.encaminhamentos.groupBy.mockResolvedValue([]);
      mockPrisma.beneficiarias.findMany.mockResolvedValue([]);
    }

    function setupProfissionalReturns() {
      mockPrisma.agendamentos.count.mockResolvedValue(3);
      mockPrisma.agendamentos.groupBy.mockResolvedValue([]);
      mockPrisma.agendamentos.findMany.mockResolvedValue([]);
    }

    it('retorna perfil GESTORA quando perfis inclui GESTORA', async () => {
      setupGestoraReturns();
      const result = await service.getStats(MOCK_UUID, ['GESTORA'], 'semana');
      expect(result.perfil).toBe('GESTORA');
    });

    it('retorna perfil TRIADORA quando perfis inclui TRIADORA (sem GESTORA)', async () => {
      setupTriadoraReturns();
      const result = await service.getStats(MOCK_UUID, ['TRIADORA'], 'semana');
      expect(result.perfil).toBe('TRIADORA');
    });

    it('retorna perfil TRIADORA quando usuario tem PROFISSIONAL e TRIADORA', async () => {
      setupTriadoraReturns();
      const result = await service.getStats(MOCK_UUID, ['PROFISSIONAL', 'TRIADORA'], 'semana');
      expect(result.perfil).toBe('TRIADORA');
    });

    it('retorna perfil PROFISSIONAL quando não há GESTORA nem TRIADORA', async () => {
      setupProfissionalReturns();
      const result = await service.getStats(MOCK_UUID, ['PROFISSIONAL'], 'semana');
      expect(result.perfil).toBe('PROFISSIONAL');
    });
  });

  // ── getDateRange ─────────────────────────────────────────────────────

  describe('getDateRange', () => {
    it('hoje: diasAtras = 0 e janela de 1 dia', () => {
      const range = (service as any).getDateRange('hoje');
      expect(range.diasAtras).toBe(0);
      const diffMs = range.fim.getTime() - range.inicio.getTime();
      expect(diffMs).toBe(24 * 60 * 60 * 1000);
    });

    it('semana: diasAtras = 6 e janela de 7 dias', () => {
      const range = (service as any).getDateRange('semana');
      expect(range.diasAtras).toBe(6);
      const diffMs = range.fim.getTime() - range.inicio.getTime();
      expect(diffMs).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it('mes: inicio no dia 1 do mês corrente', () => {
      const range = (service as any).getDateRange('mes');
      expect(range.inicio.getDate()).toBe(1);
      expect(range.inicio.getMonth()).toBe(new Date().getMonth());
    });
  });

  // ── getGestoraStats ──────────────────────────────────────────────────

  describe('getGestoraStats', () => {
    beforeEach(() => {
      mockPrisma.beneficiarias.count.mockResolvedValue(42);
      mockPrisma.triagens.count.mockResolvedValue(7);
      mockPrisma.encaminhamentos.count.mockResolvedValue(3);
      mockPrisma.doacoes.aggregate.mockResolvedValue({ _sum: { valor: 1200.5 } });
      mockPrisma.agendamentos.findMany.mockResolvedValue([
        { data_hora: makeDate(0) },
      ]);
      mockPrisma.encaminhamentos.groupBy.mockResolvedValue([
        { especialidade: 'PSICOLOGIA', _count: { _all: 5 } },
      ]);
      mockPrisma.doacoes.findMany.mockResolvedValue([]);
      mockPrisma.beneficiarias.findMany.mockResolvedValue([
        { id: '1', nome: 'Maria', criado_em: new Date() },
      ]);
      mockPrisma.bazares.findMany.mockResolvedValue([
        { id: 'b1', nome: 'Bazar Maio', data: new Date('2026-05-01'), total_arrecadado: 890 },
      ]);
    });

    it('retorna estrutura completa com todas as chaves esperadas', async () => {
      const result = await service.getStats(MOCK_UUID, ['GESTORA'], 'semana') as any;
      expect(result).toMatchObject({
        perfil: 'GESTORA',
        metricas: {
          totalBeneficiariasAtivas: 42,
          triagensMes: 7,
          encaminhamentosPendentes: 3,
          doacoesMesTotal: 1200.5,
        },
      });
      expect(Array.isArray(result.atendimentosPorDia)).toBe(true);
      expect(Array.isArray(result.encaminhamentosPorEspecialidade)).toBe(true);
      expect(Array.isArray(result.doacoesPorMes)).toBe(true);
      expect(Array.isArray(result.filaEspera)).toBe(true);
      expect(Array.isArray(result.agendamentosHoje)).toBe(true);
      expect(Array.isArray(result.bazaresNoPeriodo)).toBe(true);
    });

    it('mapeia bazaresNoPeriodo com nome, data e total corretos', async () => {
      const result = await service.getStats(MOCK_UUID, ['GESTORA'], 'semana') as any;
      expect(result.bazaresNoPeriodo[0]).toMatchObject({
        nome: 'Bazar Maio',
        total: 890,
      });
      expect(typeof result.bazaresNoPeriodo[0].data).toBe('string');
    });

    it('doacoesMesTotal retorna 0 quando aggregate retorna null', async () => {
      mockPrisma.doacoes.aggregate.mockResolvedValue({ _sum: { valor: null } });
      const result = await service.getStats(MOCK_UUID, ['GESTORA'], 'semana') as any;
      expect(result.metricas.doacoesMesTotal).toBe(0);
    });
  });

  // ── getTriadoraStats ─────────────────────────────────────────────────

  describe('getTriadoraStats', () => {
    beforeEach(() => {
      mockPrisma.triagens.count
        .mockResolvedValueOnce(2)   // triagensHoje
        .mockResolvedValueOnce(10); // triagensMes
      mockPrisma.encaminhamentos.count.mockResolvedValue(4);
      mockPrisma.beneficiarias.count.mockResolvedValue(6);
      mockPrisma.triagens.findMany.mockResolvedValue([]);
      mockPrisma.encaminhamentos.groupBy.mockResolvedValue([]);
      mockPrisma.beneficiarias.findMany.mockResolvedValue([]);
    });

    it('retorna estrutura completa com todas as chaves esperadas', async () => {
      const result = await service.getStats(MOCK_UUID, ['TRIADORA'], 'hoje') as any;
      expect(result).toMatchObject({
        perfil: 'TRIADORA',
        metricas: {
          triagensHoje: 2,
          triagensMes: 10,
          encaminhamentosPendentes: 4,
          beneficiariasEmEspera: 6,
        },
      });
      expect(Array.isArray(result.triagensPorDia)).toBe(true);
      expect(Array.isArray(result.encaminhamentosPorEspecialidade)).toBe(true);
      expect(Array.isArray(result.filaEspera)).toBe(true);
    });

    it('triagensPorDia tem exatamente 1 entrada quando period = hoje', async () => {
      const result = await service.getStats(MOCK_UUID, ['TRIADORA'], 'hoje') as any;
      expect(result.triagensPorDia).toHaveLength(1);
    });

    it('triagensPorDia tem 7 entradas quando period = semana', async () => {
      const result = await service.getStats(MOCK_UUID, ['TRIADORA'], 'semana') as any;
      expect(result.triagensPorDia).toHaveLength(7);
    });
  });

  // ── getProfissionalStats ─────────────────────────────────────────────

  describe('getProfissionalStats', () => {
    beforeEach(() => {
      mockPrisma.agendamentos.count
        .mockResolvedValueOnce(5)   // agendamentosHoje
        .mockResolvedValueOnce(3)   // confirmadosHoje
        .mockResolvedValueOnce(12)  // realizadosMes
        .mockResolvedValueOnce(1);  // canceladosMes
      mockPrisma.agendamentos.groupBy.mockResolvedValue([
        { status: 'REALIZADO', _count: { _all: 12 } },
        { status: 'CANCELADO', _count: { _all: 1 } },
      ]);
      mockPrisma.agendamentos.findMany.mockResolvedValue([]);
    });

    it('retorna estrutura completa com todas as chaves esperadas', async () => {
      const result = await service.getStats(MOCK_UUID, ['PROFISSIONAL'], 'mes') as any;
      expect(result).toMatchObject({
        perfil: 'PROFISSIONAL',
        metricas: {
          agendamentosHoje: 5,
          confirmadosHoje: 3,
          realizadosMes: 12,
          canceladosMes: 1,
        },
      });
      expect(Array.isArray(result.agendamentosPorStatus)).toBe(true);
      expect(Array.isArray(result.atendimentosPorSemana)).toBe(true);
      expect(Array.isArray(result.agendamentosHoje)).toBe(true);
    });

    it('atendimentosPorSemana tem exatamente 4 entradas (semanas)', async () => {
      const result = await service.getStats(MOCK_UUID, ['PROFISSIONAL'], 'semana') as any;
      expect(result.atendimentosPorSemana).toHaveLength(4);
    });

    it('filtra agendamentos pelo profissional_id do usuario logado', async () => {
      await service.getStats(MOCK_UUID, ['PROFISSIONAL'], 'hoje');
      const countCalls = mockPrisma.agendamentos.count.mock.calls;
      countCalls.forEach((call: any[]) => {
        expect(call[0].where.profissional_id).toBe(MOCK_UUID);
      });
    });
  });
});
