import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { JwtUser } from './jwt-user.interface';

/**
 * Injeta o usuário autenticado (`request.user`) no handler, já tipado.
 * Só deve ser usado em rotas protegidas pelo `JwtAuthGuard` global.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): JwtUser => {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: JwtUser }>();
    return request.user;
  },
);
