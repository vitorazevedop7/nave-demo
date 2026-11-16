import { SetMetadata } from '@nestjs/common';
import type { Perfil } from './perfis';

export const ROLES_KEY = 'roles';

/**
 * Restringe a rota (ou o controller inteiro) aos perfis informados. Basta o
 * usuário ter um deles. A declaração no método substitui a da classe.
 */
export const Roles = (...roles: Perfil[]) => SetMetadata(ROLES_KEY, roles);
