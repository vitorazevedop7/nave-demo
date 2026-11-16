import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { JwtUser } from './jwt-user.interface';
import type { Perfil } from './perfis';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const perfisExigidos = this.reflector.getAllAndOverride<
      Perfil[] | undefined
    >(ROLES_KEY, [context.getHandler(), context.getClass()]);

    if (!perfisExigidos || perfisExigidos.length === 0) return true;

    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: Partial<JwtUser> }>();
    return (
      user?.perfis?.some((perfil) =>
        (perfisExigidos as string[]).includes(perfil),
      ) ?? false
    );
  }
}
