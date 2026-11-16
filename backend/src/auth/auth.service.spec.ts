import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { criarPrismaMock, type PrismaMock } from '../test-utils/prisma-mock';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({ compare: jest.fn() }));

const compare = bcrypt.compare as jest.Mock;

const usuario = {
  id: 'u-1',
  nome: 'Ana',
  email: 'ana@example.com',
  senha_hash: '$2b$10$hash-real',
  especialidade: 'PSICOLOGIA',
  perfis_usuario: [{ perfil: 'PROFISSIONAL' }, { perfil: 'GESTORA' }],
};

describe('AuthService.login', () => {
  let prisma: PrismaMock;
  let jwt: { sign: jest.Mock };
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = criarPrismaMock();
    jwt = { sign: jest.fn().mockReturnValue('token-assinado') };
    service = new AuthService(prisma, jwt as unknown as JwtService);
  });

  it('emite token e devolve o usuário sem a senha', async () => {
    prisma.usuarios.findFirst.mockResolvedValue(usuario as never);
    compare.mockResolvedValue(true);

    const resultado = await service.login({
      email: usuario.email,
      senha: 'correta',
    });

    expect(resultado).toEqual({
      access_token: 'token-assinado',
      usuario: {
        id: 'u-1',
        nome: 'Ana',
        email: 'ana@example.com',
        especialidade: 'PSICOLOGIA',
        perfis: ['PROFISSIONAL', 'GESTORA'],
      },
    });
    expect(JSON.stringify(resultado)).not.toContain('senha');
    expect(jwt.sign).toHaveBeenCalledWith({
      sub: 'u-1',
      email: 'ana@example.com',
      nome: 'Ana',
      perfis: ['PROFISSIONAL', 'GESTORA'],
    });
  });

  it('busca apenas usuário ativo e não removido', async () => {
    prisma.usuarios.findFirst.mockResolvedValue(null);
    compare.mockResolvedValue(false);

    await expect(
      service.login({ email: 'x@example.com', senha: 'qualquer' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.usuarios.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: 'x@example.com', deletado_em: null, ativo: true },
      }),
    );
  });

  it('rejeita senha errada com a mesma mensagem de e-mail inexistente', async () => {
    prisma.usuarios.findFirst.mockResolvedValue(usuario as never);
    compare.mockResolvedValue(false);

    await expect(
      service.login({ email: usuario.email, senha: 'errada' }),
    ).rejects.toThrow(new UnauthorizedException('Credenciais inválidas'));
    expect(jwt.sign).not.toHaveBeenCalled();
  });

  it('compara a senha mesmo quando o e-mail não existe (tempo constante)', async () => {
    prisma.usuarios.findFirst.mockResolvedValue(null);
    compare.mockResolvedValue(true);

    await expect(
      service.login({ email: 'inexistente@example.com', senha: 'qualquer' }),
    ).rejects.toThrow(new UnauthorizedException('Credenciais inválidas'));

    expect(compare).toHaveBeenCalledTimes(1);
    const [senha, hash] = compare.mock.calls[0] as [string, string];
    expect(senha).toBe('qualquer');
    expect(hash).toMatch(/^\$2b\$10\$/);
  });

  it('distingue banco indisponível de credencial inválida (503) sem logar o e-mail', async () => {
    const logError = jest
      .spyOn(service['logger'], 'error')
      .mockImplementation(() => undefined);
    prisma.usuarios.findFirst.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(
      service.login({ email: 'sigilo@example.com', senha: 'qualquer' }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(compare).not.toHaveBeenCalled();
    expect(JSON.stringify(logError.mock.calls)).not.toContain('sigilo');
  });
});
