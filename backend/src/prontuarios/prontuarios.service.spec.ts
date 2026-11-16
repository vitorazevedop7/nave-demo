import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { VisibilidadeProntuario } from '@prisma/client';
import { criarPrismaMock, type PrismaMock } from '../test-utils/prisma-mock';
import { WHERE_USUARIO_COMPARTILHAVEL } from '../usuarios/usuario-compartilhavel';
import { ProntuariosService, redigirProntuario } from './prontuarios.service';

const DATA = new Date('2026-08-27T12:00:00.000Z');

function prontuario(
  visibilidade: VisibilidadeProntuario,
  compartilhamentos: string[] = [],
) {
  return {
    id: 'prontuario-1',
    profissional_id: 'autor-1',
    beneficiaria_id: 'beneficiaria-1',
    agendamento_id: null,
    deletado_em: null,
    especialidade: 'PSICOLOGIA',
    descricao: 'conteúdo clínico',
    visibilidade,
    criado_em: DATA,
    atualizado_em: null,
    prontuarios_psicologia_adulto: { queixa_principal: 'sigilosa' },
    prontuarios_psicologia_crianca: null,
    prontuarios_fisioterapia: null,
    prontuarios_acupuntura: null,
    prontuario_compartilhamentos: compartilhamentos.map((usuario_id) => ({
      usuario_id,
    })),
    usuarios: { nome: 'Autora do prontuário' },
  };
}

function usuario(
  id: string,
  perfis: string[],
  especialidade: string | null = null,
) {
  return { id, perfis, especialidade };
}

describe('redigirProntuario', () => {
  it('entrega conteúdo privado completo ao autor', () => {
    const resultado = redigirProntuario(
      prontuario(VisibilidadeProntuario.PRIVADO, ['compartilhado-1']),
      usuario('autor-1', ['PROFISSIONAL'], 'PSICOLOGIA'),
    );

    expect(resultado).toMatchObject({
      id: 'prontuario-1',
      descricao: 'conteúdo clínico',
      compartilhamentos: ['compartilhado-1'],
    });
    expect(resultado).not.toHaveProperty('prontuario_compartilhamentos');
    expect(resultado).not.toHaveProperty('usuarios');
  });

  it('entrega conteúdo privado completo a quem recebeu compartilhamento', () => {
    const resultado = redigirProntuario(
      prontuario(VisibilidadeProntuario.PRIVADO, ['compartilhado-1']),
      usuario('compartilhado-1', ['PROFISSIONAL'], 'FISIOTERAPIA'),
    );

    expect(resultado).toHaveProperty('descricao', 'conteúdo clínico');
    expect(resultado).toHaveProperty('autor', 'Autora do prontuário');
    expect(resultado).not.toHaveProperty('compartilhamentos');
  });

  it('compara ESPECIALIDADE com a especialidade do registro', () => {
    const permitido = redigirProntuario(
      prontuario(VisibilidadeProntuario.ESPECIALIDADE),
      usuario('profissional-1', ['PROFISSIONAL'], 'PSICOLOGIA'),
    );
    const negado = redigirProntuario(
      prontuario(VisibilidadeProntuario.ESPECIALIDADE),
      usuario('profissional-2', ['PROFISSIONAL'], 'FISIOTERAPIA'),
    );

    expect(permitido).toHaveProperty('descricao', 'conteúdo clínico');
    expect(negado).toHaveProperty('conteudo_restrito', true);
  });

  it('mantém GESTORAS e ESPECIALIDADE como conjuntos incomparáveis', () => {
    const gestoraEmEspecialidade = redigirProntuario(
      prontuario(VisibilidadeProntuario.ESPECIALIDADE),
      usuario('gestora-1', ['GESTORA']),
    );
    const profissionalEmGestoras = redigirProntuario(
      prontuario(VisibilidadeProntuario.GESTORAS),
      usuario('profissional-1', ['PROFISSIONAL'], 'PSICOLOGIA'),
    );

    expect(gestoraEmEspecialidade).toHaveProperty('conteudo_restrito', true);
    expect(profissionalEmGestoras).toHaveProperty('conteudo_restrito', true);
  });

  it('permite EQUIPE_CLINICA a gestora ou profissional', () => {
    const registro = prontuario(VisibilidadeProntuario.EQUIPE_CLINICA);

    expect(
      redigirProntuario(registro, usuario('gestora-1', ['GESTORA'])),
    ).toHaveProperty('descricao', 'conteúdo clínico');
    expect(
      redigirProntuario(registro, usuario('profissional-1', ['PROFISSIONAL'])),
    ).toHaveProperty('descricao', 'conteúdo clínico');
  });

  it('avalia a união de todos os perfis do usuário', () => {
    const resultado = redigirProntuario(
      prontuario(VisibilidadeProntuario.ESPECIALIDADE),
      usuario('usuario-1', ['GESTORA', 'PROFISSIONAL'], 'PSICOLOGIA'),
    );

    expect(resultado).toHaveProperty('descricao', 'conteúdo clínico');
  });

  it('remove todos os campos clínicos do carimbo de gestora', () => {
    const resultado = redigirProntuario(
      prontuario(VisibilidadeProntuario.PRIVADO),
      usuario('gestora-1', ['GESTORA']),
    );

    expect(resultado).toEqual({
      id: 'prontuario-1',
      data: DATA,
      profissional: 'Autora do prontuário',
      especialidade: 'PSICOLOGIA',
      conteudo_restrito: true,
    });
    expect(resultado).not.toHaveProperty('descricao');
    expect(resultado).not.toHaveProperty('prontuarios_psicologia_adulto');
  });
});

describe('ProntuariosService', () => {
  let service: ProntuariosService;
  let prisma: PrismaMock;

  function usuarioNoBanco(
    id: string,
    perfis: string[],
    especialidade: string | null = null,
  ) {
    prisma.usuarios.findFirst.mockResolvedValue({
      id,
      especialidade,
      perfis_usuario: perfis.map((perfil) => ({ perfil })),
    } as never);
  }

  beforeEach(() => {
    prisma = criarPrismaMock();
    service = new ProntuariosService(prisma);
  });

  describe('create', () => {
    it('deriva autor e especialidade do usuário autenticado', async () => {
      prisma.usuarios.findFirst.mockResolvedValue({
        especialidade: 'ASSISTENCIA_SOCIAL',
      } as never);
      prisma.prontuarios.create.mockResolvedValue({
        ...prontuario(VisibilidadeProntuario.PRIVADO),
        especialidade: 'ASSISTENCIA_SOCIAL',
      });

      await service.create({ beneficiaria_id: 'beneficiaria-1' }, 'autor-1');

      expect(prisma.prontuarios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            profissional_id: 'autor-1',
            especialidade: 'ASSISTENCIA_SOCIAL',
          }) as unknown,
        }),
      );
    });

    it('só aceita autor ativo e não removido', async () => {
      prisma.usuarios.findFirst.mockResolvedValue(null);

      await expect(
        service.create({ beneficiaria_id: 'beneficiaria-1' }, 'autor-1'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(prisma.usuarios.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'autor-1', deletado_em: null, ativo: true },
        }),
      );
    });

    it('rejeita a criação quando o autor não tem especialidade cadastrada', async () => {
      prisma.usuarios.findFirst.mockResolvedValue({
        especialidade: null,
      } as never);

      await expect(
        service.create({ beneficiaria_id: 'beneficiaria-1' }, 'autor-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.prontuarios.create).not.toHaveBeenCalled();
    });

    it('rejeita um segundo prontuário (não excluído) para o mesmo agendamento', async () => {
      prisma.usuarios.findFirst.mockResolvedValue({
        especialidade: 'PSICOLOGIA',
      } as never);
      prisma.agendamentos.findUnique.mockResolvedValue({
        beneficiaria_id: 'beneficiaria-1',
        profissional_id: 'autor-1',
      } as never);
      prisma.prontuarios.findFirst.mockResolvedValue({
        id: 'existente-1',
      } as never);

      await expect(
        service.create(
          {
            beneficiaria_id: 'beneficiaria-1',
            agendamento_id: 'agendamento-1',
          },
          'autor-1',
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.prontuarios.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { agendamento_id: 'agendamento-1', deletado_em: null },
        }),
      );
      expect(prisma.prontuarios.create).not.toHaveBeenCalled();
    });

    it('exige que o autor seja o profissional do agendamento', async () => {
      prisma.usuarios.findFirst.mockResolvedValue({
        especialidade: 'PSICOLOGIA',
      } as never);
      prisma.agendamentos.findUnique.mockResolvedValue({
        beneficiaria_id: 'beneficiaria-1',
        profissional_id: 'outro-profissional',
      } as never);
      prisma.prontuarios.findFirst.mockResolvedValue(null);

      await expect(
        service.create(
          {
            beneficiaria_id: 'beneficiaria-1',
            agendamento_id: 'agendamento-1',
          },
          'autor-1',
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejeita compartilhamento com usuário inelegível', async () => {
      prisma.usuarios.findFirst.mockResolvedValue({
        especialidade: 'PSICOLOGIA',
      } as never);
      prisma.usuarios.count.mockResolvedValue(1);

      await expect(
        service.create(
          {
            beneficiaria_id: 'beneficiaria-1',
            compartilhamentos: ['elegivel', 'triadora-ou-inativo'],
          },
          'autor-1',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.usuarios.count).toHaveBeenCalledWith({
        where: {
          id: { in: ['elegivel', 'triadora-ou-inativo'] },
          ...WHERE_USUARIO_COMPARTILHAVEL,
        },
      });
      expect(prisma.prontuarios.create).not.toHaveBeenCalled();
    });
  });

  describe('leitura', () => {
    it('retorna DISPONIVEL com o prontuário autorizado do agendamento', async () => {
      usuarioNoBanco('autor-1', ['PROFISSIONAL'], 'PSICOLOGIA');
      prisma.agendamentos.findUnique.mockResolvedValue({
        profissional_id: 'autor-1',
      } as never);
      prisma.prontuarios.findFirst.mockResolvedValue(
        prontuario(VisibilidadeProntuario.PRIVADO),
      );

      const resultado = await service.findByAgendamento(
        'agendamento-1',
        'autor-1',
      );

      expect(prisma.prontuarios.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { agendamento_id: 'agendamento-1', deletado_em: null },
        }),
      );
      expect(resultado).toMatchObject({
        estado: 'DISPONIVEL',
        prontuario: { id: 'prontuario-1' },
      });
    });

    it('retorna AUSENTE quando o agendamento não tem prontuário', async () => {
      usuarioNoBanco('autor-1', ['PROFISSIONAL'], 'PSICOLOGIA');
      prisma.agendamentos.findUnique.mockResolvedValue({
        profissional_id: 'autor-1',
      } as never);
      prisma.prontuarios.findFirst.mockResolvedValue(null);

      await expect(
        service.findByAgendamento('agendamento-1', 'autor-1'),
      ).resolves.toEqual({ estado: 'AUSENTE' });
    });

    it('esconde o agendamento de outro profissional como 404', async () => {
      usuarioNoBanco('profissional-2', ['PROFISSIONAL'], 'PSICOLOGIA');
      prisma.agendamentos.findUnique.mockResolvedValue({
        profissional_id: 'autor-1',
      } as never);

      await expect(
        service.findByAgendamento('agendamento-1', 'profissional-2'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.prontuarios.findFirst).not.toHaveBeenCalled();
    });

    it('retorna RESTRITO com carimbo, sem conteúdo clínico', async () => {
      usuarioNoBanco('profissional-1', ['PROFISSIONAL'], 'FISIOTERAPIA');
      prisma.agendamentos.findUnique.mockResolvedValue({
        profissional_id: 'profissional-1',
      } as never);
      prisma.prontuarios.findFirst.mockResolvedValue(
        prontuario(VisibilidadeProntuario.PRIVADO),
      );

      const resultado = await service.findByAgendamento(
        'agendamento-1',
        'profissional-1',
      );

      expect(resultado).toEqual({
        estado: 'RESTRITO',
        prontuario: {
          id: 'prontuario-1',
          data: DATA,
          profissional: 'Autora do prontuário',
          especialidade: 'PSICOLOGIA',
          conteudo_restrito: true,
        },
      });
    });

    it('lista somente prontuários compartilhados nominalmente e não excluídos', async () => {
      prisma.prontuarios.findMany.mockResolvedValue([]);

      await service.findCompartilhadosComigo('profissional-1');

      expect(prisma.prontuarios.findMany).toHaveBeenCalledWith({
        where: {
          deletado_em: null,
          prontuario_compartilhamentos: {
            some: { usuario_id: 'profissional-1' },
          },
        },
        select: {
          id: true,
          especialidade: true,
          criado_em: true,
          beneficiarias: { select: { id: true, nome: true } },
          usuarios: { select: { nome: true } },
        },
        orderBy: { criado_em: 'desc' },
      });
    });

    it('limita a listagem profissional no where do Prisma', async () => {
      usuarioNoBanco('profissional-1', ['PROFISSIONAL'], 'PSICOLOGIA');
      prisma.prontuarios.findMany.mockResolvedValue([]);

      await service.findAll('profissional-1');

      expect(prisma.prontuarios.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [
              { deletado_em: null },
              {
                OR: [
                  { profissional_id: 'profissional-1' },
                  {
                    prontuario_compartilhamentos: {
                      some: { usuario_id: 'profissional-1' },
                    },
                  },
                  { visibilidade: VisibilidadeProntuario.EQUIPE_CLINICA },
                  {
                    visibilidade: VisibilidadeProntuario.ESPECIALIDADE,
                    especialidade: 'PSICOLOGIA',
                  },
                ],
              },
            ],
          },
        }),
      );
    });

    it('mantém todas as linhas para gestora e redige as incompatíveis', async () => {
      usuarioNoBanco('gestora-1', ['GESTORA']);
      prisma.prontuarios.findMany.mockResolvedValue([
        prontuario(VisibilidadeProntuario.PRIVADO),
      ] as never);

      const resultado = await service.findAll('gestora-1');

      expect(prisma.prontuarios.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { AND: [{ deletado_em: null }, {}] },
        }),
      );
      expect(resultado[0]).toEqual(
        expect.objectContaining({ conteudo_restrito: true }),
      );
    });

    it('recusa leitura de usuário desativado ou removido', async () => {
      prisma.usuarios.findFirst.mockResolvedValue(null);

      await expect(service.findAll('inativo-1')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(prisma.usuarios.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'inativo-1', deletado_em: null, ativo: true },
        }),
      );
      expect(prisma.prontuarios.findMany).not.toHaveBeenCalled();
    });
  });

  describe('escrita', () => {
    it('barra PATCH antes da operação quando o usuário não é o autor', async () => {
      prisma.prontuarios.findFirst.mockResolvedValue({
        profissional_id: 'autor-1',
      } as never);

      await expect(
        service.update('prontuario-1', { descricao: 'tentativa' }, 'gestora-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.prontuarios.update).not.toHaveBeenCalled();
    });

    it('barra DELETE antes da operação mesmo para usuário compartilhado', async () => {
      prisma.prontuarios.findFirst.mockResolvedValue({
        profissional_id: 'autor-1',
      } as never);

      await expect(
        service.remove('prontuario-1', 'compartilhado-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.prontuarios.update).not.toHaveBeenCalled();
    });

    it('trata prontuário já excluído como inexistente', async () => {
      prisma.prontuarios.findFirst.mockResolvedValue(null);

      await expect(
        service.remove('prontuario-1', 'autor-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.prontuarios.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'prontuario-1', deletado_em: null },
        }),
      );
    });

    it('exclui com soft delete e libera o agendamento', async () => {
      prisma.prontuarios.findFirst.mockResolvedValue({
        profissional_id: 'autor-1',
      } as never);

      await service.remove('prontuario-1', 'autor-1');

      expect(prisma.prontuarios.update).toHaveBeenCalledWith({
        where: { id: 'prontuario-1' },
        data: {
          deletado_em: expect.any(Date) as unknown,
          agendamento_id: null,
        },
      });
      expect(prisma.prontuarios.delete).not.toHaveBeenCalled();
    });

    it('permite ao autor substituir visibilidade e compartilhamentos', async () => {
      prisma.prontuarios.findFirst.mockResolvedValue({
        profissional_id: 'autor-1',
      } as never);
      prisma.usuarios.count.mockResolvedValue(1);
      prisma.prontuarios.update.mockResolvedValue(
        prontuario(VisibilidadeProntuario.GESTORAS, ['usuario-2']),
      );

      await service.update(
        'prontuario-1',
        {
          visibilidade: VisibilidadeProntuario.GESTORAS,
          compartilhamentos: ['usuario-2'],
        },
        'autor-1',
      );

      expect(prisma.prontuarios.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            visibilidade: VisibilidadeProntuario.GESTORAS,
            prontuario_compartilhamentos: {
              deleteMany: {},
              create: [{ usuarios: { connect: { id: 'usuario-2' } } }],
            },
          }) as unknown,
        }),
      );
    });

    it('nunca grava autor, beneficiária, agendamento ou especialidade no PATCH', async () => {
      prisma.prontuarios.findFirst.mockResolvedValue({
        profissional_id: 'autor-1',
      } as never);
      prisma.prontuarios.update.mockResolvedValue(
        prontuario(VisibilidadeProntuario.PRIVADO),
      );

      await service.update(
        'prontuario-1',
        { descricao: 'evolução' },
        'autor-1',
      );

      const { data } = prisma.prontuarios.update.mock.calls[0][0];
      expect(data).toHaveProperty('descricao', 'evolução');
      expect(data).toHaveProperty('atualizado_em', expect.any(Date));
      for (const campo of [
        'especialidade',
        'agendamento_id',
        'beneficiaria_id',
        'profissional_id',
      ]) {
        expect(data).not.toHaveProperty(campo);
      }
    });
  });
});
