import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBeneficiariaDto } from './dto/create-beneficiaria.dto';
import { UpdateBeneficiariaDto } from './dto/update-beneficiaria.dto';

/** Perfis que administram cadastros e, por isso, podem ver o CPF na busca. */
const PERFIS_COM_ACESSO_AO_CPF = new Set(['GESTORA', 'TRIADORA']);

@Injectable()
export class BeneficiariasService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateBeneficiariaDto) {
    return this.prisma.beneficiarias.create({
      data: {
        nome: dto.nome,
        cpf: dto.cpf,
        telefone: dto.telefone,
        endereco: dto.endereco,
        tipo: dto.tipo ?? 'ADULTA',
        responsavel_id: dto.responsavel_id,
        status: dto.status ?? 'ATIVA',
        estado_civil: dto.estado_civil,
        escolaridade: dto.escolaridade,
        raca: dto.raca,
        ocupacao: dto.ocupacao,
        empregada: dto.empregada,
        ...(dto.data_nascimento && {
          data_nascimento: new Date(dto.data_nascimento),
        }),
      },
    });
  }

  findAll() {
    return this.prisma.beneficiarias.findMany({
      where: { deletado_em: null },
      orderBy: { criado_em: 'desc' },
    });
  }

  findAllSimple(tipo?: string, busca?: string, responsavel_id?: string) {
    return this.prisma.beneficiarias.findMany({
      where: {
        deletado_em: null,
        ...(tipo ? { tipo } : {}),
        ...(busca ? { nome: { contains: busca, mode: 'insensitive' } } : {}),
        ...(responsavel_id ? { responsavel_id } : {}),
      },
      orderBy: { nome: 'asc' },
      select: { id: true, nome: true, cpf: true, tipo: true, status: true },
    });
  }

  buscar(busca: string | undefined, perfis: string[]) {
    const incluirCpf = perfis.some((perfil) =>
      PERFIS_COM_ACESSO_AO_CPF.has(perfil),
    );

    return this.prisma.beneficiarias.findMany({
      where: {
        deletado_em: null,
        ...(busca ? { nome: { contains: busca, mode: 'insensitive' } } : {}),
      },
      orderBy: { nome: 'asc' },
      select: { id: true, nome: true, cpf: incluirCpf },
    });
  }

  /**
   * `incluirArquivadas` é necessário para a tela de histórico: a beneficiária sai
   * da listagem ao ser arquivada, mas o histórico clínico dela é preservado e
   * precisa continuar consultável.
   */
  async findOne(id: string, incluirArquivadas = false) {
    const beneficiaria = await this.prisma.beneficiarias.findFirst({
      where: { id, ...(incluirArquivadas ? {} : { deletado_em: null }) },
    });
    if (!beneficiaria)
      throw new NotFoundException('Beneficiária não encontrada');
    return beneficiaria;
  }

  /** Id inexistente vira 404 pelo filtro global de erros do Prisma (P2025). */
  update(id: string, dto: UpdateBeneficiariaDto) {
    const { data_nascimento, responsavel_id, ...campos } = dto;
    const data: Prisma.beneficiariasUncheckedUpdateInput = { ...campos };
    if (responsavel_id !== undefined) data.responsavel_id = responsavel_id;
    if (data_nascimento) data.data_nascimento = new Date(data_nascimento);

    return this.prisma.beneficiarias.update({ where: { id }, data });
  }

  /**
   * Arquiva a beneficiária (soft delete). O histórico clínico — triagens,
   * queixas, encaminhamentos e prontuários — é preservado; as FKs no banco são
   * RESTRICT justamente para impedir que um delete físico o remova.
   */
  async remove(id: string) {
    const beneficiaria = await this.prisma.beneficiarias.findUnique({
      where: { id },
      select: { id: true, deletado_em: true },
    });
    if (!beneficiaria)
      throw new NotFoundException('Beneficiária não encontrada');
    if (beneficiaria.deletado_em) return beneficiaria;

    return this.prisma.beneficiarias.update({
      where: { id },
      data: { deletado_em: new Date() },
    });
  }
}
