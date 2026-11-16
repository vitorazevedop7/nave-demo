import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY, Public } from './public.decorator';

const context = {
  getHandler: () => undefined,
  getClass: () => undefined,
} as unknown as ExecutionContext;

describe('JwtAuthGuard', () => {
  let reflector: Reflector;
  let guard: JwtAuthGuard;
  let canActivatePassport: jest.SpyInstance;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
    canActivatePassport = jest
      .spyOn(
        (
          AuthGuard('jwt') as unknown as {
            prototype: { canActivate: () => boolean };
          }
        ).prototype,
        'canActivate',
      )
      .mockReturnValue(false);
  });

  afterEach(() => jest.restoreAllMocks());

  it('dispensa token em rota marcada com @Public()', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

    expect(guard.canActivate(context)).toBe(true);
    expect(canActivatePassport).not.toHaveBeenCalled();
  });

  it('delega à estratégia JWT nas demais rotas', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    expect(guard.canActivate(context)).toBe(false);
    expect(canActivatePassport).toHaveBeenCalledWith(context);
  });

  it('@Public() grava o metadado lido pelo guard', () => {
    class Exemplo {
      @Public()
      rota() {}
    }

    expect(Reflect.getMetadata(IS_PUBLIC_KEY, Exemplo.prototype.rota)).toBe(
      true,
    );
  });
});
