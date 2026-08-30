import { ConflictException, ForbiddenException } from '@nestjs/common';
import { AgendamentosService } from './agendamentos.service';

const dto = {
  beneficiaria_id: 'beneficiaria-1',
  profissional_id: 'profissional-1',
  encaminhamento_id: 'encaminhamento-1',
  data_hora: '2026-08-28T15:00:00.000Z',
};

describe('AgendamentosService', () => {
  let service: AgendamentosService;
  let prisma: any;

  beforeEach(() => {
    const agendamento = {
      id: 'agendamento-1',
      ...dto,
      data_hora: new Date(dto.data_hora),
    };
    const tx = {
      agendamentos: { create: jest.fn().mockResolvedValue(agendamento) },
      encaminhamentos: { update: jest.fn().mockResolvedValue({}) },
    };
    prisma = {
      beneficiarias: {
        findFirst: jest.fn().mockResolvedValue({ id: dto.beneficiaria_id }),
      },
      usuarios: { findFirst: jest.fn() },
      encaminhamentos: { findFirst: jest.fn() },
      agendamentos: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(async (callback) => callback(tx)),
    };
    service = new AgendamentosService(prisma);
  });

  it('rejeita encaminhamento pertencente a outra beneficiária', async () => {
    prisma.usuarios.findFirst.mockResolvedValue({
      especialidade: 'PSICOLOGIA',
    });
    prisma.encaminhamentos.findFirst.mockResolvedValue({
      especialidade: 'PSICOLOGIA',
      triagens: { beneficiaria_id: 'beneficiaria-2' },
    });

    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('permite cobertura de outra especialidade e devolve aviso', async () => {
    prisma.usuarios.findFirst.mockResolvedValue({
      especialidade: 'ASSISTENCIA_SOCIAL',
    });
    prisma.encaminhamentos.findFirst.mockResolvedValue({
      especialidade: 'PSICOLOGIA',
      triagens: { beneficiaria_id: dto.beneficiaria_id },
    });

    const resultado = await service.create(dto);

    expect(resultado.avisos).toEqual([
      'A especialidade do profissional diverge da especialidade do encaminhamento',
    ]);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('não emite aviso quando as especialidades são compatíveis', async () => {
    prisma.usuarios.findFirst.mockResolvedValue({
      especialidade: 'psicologia',
    });
    prisma.encaminhamentos.findFirst.mockResolvedValue({
      especialidade: 'PSICOLOGIA',
      triagens: { beneficiaria_id: dto.beneficiaria_id },
    });

    const resultado = await service.create(dto);

    expect(resultado.avisos).toEqual([]);
  });

  it('filtra agendamentos sem beneficiária quando solicitado', async () => {
    await service.findByProfissional('profissional-1', true);

    expect(prisma.agendamentos.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          profissional_id: 'profissional-1',
          beneficiaria_id: { not: null },
        },
      }),
    );
  });

  it('mantém todos os compromissos por padrão', async () => {
    await service.findByProfissional('profissional-1');

    expect(prisma.agendamentos.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { profissional_id: 'profissional-1' },
      }),
    );
  });

  it('impede profissional puro de editar agendamento de outro profissional', async () => {
    prisma.agendamentos.findUnique.mockResolvedValue({
      id: 'agendamento-2',
      profissional_id: 'profissional-2',
    });

    await expect(
      service.update('agendamento-2', { status: 'CONFIRMADO' }, 'profissional-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
