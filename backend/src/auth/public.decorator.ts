import { SetMetadata } from '@nestjs/common';

/**
 * Marca uma rota como pública, dispensando o guard global de autenticação
 * (`JwtAuthGuard` registrado como `APP_GUARD`). Use apenas em endpoints que
 * precisam ser acessíveis sem token: login e health check.
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
