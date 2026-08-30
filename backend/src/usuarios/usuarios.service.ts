import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

const USUARIO_SELECT = {
  id: true,
  nome: true,
  email: true,
  especialidade: true,
  ativo: true,
  criado_em: true,
  deletado_em: true,
  perfis_usuario: {
    select: { id: true, perfil: true },
  },
} as const;

const BCRYPT_ROUNDS = 10;

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  private async validarEmailDisponivel(email: string, ignorarId?: string) {
    const usuarioComMesmoEmail = await this.prisma.usuarios.findFirst({
      where: {
        email,
        ...(ignorarId ? { NOT: { id: ignorarId } } : {}),
      },
      select: { id: true, deletado_em: true },
    });

    if (!usuarioComMesmoEmail) {
      return;
    }

    if (usuarioComMesmoEmail.deletado_em) {
      throw new ConflictException(
        'E-mail já cadastrado em um usuário removido',
      );
    }

    throw new ConflictException('E-mail já cadastrado');
  }

  private tratarErroEmailDuplicado(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('E-mail já cadastrado');
    }

    throw error;
  }

  async findAll() {
    return this.prisma.usuarios.findMany({
      where: { deletado_em: null },
      select: USUARIO_SELECT,
    });
  }

  // "Incluir alguém" no seletor de visibilidade: o autor de um laudo precisa
  // procurar quem incluir, e ele é PROFISSIONAL — não passa em findAll (GESTORA).
  // Lista só quem pode de fato chegar a um prontuário: GESTORA e PROFISSIONAL.
  // TRIADORA fica fora de propósito — o controller de prontuários a barra, então
  // oferecê-la aqui seria prometer um acesso que nunca acontece.
  async findCompartilhaveis() {
    const usuarios = await this.prisma.usuarios.findMany({
      where: {
        deletado_em: null,
        ativo: true,
        perfis_usuario: {
          some: { perfil: { in: ['GESTORA', 'PROFISSIONAL'] } },
        },
      },
      select: {
        id: true,
        nome: true,
        especialidade: true,
        perfis_usuario: { select: { perfil: true } },
      },
      orderBy: { nome: 'asc' },
    });

    return usuarios.map(({ perfis_usuario, ...usuario }) => ({
      ...usuario,
      perfis: perfis_usuario.map(({ perfil }) => perfil),
    }));
  }

  async findProfissionais() {
    return this.prisma.usuarios.findMany({
      where: {
        deletado_em: null,
        ativo: true,
        perfis_usuario: { some: { perfil: 'PROFISSIONAL' } },
      },
      select: { id: true, nome: true, especialidade: true },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string) {
    const usuario = await this.prisma.usuarios.findFirst({
      where: { id, deletado_em: null },
      select: USUARIO_SELECT,
    });

    if (!usuario) {
      throw new NotFoundException(`Usuário ${id} não encontrado`);
    }

    return usuario;
  }

  async create(dto: CreateUsuarioDto) {
    await this.validarEmailDisponivel(dto.email);

    const senha_hash = await bcrypt.hash(dto.senha, BCRYPT_ROUNDS);

    try {
      return await this.prisma.usuarios.create({
        data: {
          nome: dto.nome,
          email: dto.email,
          senha_hash,
          especialidade: dto.especialidade,
          perfis_usuario: {
            create: dto.perfis.map((perfil) => ({ perfil })),
          },
        },
        select: USUARIO_SELECT,
      });
    } catch (error) {
      this.tratarErroEmailDuplicado(error);
    }
  }

  async update(id: string, dto: UpdateUsuarioDto) {
    await this.findOne(id);

    if (dto.email) {
      await this.validarEmailDisponivel(dto.email, id);
    }

    const data: Record<string, unknown> = {};

    if (dto.nome !== undefined) data.nome = dto.nome;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.especialidade !== undefined) data.especialidade = dto.especialidade;
    if (dto.ativo !== undefined) data.ativo = dto.ativo;
    if (dto.senha !== undefined) {
      data.senha_hash = await bcrypt.hash(dto.senha, BCRYPT_ROUNDS);
    }

    if (dto.perfis !== undefined) {
      await this.prisma.perfis_usuario.deleteMany({ where: { usuario_id: id } });
      data.perfis_usuario = {
        create: dto.perfis.map((perfil) => ({ perfil })),
      };
    }

    try {
      return await this.prisma.usuarios.update({
        where: { id },
        data,
        select: USUARIO_SELECT,
      });
    } catch (error) {
      this.tratarErroEmailDuplicado(error);
    }
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.usuarios.update({
      where: { id },
      data: { deletado_em: new Date() },
      select: USUARIO_SELECT,
    });
  }
}
