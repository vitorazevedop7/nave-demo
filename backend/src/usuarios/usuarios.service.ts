import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { WHERE_USUARIO_COMPARTILHAVEL } from './usuario-compartilhavel';

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
  // A regra de quem é elegível é compartilhada com a validação de escrita em
  // ProntuariosService (ver WHERE_USUARIO_COMPARTILHAVEL).
  async findCompartilhaveis() {
    const usuarios = await this.prisma.usuarios.findMany({
      where: WHERE_USUARIO_COMPARTILHAVEL,
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

  /**
   * `solicitanteId` é a gestora autenticada. Ela não pode desativar a própria
   * conta nem retirar de si o perfil GESTORA: isso a trancaria fora do
   * sistema (e, sendo a única gestora, sem ninguém para reverter).
   */
  async update(id: string, dto: UpdateUsuarioDto, solicitanteId: string) {
    await this.findOne(id);

    if (id === solicitanteId) {
      if (dto.ativo === false) {
        throw new BadRequestException(
          'Você não pode desativar a própria conta',
        );
      }
      if (dto.perfis && !dto.perfis.includes('GESTORA')) {
        throw new BadRequestException(
          'Você não pode remover o próprio perfil de gestora',
        );
      }
    }

    if (dto.email) {
      await this.validarEmailDisponivel(dto.email, id);
    }

    const data: Prisma.usuariosUpdateInput = {};

    if (dto.nome !== undefined) data.nome = dto.nome;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.especialidade !== undefined) data.especialidade = dto.especialidade;
    if (dto.ativo !== undefined) data.ativo = dto.ativo;
    if (dto.senha !== undefined) {
      data.senha_hash = await bcrypt.hash(dto.senha, BCRYPT_ROUNDS);
      data.versao_token = { increment: 1 };
    }

    // A troca de perfis apaga e recria as linhas. Como escrita aninhada no
    // mesmo `update`, o Prisma executa tudo numa única transação: uma falha no
    // meio não deixa o usuário sem perfil algum.
    if (dto.perfis !== undefined) {
      data.perfis_usuario = {
        deleteMany: {},
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

  async remove(id: string, solicitanteId: string) {
    if (id === solicitanteId) {
      throw new BadRequestException('Você não pode remover a própria conta');
    }

    await this.findOne(id);

    return this.prisma.usuarios.update({
      where: { id },
      data: { deletado_em: new Date() },
      select: USUARIO_SELECT,
    });
  }
}
