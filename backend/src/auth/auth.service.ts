import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const usuario = await this.prisma.usuarios.findFirst({
      where: { email: dto.email, deletado_em: null, ativo: true },
      select: {
        id: true,
        nome: true,
        email: true,
        senha_hash: true,
        especialidade: true,
        perfis_usuario: { select: { perfil: true } },
      },
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const senhaValida = await bcrypt.compare(dto.senha, usuario.senha_hash);
    if (!senhaValida) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const perfis = usuario.perfis_usuario.map((p) => p.perfil);

    const payload = {
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
}
