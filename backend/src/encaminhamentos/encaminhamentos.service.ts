import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEncaminhamentoDto } from './dto/create-encaminhamento.dto';

@Injectable()
export class EncaminhamentosService {
  constructor(private readonly prisma: PrismaService) {}

  async findTriagensPendentes() {
    const triagens = await this.prisma.triagens.findMany({
      where: {
        encaminhamentos: { none: {} },
      },
      orderBy: { data_triagem: 'desc' },
      select: {
        id: true,
        data_triagem: true,
        queixas: {
          select: { queixa_principal: true },
          take: 1,
        },
        beneficiarias: {
          select: {
            id: true,
            nome: true,
            cpf: true,
            tipo: true,
          },
        },
        usuarios: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    return triagens.map((triagem) => ({
      id: triagem.id,
      dataTriagem: triagem.data_triagem,
      queixa: triagem.queixas[0]?.queixa_principal ?? null,
      triador: triagem.usuarios?.nome,
      beneficiario: {
        id: triagem.beneficiarias.id,
        nome: triagem.beneficiarias.nome,
        cpf: triagem.beneficiarias.cpf,
        categoria: triagem.beneficiarias.tipo,
      },
    }));
  }

  async findHistorico() {
    const historico = await this.prisma.encaminhamentos.findMany({
      orderBy: { criado_em: 'desc' },
      select: {
        id: true,
        especialidade: true,
        status: true,
        criado_em: true,
        triagem_id: true,
        triagens: {
          select: {
            queixas: {
              select: { queixa_principal: true },
              take: 1,
            },
            beneficiarias: {
              select: {
                id: true,
                nome: true,
                cpf: true,
                tipo: true,
              },
            },
          },
        },
      },
    });

    return historico.map((encaminhamento) => ({
      id: encaminhamento.id,
      triagemId: encaminhamento.triagem_id,
      especialidade: encaminhamento.especialidade,
      status: encaminhamento.status,
      criadoEm: encaminhamento.criado_em,
      beneficiario: {
        id: encaminhamento.triagens.beneficiarias.id,
        nome: encaminhamento.triagens.beneficiarias.nome,
        cpf: encaminhamento.triagens.beneficiarias.cpf,
        categoria: encaminhamento.triagens.beneficiarias.tipo,
      },
      queixa: encaminhamento.triagens.queixas[0]?.queixa_principal ?? null,
    }));
  }

  async create(dto: CreateEncaminhamentoDto) {
    const triagem = await this.prisma.triagens.findUnique({
      where: { id: dto.triagemId },
      select: {
        id: true,
        encaminhamentos: {
          select: { id: true, especialidade: true },
        },
      },
    });

    if (!triagem) {
      throw new NotFoundException(`Triagem ${dto.triagemId} não encontrada`);
    }

    const jaExiste = triagem.encaminhamentos.some(
      (e) => e.especialidade === dto.especialidade,
    );

    if (jaExiste) {
      throw new ConflictException(
        'Já existe encaminhamento para essa especialidade nessa triagem',
      );
    }

    return this.prisma.encaminhamentos.create({
      data: {
        triagem_id: dto.triagemId,
        especialidade: dto.especialidade,
        status: 'PENDENTE',
      },
      select: {
        id: true,
        triagem_id: true,
        especialidade: true,
        status: true,
        criado_em: true,
      },
    });
  }
}
