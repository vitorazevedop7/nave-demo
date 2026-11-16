import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import type { JwtPayload } from './jwt-user.interface';

/**
 * Hash bcrypt (mesmo custo dos hashes reais) de uma senha aleatória descartada.
 * Quando o e-mail não existe, a senha informada é comparada com ele mesmo assim:
 * o tempo de resposta fica equivalente ao de uma senha errada e não revela
 * quais e-mails estão cadastrados.
 */
const HASH_FICTICIO =
  '$2b$10$PGy3B0l1FFLzrBc1tojU1.xidQQ4b8qdMi7SAeeYUKnYCZWR4l6Dy';

const CREDENCIAIS_INVALIDAS = 'Credenciais inválidas';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

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
