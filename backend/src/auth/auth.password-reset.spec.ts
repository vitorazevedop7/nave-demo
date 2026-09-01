import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { PasswordResetRateLimiter } from './password-reset-rate-limiter.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService password reset', () => {
  type ResetUpdateManyArgs = {
    where: {
      id?: string;
      usuario_id?: string;
      usado_em: null;
      expira_em?: { gt: Date };
    };
    data: { usado_em: Date };
  };
  type ResetCreateArgs = {
    data: {
      usuario_id: string;
      token_hash: string;
      expira_em: Date;
    };
  };
  type UserUpdateArgs = {
    where: { id: string };
    data: {
      senha_hash: string;
      versao_token: { increment: number };
    };
  };
  let updateResetArgs: ResetUpdateManyArgs[] = [];
  let createdReset: ResetCreateArgs | undefined;
  let updatedUser: UserUpdateArgs | undefined;
  let sentMessage: { to: string; token: string } | undefined;
  let nextUpdateCount = 1;
  const updateResetManyMock = jest.fn((args: ResetUpdateManyArgs) => {
    updateResetArgs.push(args);
    return Promise.resolve({ count: nextUpdateCount });
  });
  const createResetMock = jest.fn((args: ResetCreateArgs) => {
    createdReset = args;
    return Promise.resolve({});
  });
  const updateUserMock = jest.fn((args: UserUpdateArgs) => {
    updatedUser = args;
    return Promise.resolve({});
  });
  const transactionMock = {
    usuarios: { update: updateUserMock },
    redefinicoes_senha: {
      create: createResetMock,
      updateMany: updateResetManyMock,
    },
  };
  const prismaMock = {
    usuarios: { findFirst: jest.fn() },
    redefinicoes_senha: { findUnique: jest.fn() },
    $transaction: jest.fn(
      async (callback: (tx: typeof transactionMock) => Promise<unknown>) =>
        callback(transactionMock),
    ),
  };
  const mailMock = {
    sendPasswordReset: jest.fn((message: { to: string; token: string }) => {
      sentMessage = message;
      return Promise.resolve();
    }),
  };
  const rateLimiterMock = { assertAllowed: jest.fn() };
  const configMock = {
    get: jest.fn((name: string) =>
      name === 'PASSWORD_RESET_TOKEN_TTL_MINUTES' ? '30' : undefined,
    ),
  };
  const jwtMock = { sign: jest.fn() };
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-09-01T15:00:00.000Z'));
    updateResetArgs = [];
    createdReset = undefined;
    updatedUser = undefined;
    sentMessage = undefined;
    nextUpdateCount = 1;

    service = new AuthService(
      prismaMock as unknown as PrismaService,
      jwtMock as unknown as JwtService,
      configMock as unknown as ConfigService,
      mailMock as unknown as MailService,
      rateLimiterMock as unknown as PasswordResetRateLimiter,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('gera token aleatório, armazena somente o hash e define expiração curta', async () => {
    prismaMock.usuarios.findFirst.mockResolvedValue({
      id: 'usuario-1',
      email: 'teste-controlado@example.test',
    });

    const response = await service.requestPasswordReset(
      { email: 'TESTE-CONTROLADO@example.test' },
      '127.0.0.1',
    );

    if (!sentMessage || !createdReset) {
      throw new Error('As chamadas de criação e e-mail eram esperadas');
    }
    const sentToken = sentMessage.token;
    const stored = createdReset.data;

    expect(sentToken).toHaveLength(43);
    expect(stored.token_hash).toBe(
      createHash('sha256').update(sentToken).digest('hex'),
    );
    expect(stored.token_hash).not.toContain(sentToken);
    expect(stored.expira_em).toEqual(new Date('2026-09-01T15:30:00.000Z'));
    expect(response).toEqual({
      message:
        'Se o e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha.',
    });
  });

  it('retorna a mesma resposta genérica quando o e-mail não existe', async () => {
    prismaMock.usuarios.findFirst.mockResolvedValue(null);

    const response = await service.requestPasswordReset(
      { email: 'inexistente@example.test' },
      '127.0.0.1',
    );

    expect(response.message).toContain('Se o e-mail estiver cadastrado');
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(mailMock.sendPasswordReset).not.toHaveBeenCalled();
  });

  it('rejeita token expirado sem alterar a senha', async () => {
    prismaMock.redefinicoes_senha.findUnique.mockResolvedValue({
      id: 'reset-1',
      usuario_id: 'usuario-1',
      usado_em: null,
      expira_em: new Date('2026-09-01T14:59:59.000Z'),
      usuarios: { id: 'usuario-1', ativo: true, deletado_em: null },
    });

    await expect(
      service.resetPassword({
        token: 'a'.repeat(43),
        novaSenha: 'SenhaNova123',
      }),
    ).rejects.toThrow(new BadRequestException('Token inválido ou expirado.'));

    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('reivindica o token uma única vez e atualiza a senha com bcrypt', async () => {
    prismaMock.redefinicoes_senha.findUnique.mockResolvedValue({
      id: 'reset-1',
      usuario_id: 'usuario-1',
      usado_em: null,
      expira_em: new Date('2026-09-01T15:30:00.000Z'),
      usuarios: { id: 'usuario-1', ativo: true, deletado_em: null },
    });
    (bcrypt.hash as jest.Mock).mockResolvedValue('bcrypt-hash');

    const response = await service.resetPassword({
      token: 'b'.repeat(43),
      novaSenha: 'SenhaNova123',
    });

    const claimCall = updateResetArgs[0];
    if (!claimCall || !updatedUser) {
      throw new Error('A reivindicação do token era esperada');
    }
    expect(claimCall.where).toEqual({
      id: 'reset-1',
      usado_em: null,
      expira_em: { gt: new Date('2026-09-01T15:00:00.000Z') },
    });
    expect(updatedUser).toEqual({
      where: { id: 'usuario-1' },
      data: {
        senha_hash: 'bcrypt-hash',
        versao_token: { increment: 1 },
      },
    });
    expect(bcrypt.hash).toHaveBeenCalledWith('SenhaNova123', 12);
    expect(response).toEqual({ message: 'Senha redefinida com sucesso.' });
  });

  it('rejeita reutilização concorrente quando o token já foi reivindicado', async () => {
    prismaMock.redefinicoes_senha.findUnique.mockResolvedValue({
      id: 'reset-1',
      usuario_id: 'usuario-1',
      usado_em: null,
      expira_em: new Date('2026-09-01T15:30:00.000Z'),
      usuarios: { id: 'usuario-1', ativo: true, deletado_em: null },
    });
    nextUpdateCount = 0;
    (bcrypt.hash as jest.Mock).mockResolvedValue('bcrypt-hash');

    await expect(
      service.resetPassword({
        token: 'c'.repeat(43),
        novaSenha: 'SenhaNova123',
      }),
    ).rejects.toThrow(new BadRequestException('Token inválido ou expirado.'));

    expect(updatedUser).toBeUndefined();
  });
});
