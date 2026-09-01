import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import type { JwtPayload } from './jwt-user.interface';
import { PasswordResetRateLimiter } from './password-reset-rate-limiter.service';

/**
 * Hash bcrypt (mesmo custo dos hashes reais) de uma senha aleatória descartada.
 * Quando o e-mail não existe, a senha informada é comparada com ele mesmo assim:
 * o tempo de resposta fica equivalente ao de uma senha errada e não revela
 * quais e-mails estão cadastrados.
 */
const HASH_FICTICIO =
  '$2b$10$PGy3B0l1FFLzrBc1tojU1.xidQQ4b8qdMi7SAeeYUKnYCZWR4l6Dy';

const CREDENCIAIS_INVALIDAS = 'Credenciais inválidas';

const GENERIC_RESET_REQUEST_RESPONSE = {
  message:
    'Se o e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha.',
};
const INVALID_RESET_TOKEN_MESSAGE = 'Token inválido ou expirado.';
const RESET_PASSWORD_BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly resetTokenTtlMinutes: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
    private readonly resetRateLimiter: PasswordResetRateLimiter,
  ) {
    const configuredTtl = Number(
      this.config.get<string>('PASSWORD_RESET_TOKEN_TTL_MINUTES'),
    );
    this.resetTokenTtlMinutes =
      Number.isFinite(configuredTtl) && configuredTtl > 0 ? configuredTtl : 30;
  }

  async login(dto: LoginDto) {
    const usuario = await this.buscarUsuarioParaLogin(dto.email);

    const senhaValida = await bcrypt.compare(
      dto.senha,
      usuario?.senha_hash ?? HASH_FICTICIO,
    );

    if (!usuario || !senhaValida) {
      throw new UnauthorizedException(CREDENCIAIS_INVALIDAS);
    }

    const perfis = usuario.perfis_usuario.map((p) => p.perfil);

    const payload: JwtPayload = {
      sub: usuario.id,
      email: usuario.email,
      nome: usuario.nome,
      perfis,
      versaoToken: usuario.versao_token,
    };

    return {
      access_token: this.jwtService.sign(payload),
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        especialidade: usuario.especialidade,
        perfis,
      },
    };
  }

  async requestPasswordReset(dto: RequestPasswordResetDto, ip: string) {
    const email = dto.email.trim().toLowerCase();
    this.resetRateLimiter.assertAllowed(ip, email);

    let usuario: { id: string; email: string } | null;
    try {
      usuario = await this.prisma.usuarios.findFirst({
        where: {
          email: { equals: email, mode: 'insensitive' },
          deletado_em: null,
          ativo: true,
        },
        select: { id: true, email: true },
      });
    } catch {
      this.logger.error(
        'Falha ao consultar solicitação de redefinição de senha',
      );
      return GENERIC_RESET_REQUEST_RESPONSE;
    }

    if (!usuario) {
      return GENERIC_RESET_REQUEST_RESPONSE;
    }

    const token = randomBytes(32).toString('base64url');
    const tokenHash = this.hashResetToken(token);
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + this.resetTokenTtlMinutes * 60_000,
    );

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.redefinicoes_senha.updateMany({
          where: { usuario_id: usuario.id, usado_em: null },
          data: { usado_em: now },
        });
        await tx.redefinicoes_senha.create({
          data: {
            usuario_id: usuario.id,
            token_hash: tokenHash,
            expira_em: expiresAt,
          },
        });
      });

      await this.mail.sendPasswordReset({ to: usuario.email, token });
    } catch {
      // O retorno permanece genérico e nenhum token/e-mail é escrito nos logs.
      this.logger.error(
        'Falha ao processar solicitação de redefinição de senha',
      );
    }

    return GENERIC_RESET_REQUEST_RESPONSE;
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = this.hashResetToken(dto.token);
    const now = new Date();
    const reset = await this.prisma.redefinicoes_senha.findUnique({
      where: { token_hash: tokenHash },
      include: {
        usuarios: {
          select: { id: true, ativo: true, deletado_em: true },
        },
      },
    });

    if (
      !reset ||
      reset.usado_em ||
      reset.expira_em <= now ||
      !reset.usuarios.ativo ||
      reset.usuarios.deletado_em
    ) {
      throw new BadRequestException(INVALID_RESET_TOKEN_MESSAGE);
    }

    const passwordHash = await bcrypt.hash(
      dto.novaSenha,
      RESET_PASSWORD_BCRYPT_ROUNDS,
    );

    try {
      await this.prisma.$transaction(async (tx) => {
        const claimed = await tx.redefinicoes_senha.updateMany({
          where: {
            id: reset.id,
            usado_em: null,
            expira_em: { gt: now },
          },
          data: { usado_em: now },
        });

        if (claimed.count !== 1) {
          throw new BadRequestException(INVALID_RESET_TOKEN_MESSAGE);
        }

        await tx.usuarios.update({
          where: { id: reset.usuario_id },
          data: {
            senha_hash: passwordHash,
            versao_token: { increment: 1 },
          },
        });
        await tx.redefinicoes_senha.updateMany({
          where: { usuario_id: reset.usuario_id, usado_em: null },
          data: { usado_em: now },
        });
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Falha ao concluir redefinição de senha');
      throw new BadRequestException(INVALID_RESET_TOKEN_MESSAGE);
    }

    return { message: 'Senha redefinida com sucesso.' };
  }

  private hashResetToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Busca o usuário para autenticação, isolando falhas de infraestrutura
   * (banco fora do ar, sem tabelas, etc.) de credencial inválida: essas duas
   * situações têm causas e respostas HTTP diferentes. O e-mail informado não
   * vai para o log.
   */
  private async buscarUsuarioParaLogin(email: string) {
    try {
      return await this.prisma.usuarios.findFirst({
        where: { email, deletado_em: null, ativo: true },
        select: {
          id: true,
          nome: true,
          email: true,
          senha_hash: true,
          versao_token: true,
          especialidade: true,
          perfis_usuario: { select: { perfil: true } },
        },
      });
    } catch (erro) {
      this.logger.error(
        `Falha de infraestrutura durante o login: ${
          erro instanceof Error ? erro.message : String(erro)
        }`,
        erro instanceof Error ? erro.stack : undefined,
      );
      throw new ServiceUnavailableException(
        'Não foi possível conectar ao banco de dados. Tente novamente em alguns instantes.',
      );
    }
  }
}
