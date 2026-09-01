import { HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PasswordResetRateLimiter } from './password-reset-rate-limiter.service';

describe('PasswordResetRateLimiter', () => {
  it('bloqueia excesso de solicitações na janela configurada', () => {
    const config = {
      get: jest.fn((name: string) => {
        if (name === 'PASSWORD_RESET_RATE_LIMIT_MAX') return '2';
        if (name === 'PASSWORD_RESET_RATE_LIMIT_WINDOW_MINUTES') return '15';
        return undefined;
      }),
    };
    const limiter = new PasswordResetRateLimiter(
      config as unknown as ConfigService,
    );

    limiter.assertAllowed('127.0.0.1', 'teste@example.test');
    limiter.assertAllowed('127.0.0.1', 'teste@example.test');

    expect(() =>
      limiter.assertAllowed('127.0.0.1', 'teste@example.test'),
    ).toThrow(HttpException);
  });
});
