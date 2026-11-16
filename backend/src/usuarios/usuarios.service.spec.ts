import { BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { criarPrismaMock, type PrismaMock } from '../test-utils/prisma-mock';
import { WHERE_USUARIO_COMPARTILHAVEL } from './usuario-compartilhavel';
import { UsuariosService } from './usuarios.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

const GESTORA_ID = 'gestora-1';
const OUTRO_ID = 'usuario-2';

const dtoCriacao = {
  nome: 'Maria',
  email: 'usuario.teste@example.com',
  senha: '123456',
  perfis: ['PROFISSIONAL' as const],
  especialidade: 'Psicologia',
};

describe('UsuariosService', () => {
  let prisma: PrismaMock;
  let service: UsuariosService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = criarPrismaMock();
    service = new UsuariosService(prisma);
  });

  describe('create', () => {
    it('bloqueia cadastro com email de usuario removido', async () => {
      prisma.usuarios.findFirst.mockResolvedValue({
        id: 'usuario-removido',
        deletado_em: new Date(),
      } as never);

      await expect(service.create(dtoCriacao)).rejects.toThrow(
        new ConflictException('E-mail já cadastrado em um usuário removido'),
      );
      expect(prisma.usuarios.create).not.toHaveBeenCalled();
    });

    it('traduz P2002 do Prisma em ConflictException', async () => {
      prisma.usuarios.findFirst.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('senha-hash');
      prisma.usuarios.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('duplicate key', {
          code: 'P2002',
          clientVersion: '7.5.0',
        }),
      );

      await expect(service.create(dtoCriacao)).rejects.toThrow(
        new ConflictException('E-mail já cadastrado'),
      );
    });

    it('grava apenas o hash da senha, nunca a senha em texto', async () => {
      prisma.usuarios.findFirst.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('senha-hash');
      prisma.usuarios.create.mockResolvedValue({ id: 'novo' } as never);

      await service.create(dtoCriacao);

      const { data } = prisma.usuarios.create.mock.calls[0][0];
      expect(data).toMatchObject({ senha_hash: 'senha-hash' });
      expect(data).not.toHaveProperty('senha');
    });
  });

  describe('update', () => {
    beforeEach(() => {
      prisma.usuarios.findFirst.mockResolvedValue({ id: GESTORA_ID } as never);
      prisma.usuarios.update.mockResolvedValue({ id: GESTORA_ID } as never);
    });

    it('impede a gestora de desativar a própria conta', async () => {
      await expect(
        service.update(GESTORA_ID, { ativo: false }, GESTORA_ID),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.usuarios.update).not.toHaveBeenCalled();
    });

    it('impede a gestora de remover de si o perfil GESTORA', async () => {
      await expect(
        service.update(GESTORA_ID, { perfis: ['PROFISSIONAL'] }, GESTORA_ID),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.usuarios.update).not.toHaveBeenCalled();
    });

    it('permite desativar outro usuário', async () => {
      await service.update(OUTRO_ID, { ativo: false }, GESTORA_ID);

      expect(prisma.usuarios.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: OUTRO_ID },
          data: { ativo: false },
        }),
      );
    });

    it('substitui perfis numa escrita aninhada única (atômica)', async () => {
      await service.update(
        OUTRO_ID,
        { perfis: ['TRIADORA', 'PROFISSIONAL'] },
        GESTORA_ID,
      );

      expect(prisma.perfis_usuario.deleteMany).not.toHaveBeenCalled();
      expect(prisma.usuarios.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            perfis_usuario: {
              deleteMany: {},
              create: [{ perfil: 'TRIADORA' }, { perfil: 'PROFISSIONAL' }],
            },
          },
        }),
      );
    });
  });

  describe('remove', () => {
    it('impede a gestora de remover a própria conta', async () => {
      await expect(
        service.remove(GESTORA_ID, GESTORA_ID),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.usuarios.update).not.toHaveBeenCalled();
    });

    it('remove outro usuário com soft delete', async () => {
      prisma.usuarios.findFirst.mockResolvedValue({ id: OUTRO_ID } as never);

      await service.remove(OUTRO_ID, GESTORA_ID);

      expect(prisma.usuarios.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: OUTRO_ID },
          data: { deletado_em: expect.any(Date) as unknown },
        }),
      );
      expect(prisma.usuarios.delete).not.toHaveBeenCalled();
    });
  });

  it('lista compartilháveis com a mesma regra usada na validação de prontuários', async () => {
    prisma.usuarios.findMany.mockResolvedValue([
      {
        id: 'u-1',
        nome: 'Ana',
        especialidade: null,
        perfis_usuario: [{ perfil: 'GESTORA' }],
      },
    ] as never);

    await expect(service.findCompartilhaveis()).resolves.toEqual([
      { id: 'u-1', nome: 'Ana', especialidade: null, perfis: ['GESTORA'] },
    ]);
    expect(prisma.usuarios.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: WHERE_USUARIO_COMPARTILHAVEL }),
    );
  });
});
