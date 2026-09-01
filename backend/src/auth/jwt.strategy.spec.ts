import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { criarPrismaMock, type PrismaMock } from '../test-utils/prisma-mock';
import { JwtStrategy } from './jwt.strategy';

const payload = {
  sub: 'u-1',
  email: 'antigo@example.com',
  nome: 'Nome no token',
  perfis: ['GESTORA'],
};

describe('JwtStrategy.validate', () => {
  let prisma: PrismaMock;
  let strategy: JwtStrategy;

  beforeEach(() => {
    prisma = criarPrismaMock();
    const config = { getOrThrow: () => 'segredo-de-teste' };
    strategy = new JwtStrategy(config as unknown as ConfigService, prisma);
  });

  it('carrega perfis e especialidade do banco, não do token', async () => {
    prisma.usuarios.findFirst.mockResolvedValue({
      id: 'u-1',
      email: 'atual@example.com',
      nome: 'Nome atual',
      especialidade: 'FISIOTERAPIA',
      perfis_usuario: [{ perfil: 'PROFISSIONAL' }],
    } as never);

    await expect(strategy.validate(payload)).resolves.toEqual({
      id: 'u-1',
      email: 'atual@example.com',
      nome: 'Nome atual',
      especialidade: 'FISIOTERAPIA',
      perfis: ['PROFISSIONAL'],
    });
    expect(prisma.usuarios.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'u-1',
          deletado_em: null,
          ativo: true,
          versao_token: 0,
        },
      }),
    );
  });

  it('recusa token de usuário desativado ou removido', async () => {
    prisma.usuarios.findFirst.mockResolvedValue(null);

    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});

describe('JwtStrategy versão do token', () => {
  let prisma: PrismaMock;
  let strategy: JwtStrategy;

  beforeEach(() => {
    prisma = criarPrismaMock();
    const config = { getOrThrow: () => 'segredo-de-teste' };
    strategy = new JwtStrategy(config as unknown as ConfigService, prisma);
  });

  it('exige no banco a mesma versão de credenciais gravada no token', async () => {
    prisma.usuarios.findFirst.mockResolvedValue(null);

    await expect(
      strategy.validate({ ...payload, versaoToken: 2 }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.usuarios.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ versao_token: 2 }),
      }),
    );
  });

  it('recusa versão de token malformada sem consultar o banco', async () => {
    await expect(
      strategy.validate({ ...payload, versaoToken: -1 }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.usuarios.findFirst).not.toHaveBeenCalled();
  });
});
