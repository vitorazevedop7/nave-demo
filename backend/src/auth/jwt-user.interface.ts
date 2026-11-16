/**
 * Usuário autenticado anexado a `request.user` pelo `JwtStrategy`.
 *
 * Perfis e especialidade vêm do banco a cada requisição, não do token: assim
 * uma alteração de perfil ou a desativação da conta vale imediatamente, sem
 * esperar o token expirar.
 */
export interface JwtUser {
  id: string;
  email: string;
  nome: string;
  especialidade: string | null;
  perfis: string[];
}

/** Conteúdo assinado no token de acesso. */
export interface JwtPayload {
  sub: string;
  email: string;
  nome: string;
  perfis: string[];
}
