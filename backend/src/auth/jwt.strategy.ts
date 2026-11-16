import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload, JwtUser } from './jwt-user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * A assinatura válida só prova que o token foi emitido por nós. Quem pode
   * agir é decidido pelo banco: usuário desativado ou removido perde o acesso
   * na próxima requisição, e não quando o token expirar.
   */
  async validate(payload: JwtPayload): Promise<JwtUser> {
    const usuario = await this.prisma.usuarios.findFirst({
      where: { id: payload.sub, deletado_em: null, ativo: true },
      select: {
        id: true,
        email: true,
        nome: true,
        especialidade: true,
        perfis_usuario: { select: { perfil: true } },
      },
    });

    if (!usuario) {
      throw new UnauthorizedException('Sessão inválida. Faça login novamente.');
    }

    return {
      id: usuario.id,
      email: usuario.email,
      nome: usuario.nome,
      especialidade: usuario.especialidade,
      perfis: usuario.perfis_usuario.map(({ perfil }) => perfil),
    };
  }
}
