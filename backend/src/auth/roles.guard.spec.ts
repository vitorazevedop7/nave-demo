import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Perfil } from './perfis';
import { RolesGuard } from './roles.guard';

function contexto(
  perfisExigidos: Perfil[] | undefined,
  perfisDoUsuario?: string[],
): { context: ExecutionContext; reflector: Reflector } {
  const reflector = new Reflector();
  jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(perfisExigidos);
  const context = {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({
      getRequest: () => ({
        user: perfisDoUsuario ? { perfis: perfisDoUsuario } : undefined,
      }),
    }),
  } as unknown as ExecutionContext;
  return { context, reflector };
}

describe('RolesGuard', () => {
  it('libera rota sem @Roles', () => {
    const { context, reflector } = contexto(undefined, ['TRIADORA']);
    expect(new RolesGuard(reflector).canActivate(context)).toBe(true);
  });

  it('libera rota com @Roles vazio', () => {
    const { context, reflector } = contexto([], ['TRIADORA']);
    expect(new RolesGuard(reflector).canActivate(context)).toBe(true);
  });

  it('libera quando o usuário tem um dos perfis exigidos', () => {
    const { context, reflector } = contexto(
      ['GESTORA', 'PROFISSIONAL'],
      ['PROFISSIONAL'],
    );
    expect(new RolesGuard(reflector).canActivate(context)).toBe(true);
  });

  it('avalia a união dos perfis do usuário', () => {
    const { context, reflector } = contexto(
      ['GESTORA'],
      ['TRIADORA', 'GESTORA'],
    );
    expect(new RolesGuard(reflector).canActivate(context)).toBe(true);
  });

  it('nega quando nenhum perfil do usuário é exigido', () => {
    const { context, reflector } = contexto(
      ['GESTORA', 'PROFISSIONAL'],
      ['TRIADORA'],
    );
    expect(new RolesGuard(reflector).canActivate(context)).toBe(false);
  });

  it('nega quando não há usuário na requisição', () => {
    const { context, reflector } = contexto(['GESTORA']);
    expect(new RolesGuard(reflector).canActivate(context)).toBe(false);
  });

  it('dá precedência à declaração do método sobre a da classe', () => {
    const { context, reflector } = contexto(['GESTORA'], ['GESTORA']);
    new RolesGuard(reflector).canActivate(context);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith('roles', [
      undefined,
      undefined,
    ]);
  });
});
