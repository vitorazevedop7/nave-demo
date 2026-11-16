import { criarPrismaMock, type PrismaMock } from '../test-utils/prisma-mock';
import { DashboardService } from './dashboard.service';
import type { PeriodoDashboard } from './dto/dashboard-query.dto';

const MOCK_UUID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

/** "Agora" fixo: quarta-feira, 18/11/2026, 18h no horário de Brasília. */
const AGORA = new Date(2026, 10, 18, 18, 0, 0);

/** Data local relativa a AGORA (os testes rodam com TZ=America/Sao_Paulo). */
function diasAtras(dias: number, hora = 10, minuto = 0): Date {
  return new Date(2026, 10, 18 - dias, hora, minuto, 0);
}

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: PrismaMock;

  beforeEach(() => {
    jest.useFakeTimers({ now: AGORA });
    prisma = criarPrismaMock();
    service = new DashboardService(prisma);
  });

  afterEach(() => jest.useRealTimers());

  /** Acesso ao método privado só para testar o cálculo de janela. */
  function getDateRange(periodo: PeriodoDashboard) {
    return (
      service as unknown as {
        getDateRange(p: PeriodoDashboard): {
          inicio: Date;
          fim: Date;
          diasAtras: number;
        };
      }
    ).getDateRange(periodo);
  }

  function mockGestora() {
    prisma.beneficiarias.count.mockResolvedValue(42);
    prisma.triagens.count.mockResolvedValue(7);
    prisma.encaminhamentos.count.mockResolvedValue(3);
    prisma.doacoes.aggregate.mockResolvedValue({
      _sum: { valor: 1200.5 },
    } as never);
    prisma.agendamentos.findMany.mockResolvedValue([]);
    prisma.encaminhamentos.groupBy.mockResolvedValue([
      { especialidade: 'PSICOLOGIA', _count: { _all: 5 } },
    ] as never);
    prisma.doacoes.findMany.mockResolvedValue([]);
    prisma.beneficiarias.findMany.mockResolvedValue([
      { id: '1', nome: 'Maria', criado_em: AGORA },
    ] as never);
    prisma.bazares.findMany.mockResolvedValue([
      {
        id: 'b1',
        nome: 'Bazar Maio',
        data: new Date('2026-05-01'),
        total_arrecadado: 890,
      },
    ] as never);
  }

  function mockTriadora() {
    prisma.triagens.count
      .mockResolvedValueOnce(2) // triagensHoje
      .mockResolvedValueOnce(10); // triagensMes
    prisma.encaminhamentos.count.mockResolvedValue(4);
    prisma.beneficiarias.count.mockResolvedValue(6);
    prisma.triagens.findMany.mockResolvedValue([]);
    prisma.encaminhamentos.groupBy.mockResolvedValue([] as never);
    prisma.beneficiarias.findMany.mockResolvedValue([]);
  }

  /** `realizados` alimenta a primeira chamada de findMany (gráfico semanal). */
  function mockProfissional(realizados: Date[] = []) {
    prisma.agendamentos.count
      .mockResolvedValueOnce(5) // agendamentosHoje
      .mockResolvedValueOnce(3) // confirmadosHoje
      .mockResolvedValueOnce(12) // realizadosMes
      .mockResolvedValueOnce(1); // canceladosMes
    prisma.agendamentos.groupBy.mockResolvedValue([
      { status: 'REALIZADO', _count: { _all: 12 } },
      { status: 'CANCELADO', _count: { _all: 1 } },
    ] as never);
    prisma.agendamentos.findMany
      .mockResolvedValueOnce(
        realizados.map((data_hora) => ({ data_hora })) as never,
      )
      .mockResolvedValueOnce([]);
  }

  describe('getStats — roteamento por perfil', () => {
    it('retorna perfil GESTORA quando perfis inclui GESTORA', async () => {
      mockGestora();
      const result = await service.getStats(MOCK_UUID, ['GESTORA'], 'semana');
      expect(result.perfil).toBe('GESTORA');
    });

    it('retorna perfil TRIADORA quando perfis inclui TRIADORA (sem GESTORA)', async () => {
      mockTriadora();
      const result = await service.getStats(MOCK_UUID, ['TRIADORA'], 'semana');
      expect(result.perfil).toBe('TRIADORA');
    });

    it('retorna perfil TRIADORA quando usuario tem PROFISSIONAL e TRIADORA', async () => {
      mockTriadora();
      const result = await service.getStats(
        MOCK_UUID,
        ['PROFISSIONAL', 'TRIADORA'],
        'semana',
      );
      expect(result.perfil).toBe('TRIADORA');
    });

    it('retorna perfil PROFISSIONAL quando não há GESTORA nem TRIADORA', async () => {
      mockProfissional();
      const result = await service.getStats(
        MOCK_UUID,
        ['PROFISSIONAL'],
        'semana',
      );
      expect(result.perfil).toBe('PROFISSIONAL');
    });
  });

  describe('getDateRange', () => {
    it('hoje: começa à meia-noite local e vai até a meia-noite seguinte', () => {
      const range = getDateRange('hoje');
      expect(range.diasAtras).toBe(0);
      expect(range.inicio).toEqual(new Date(2026, 10, 18));
      expect(range.fim).toEqual(new Date(2026, 10, 19));
    });

    it('semana: 7 dias de calendário terminando hoje', () => {
      const range = getDateRange('semana');
      expect(range.diasAtras).toBe(6);
      expect(range.inicio).toEqual(new Date(2026, 10, 12));
      expect(range.fim).toEqual(new Date(2026, 10, 19));
    });

    it('mes: inicio no dia 1 do mês corrente', () => {
      const range = getDateRange('mes');
      expect(range.inicio).toEqual(new Date(2026, 10, 1));
      expect(range.diasAtras).toBe(17);
    });
  });

  describe('getGestoraStats', () => {
    beforeEach(mockGestora);

    it('retorna estrutura completa com todas as chaves esperadas', async () => {
      const result = await service.getStats(MOCK_UUID, ['GESTORA'], 'semana');
      expect(result).toMatchObject({
        perfil: 'GESTORA',
        metricas: {
          totalBeneficiariasAtivas: 42,
          triagensMes: 7,
          encaminhamentosPendentes: 3,
          doacoesMesTotal: 1200.5,
        },
        encaminhamentosPorEspecialidade: [
          { especialidade: 'PSICOLOGIA', total: 5 },
        ],
      });
      if (result.perfil !== 'GESTORA') throw new Error('perfil inesperado');
      expect(result.atendimentosPorDia).toHaveLength(7);
      expect(result.doacoesPorMes).toHaveLength(6);
    });

    it('mapeia bazaresNoPeriodo com nome, data e total corretos', async () => {
      const result = await service.getStats(MOCK_UUID, ['GESTORA'], 'semana');
      if (result.perfil !== 'GESTORA') throw new Error('perfil inesperado');
      expect(result.bazaresNoPeriodo).toEqual([
        { nome: 'Bazar Maio', data: '2026-05-01', total: 890 },
      ]);
    });

    it('doacoesMesTotal retorna 0 quando aggregate retorna null', async () => {
      prisma.doacoes.aggregate.mockResolvedValue({
        _sum: { valor: null },
      } as never);
      const result = await service.getStats(MOCK_UUID, ['GESTORA'], 'semana');
      if (result.perfil !== 'GESTORA') throw new Error('perfil inesperado');
      expect(result.metricas.doacoesMesTotal).toBe(0);
    });

    it('agrupa atendimentos pelo dia LOCAL, não pelo dia em UTC', async () => {
      // 22h30 de ontem em Brasília = 01h30 de hoje em UTC.
      prisma.agendamentos.findMany
        .mockResolvedValueOnce([
          { data_hora: diasAtras(1, 22, 30) },
          { data_hora: diasAtras(0, 9, 0) },
        ] as never)
        .mockResolvedValueOnce([]);

      const result = await service.getStats(MOCK_UUID, ['GESTORA'], 'semana');
      if (result.perfil !== 'GESTORA') throw new Error('perfil inesperado');

      expect(result.atendimentosPorDia.slice(-2)).toEqual([
        { data: '2026-11-17', total: 1 },
        { data: '2026-11-18', total: 1 },
      ]);
    });

    it('agrupa doações por mês local, com os últimos 6 meses zerados por padrão', async () => {
      prisma.doacoes.findMany.mockResolvedValue([
        { valor: 100, criado_em: new Date(2026, 10, 1, 0, 30) },
        { valor: 50, criado_em: new Date(2026, 9, 31, 23, 30) },
      ] as never);

      const result = await service.getStats(MOCK_UUID, ['GESTORA'], 'semana');
      if (result.perfil !== 'GESTORA') throw new Error('perfil inesperado');

      expect(result.doacoesPorMes).toEqual([
        { mes: '2026-06', total: 0 },
        { mes: '2026-07', total: 0 },
        { mes: '2026-08', total: 0 },
        { mes: '2026-09', total: 0 },
        { mes: '2026-10', total: 50 },
        { mes: '2026-11', total: 100 },
      ]);
    });
  });

  describe('getTriadoraStats', () => {
    beforeEach(mockTriadora);

    it('retorna estrutura completa com todas as chaves esperadas', async () => {
      const result = await service.getStats(MOCK_UUID, ['TRIADORA'], 'hoje');
      expect(result).toMatchObject({
        perfil: 'TRIADORA',
        metricas: {
          triagensHoje: 2,
          triagensMes: 10,
          encaminhamentosPendentes: 4,
          beneficiariasEmEspera: 6,
        },
      });
    });

    it.each([
      ['hoje', 1],
      ['semana', 7],
      ['mes', 18],
    ] as const)(
      'triagensPorDia tem uma entrada por dia no período %s',
      async (periodo, dias) => {
        const result = await service.getStats(MOCK_UUID, ['TRIADORA'], periodo);
        if (result.perfil !== 'TRIADORA') throw new Error('perfil inesperado');
        expect(result.triagensPorDia).toHaveLength(dias);
        expect(result.triagensPorDia.at(-1)?.data).toBe('2026-11-18');
      },
    );

    it('ignora triagens sem data de criação', async () => {
      prisma.triagens.findMany.mockResolvedValue([
        { criado_em: null },
        { criado_em: diasAtras(0, 23, 50) },
      ] as never);

      const result = await service.getStats(MOCK_UUID, ['TRIADORA'], 'hoje');
      if (result.perfil !== 'TRIADORA') throw new Error('perfil inesperado');
      expect(result.triagensPorDia).toEqual([{ data: '2026-11-18', total: 1 }]);
    });
  });

  describe('getProfissionalStats', () => {
    it('retorna estrutura completa com todas as chaves esperadas', async () => {
      mockProfissional();
      const result = await service.getStats(MOCK_UUID, ['PROFISSIONAL'], 'mes');
      expect(result).toMatchObject({
        perfil: 'PROFISSIONAL',
        metricas: {
          agendamentosHoje: 5,
          confirmadosHoje: 3,
          realizadosMes: 12,
          canceladosMes: 1,
        },
        agendamentosPorStatus: [
          { status: 'REALIZADO', total: 12 },
          { status: 'CANCELADO', total: 1 },
        ],
      });
    });

    it('conta atendimento REALIZADO hoje em "Esta sem." (regressão)', async () => {
      // Antes da correção, um atendimento de hoje depois da meia-noite gerava
      // diferença de -1 dia e sumia do gráfico.
      mockProfissional([diasAtras(0, 14, 0)]);

      const result = await service.getStats(
        MOCK_UUID,
        ['PROFISSIONAL'],
        'semana',
      );
      if (result.perfil !== 'PROFISSIONAL') {
        throw new Error('perfil inesperado');
      }

      expect(result.atendimentosPorSemana).toEqual([
        { semana: 'Há 3 sem.', total: 0 },
        { semana: 'Há 2 sem.', total: 0 },
        { semana: 'Sem. pas.', total: 0 },
        { semana: 'Esta sem.', total: 1 },
      ]);
    });

    it('distribui atendimentos em blocos de 7 dias de calendário', async () => {
      mockProfissional([
        diasAtras(0, 23, 59), // Esta sem.
        diasAtras(6, 0, 1), // Esta sem. (limite)
        diasAtras(7, 9, 0), // Sem. pas.
        diasAtras(13, 22, 30), // Sem. pas. (22h30 local = dia seguinte em UTC)
        diasAtras(14, 8, 0), // Há 2 sem.
        diasAtras(27, 8, 0), // Há 3 sem.
      ]);

      const result = await service.getStats(
        MOCK_UUID,
        ['PROFISSIONAL'],
        'semana',
      );
      if (result.perfil !== 'PROFISSIONAL') {
        throw new Error('perfil inesperado');
      }

      expect(result.atendimentosPorSemana.map(({ total }) => total)).toEqual([
        1, 1, 2, 2,
      ]);
    });

    it('filtra agendamentos pelo profissional_id do usuario logado', async () => {
      mockProfissional();
      await service.getStats(MOCK_UUID, ['PROFISSIONAL'], 'hoje');

      for (const [args] of prisma.agendamentos.count.mock.calls) {
        expect(args?.where?.profissional_id).toBe(MOCK_UUID);
      }
      for (const [args] of prisma.agendamentos.findMany.mock.calls) {
        expect(args?.where?.profissional_id).toBe(MOCK_UUID);
      }
    });
  });
});
