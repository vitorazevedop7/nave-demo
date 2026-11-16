/**
 * Perfis de acesso do sistema. Um usuário pode acumular mais de um perfil;
 * as regras de autorização sempre avaliam a união deles.
 */
export const PERFIS = ['GESTORA', 'TRIADORA', 'PROFISSIONAL'] as const;

export type Perfil = (typeof PERFIS)[number];
