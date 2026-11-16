import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  criarPrismaMock,
  executarTransacoesNoMock,
  type PrismaMock,
} from '../test-utils/prisma-mock';
import { AgendamentosService } from './agendamentos.service';

const dto = {
  beneficiaria_id: 'beneficiaria-1',
  profissional_id: 'profissional-1',
  encaminhamento_id: 'encaminhamento-1',
  data_hora: '2026-08-28T15:00:00.000Z',
};

describe('AgendamentosService', () => {
  let service: AgendamentosService;
  let prisma: PrismaMock;

  beforeEach(() => {
    prisma = criarPrismaMock();
    executarTransacoesNoMock(prisma);
    prisma.beneficiarias.findFirst.mockResolvedValue({
      id: dto.beneficiaria_id,
    } as never);
    prisma.agendamentos.findFirst.mockResolvedValue(null);
    prisma.agendamentos.findMany.mockResolvedValue([]);
    prisma.agendamentos.create.mockResolvedValue({
      id: 'agendamento-1',
      ...dto,
      data_hora: new Date(dto.data_hora),
    } as never);
    service = new AgendamentosService(prisma);
  });

  it('rejeita encaminhamento pertencente a outra beneficiária', async () => {
    prisma.usuarios.findFirst.mockResolvedValue({
      especialidade: 'PSICOLOGIA',
    } as never);
    prisma.encaminhamentos.findFirst.mockResolvedValue({
      especialidade: 'PSICOLOGIA',
      triagens: { beneficiaria_id: 'beneficiaria-2' },
    } as never);

    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejeita beneficiária arquivada ou inexistente', async () => {
    prisma.beneficiarias.findFirst.mockResolvedValue(null);

    await expect(service.create(dto)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.beneficiarias.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: dto.beneficiaria_id, deletado_em: null },
      }),
    );
  });

  it('rejeita horário a menos de 30 minutos de outro compromisso do profissional', async () => {
    prisma.usuarios.findFirst.mockResolvedValue({
      especialidade: 'PSICOLOGIA',
    } as never);
    prisma.encaminhamentos.findFirst.mockResolvedValue({
      especialidade: 'PSICOLOGIA',
      triagens: { beneficiaria_id: dto.beneficiaria_id },
    } as never);
    prisma.agendamentos.findFirst.mockResolvedValue({
      id: 'conflitante',
    } as never);

    await expect(service.create(dto)).rejects.toThrow(
      'Profissional já possui agendamento dentro de ±30 minutos desse horário',
    );
    expect(prisma.agendamentos.create).not.toHaveBeenCalled();
  });

  it('permite cobertura de outra especialidade e devolve aviso', async () => {
    prisma.usuarios.findFirst.mockResolvedValue({
      especialidade: 'ASSISTENCIA_SOCIAL',
    } as never);
    prisma.encaminhamentos.findFirst.mockResolvedValue({
      especialidade: 'PSICOLOGIA',
      triagens: { beneficiaria_id: dto.beneficiaria_id },
    } as never);

    const resultado = await service.create(dto);

    expect(resultado.avisos).toEqual([
      'A especialidade do profissional diverge da especialidade do encaminhamento',
    ]);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('marca o encaminhamento como AGENDADO na mesma transação', async () => {
    prisma.usuarios.findFirst.mockResolvedValue({
      especialidade: 'psicologia',
    } as never);
    prisma.encaminhamentos.findFirst.mockResolvedValue({
      especialidade: 'PSICOLOGIA',
      triagens: { beneficiaria_id: dto.beneficiaria_id },
    } as never);

    const resultado = await service.create(dto);

    expect(resultado.avisos).toEqual([]);
    expect(prisma.encaminhamentos.update).toHaveBeenCalledWith({
      where: { id: dto.encaminhamento_id },
      data: { status: 'AGENDADO' },
    });
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
    } as never);

    await expect(
      service.update(
        'agendamento-2',
        { status: 'CONFIRMADO' },
        'profissional-1',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.agendamentos.update).not.toHaveBeenCalled();
  });
});
