import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UsuariosService } from './usuarios.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('UsuariosService', () => {
  let service: UsuariosService;

  const prismaMock = {
    usuarios: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<UsuariosService>(UsuariosService);
  });

  it('bloqueia cadastro com email de usuario removido', async () => {
    prismaMock.usuarios.findFirst.mockResolvedValue({
      id: 'usuario-removido',
      deletado_em: new Date(),
    });

    await expect(
      service.create({
        nome: 'Maria',
        email: 'usuario.teste@example.com',
        senha: '123456',
        perfis: ['PROFISSIONAL'],
        especialidade: 'Psicologia',
      }),
    ).rejects.toThrow(
      new ConflictException('E-mail já cadastrado em um usuário removido'),
    );

    expect(prismaMock.usuarios.create).not.toHaveBeenCalled();
  });

  it('traduz P2002 do Prisma em ConflictException', async () => {
    prismaMock.usuarios.findFirst.mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('senha-hash');
    prismaMock.usuarios.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate key', {
        code: 'P2002',
        clientVersion: '7.5.0',
      }),
    );

    await expect(
      service.create({
        nome: 'Maria',
        email: 'usuario.teste@example.com',
        senha: '123456',
        perfis: ['PROFISSIONAL'],
        especialidade: 'Psicologia',
      }),
    ).rejects.toThrow(new ConflictException('E-mail já cadastrado'));
  });
});
