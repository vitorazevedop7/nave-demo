import { Prisma } from '@prisma/client';
import type { Perfil } from '../auth/perfis';

/**
 * Perfis que de fato chegam a um prontuário. TRIADORA fica fora de propósito:
 * o controller de prontuários a barra, então compartilhar com ela seria
 * prometer um acesso que nunca acontece.
 */
export const PERFIS_COMPARTILHAVEIS: Perfil[] = ['GESTORA', 'PROFISSIONAL'];

/**
 * Quem pode receber um compartilhamento nominal de prontuário. A mesma regra
 * alimenta o seletor do frontend (`GET /usuarios/compartilhaveis`) e a
 * validação de escrita em `ProntuariosService`, para as duas nunca divergirem.
 */
export const WHERE_USUARIO_COMPARTILHAVEL = {
  deletado_em: null,
  ativo: true,
  perfis_usuario: { some: { perfil: { in: PERFIS_COMPARTILHAVEIS } } },
} satisfies Prisma.usuariosWhereInput;
