import { BadRequestException } from '@nestjs/common';
import type { JwtUser } from '../auth/jwt-user.interface';
import { ROLES_KEY } from '../auth/roles.decorator';
import { AgendamentosController } from './agendamentos.controller';
import type { AgendamentosService } from './agendamentos.service';

const dto = {
  beneficiaria_id: 'beneficiaria-1',
  profissional_id: 'profissional-informado',
  data_hora: '2026-08-28T15:00:00.000Z',
};

function usuario(id: string, perfis: string[]): JwtUser {
  return {
    id,
    perfis,
    nome: id,
    email: `${id}@example.com`,
    especialidade: null,
  };
}

describe('AgendamentosController', () => {
  let service: { create: jest.Mock; update: jest.Mock };
  let controller: AgendamentosController;

  beforeEach(() => {
    service = {
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
    };
    controller = new AgendamentosController(
      service as unknown as AgendamentosService,
    );
  });

  it('força profissional_id do token para PROFISSIONAL puro', async () => {
    await controller.create(
      dto,
      usuario('profissional-token', ['PROFISSIONAL']),
    );

    expect(service.create).toHaveBeenCalledWith({
      ...dto,
      profissional_id: 'profissional-token',
    });
  });

  it('aceita PROFISSIONAL puro sem profissional_id no body', async () => {
    const { profissional_id: _ignorado, ...dtoSemProfissional } = dto;

    await controller.create(
      dtoSemProfissional,
      usuario('profissional-token', ['PROFISSIONAL']),
    );

    expect(service.create).toHaveBeenCalledWith({
      ...dtoSemProfissional,
      profissional_id: 'profissional-token',
    });
  });

  it('mantém profissional_id informado para GESTORA', async () => {
    await controller.create(dto, usuario('gestora-1', ['GESTORA']));

    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('exige profissional_id de GESTORA ou TRIADORA', () => {
    const { profissional_id: _ignorado, ...dtoSemProfissional } = dto;

    expect(() =>
      controller.create(dtoSemProfissional, usuario('gestora-1', ['GESTORA'])),
    ).toThrow(BadRequestException);
  });

  it('mantém profissional_id informado para quem também é TRIADORA', async () => {
    await controller.create(
      dto,
      usuario('profissional-triadora', ['PROFISSIONAL', 'TRIADORA']),
    );

    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('restringe a edição à própria agenda apenas para PROFISSIONAL puro', async () => {
    await controller.update(
      'agendamento-1',
      { status: 'CONFIRMADO' },
      usuario('profissional-1', ['PROFISSIONAL']),
    );
    await controller.update(
      'agendamento-1',
      { status: 'CONFIRMADO' },
      usuario('gestora-1', ['GESTORA', 'PROFISSIONAL']),
    );

    expect(service.update).toHaveBeenNthCalledWith(
      1,
      'agendamento-1',
      { status: 'CONFIRMADO' },
      'profissional-1',
    );
    expect(service.update).toHaveBeenNthCalledWith(
      2,
      'agendamento-1',
      { status: 'CONFIRMADO' },
      undefined,
    );
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
