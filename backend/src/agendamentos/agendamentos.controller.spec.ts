import { BadRequestException } from '@nestjs/common';
import { ROLES_KEY } from '../auth/roles.decorator';
import { AgendamentosController } from './agendamentos.controller';

const dto = {
  beneficiaria_id: 'beneficiaria-1',
  profissional_id: 'profissional-informado',
  data_hora: '2026-08-28T15:00:00.000Z',
};

describe('AgendamentosController', () => {
  let service: { create: jest.Mock };
  let controller: AgendamentosController;

  beforeEach(() => {
    service = { create: jest.fn().mockResolvedValue({}) };
    controller = new AgendamentosController(service as never);
  });

  it('força profissional_id do token para PROFISSIONAL puro', async () => {
    await controller.create(dto, {
      user: { id: 'profissional-token', perfis: ['PROFISSIONAL'] },
    });

    expect(service.create).toHaveBeenCalledWith({
      ...dto,
      profissional_id: 'profissional-token',
    });
  });

  it('aceita PROFISSIONAL puro sem profissional_id no body', async () => {
    const { profissional_id: _ignorado, ...dtoSemProfissional } = dto;

    await controller.create(dtoSemProfissional, {
      user: { id: 'profissional-token', perfis: ['PROFISSIONAL'] },
    });

    expect(service.create).toHaveBeenCalledWith({
      ...dtoSemProfissional,
      profissional_id: 'profissional-token',
    });
  });

  it('mantém profissional_id informado para GESTORA', async () => {
    await controller.create(dto, {
      user: { id: 'gestora-1', perfis: ['GESTORA'] },
    });

    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('exige profissional_id de GESTORA ou TRIADORA', async () => {
    const { profissional_id: _ignorado, ...dtoSemProfissional } = dto;

    expect(() =>
      controller.create(dtoSemProfissional, {
        user: { id: 'gestora-1', perfis: ['GESTORA'] },
      }),
    ).toThrow(BadRequestException);
  });

  it('mantém profissional_id informado para quem também é TRIADORA', async () => {
    await controller.create(dto, {
      user: {
        id: 'profissional-triadora',
        perfis: ['PROFISSIONAL', 'TRIADORA'],
      },
    });

    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('aceita PROFISSIONAL no POST e mantém DELETE restrito à classe', () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, AgendamentosController.prototype.create),
    ).toEqual(['GESTORA', 'TRIADORA', 'PROFISSIONAL']);
    expect(
      Reflect.getMetadata(ROLES_KEY, AgendamentosController.prototype.remove),
    ).toBeUndefined();
    expect(Reflect.getMetadata(ROLES_KEY, AgendamentosController)).toEqual([
      'GESTORA',
      'TRIADORA',
    ]);
  });
});
