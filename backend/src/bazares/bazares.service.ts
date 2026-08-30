import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBazarDto } from './dto/create-bazar.dto';
import { UpdateBazarDto } from './dto/update-bazar.dto';
import { ListBazarQueryDto } from './dto/list-bazar-query.dto';

const BAZAR_INCLUDE = {
  usuarios: { select: { id: true, nome: true } },
  bazar_profissionais: {
    include: {
      usuarios: {
        select: {
          id: true,
          nome: true,
          especialidade: true,
          email: true,
        },
      },
    },
  },
} as const;

@Injectable()
export class BazaresService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(query: ListBazarQueryDto) {
    const where: Record<string, unknown> = {};

    if (query.data_inicio || query.data_fim) {
      where.data = {
        ...(query.data_inicio && { gte: new Date(query.data_inicio) }),
        ...(query.data_fim && { lte: new Date(query.data_fim) }),
      };
    }

    if (query.local) {
      where.local = { contains: query.local, mode: 'insensitive' };
    }

    if (query.nome) {
      where.nome = { contains: query.nome, mode: 'insensitive' };
    }

    return this.prisma.bazares.findMany({
      where,
      include: BAZAR_INCLUDE,
      orderBy: { data: 'desc' },
    });
  }

  async findOne(id: string) {
    const bazar = await this.prisma.bazares.findUnique({
      where: { id },
      include: BAZAR_INCLUDE,
    });

    if (!bazar) {
      throw new NotFoundException(`Bazar ${id} não encontrado`);
    }

    return bazar;
  }

  async create(dto: CreateBazarDto, registradoPorId: string) {
    // Validar profissionais
    await this.validarProfissionais(dto.profissional_ids);

    return this.prisma.$transaction(async (tx) => {
      // Criar bazar
      const bazar = await tx.bazares.create({
        data: {
          nome: dto.nome,
          data: new Date(dto.data),
          horario_inicio: dto.horario_inicio
            ? new Date(`1970-01-01T${dto.horario_inicio}`)
            : null,
          horario_fim: dto.horario_fim
            ? new Date(`1970-01-01T${dto.horario_fim}`)
            : null,
          local: dto.local ?? null,
          descricao: dto.descricao ?? null,
          observacoes: dto.observacoes ?? null,
          registrado_por: registradoPorId,
        },
      });

      // Associar profissionais
      if (dto.profissional_ids.length > 0) {
        await tx.bazar_profissionais.createMany({
          data: dto.profissional_ids.map((id) => ({
            bazar_id: bazar.id,
            profissional_id: id,
          })),
          skipDuplicates: true,
        });

        // Criar agendamentos para cada profissional
        const bazarDate = new Date(dto.data);
        const horaInicio = dto.horario_inicio
          ? new Date(`${dto.data}T${dto.horario_inicio}`)
          : new Date(bazarDate.setHours(9, 0, 0)); // Padrão 09:00

        for (const profissionalId of dto.profissional_ids) {
          await tx.agendamentos.create({
            data: {
              profissional_id: profissionalId,
              data_hora: horaInicio,
              status: 'AGENDADO',
              observacoes: `Bazar: ${bazar.nome} - ${bazar.local || 'Local a definir'}`,
            },
          });
        }
      }

      return tx.bazares.findUnique({
        where: { id: bazar.id },
        include: BAZAR_INCLUDE,
      });
    });
  }

  async update(id: string, dto: UpdateBazarDto) {
    const atual = await this.findOne(id);

    // Validar profissionais se houver
    if (dto.profissional_ids && dto.profissional_ids.length > 0) {
      await this.validarProfissionais(dto.profissional_ids);
    }

    return this.prisma.$transaction(async (tx) => {
      const data: Record<string, unknown> = {};

      if (dto.nome !== undefined) data.nome = dto.nome;
      if (dto.data !== undefined) data.data = new Date(dto.data);
      if (dto.horario_inicio !== undefined) {
        data.horario_inicio = dto.horario_inicio
          ? new Date(`1970-01-01T${dto.horario_inicio}`)
          : null;
      }
      if (dto.horario_fim !== undefined) {
        data.horario_fim = dto.horario_fim
          ? new Date(`1970-01-01T${dto.horario_fim}`)
          : null;
      }
      if (dto.local !== undefined) data.local = dto.local;
      if (dto.descricao !== undefined) data.descricao = dto.descricao;
      if (dto.total_arrecadado !== undefined && dto.total_arrecadado !== null) {
        // Convertemos para string primeiro para garantir que o .replace funcione
        const valorString = String(dto.total_arrecadado);
        data.total_arrecadado = parseFloat(valorString.replace(',', '.'));
      }
      if (dto.observacoes !== undefined) data.observacoes = dto.observacoes;

      const bazar = await tx.bazares.update({
        where: { id },
        data,
      });

      // Atualizar profissionais se fornecidos
      if (dto.profissional_ids) {
        // Remover profissionais atuais
        await tx.bazar_profissionais.deleteMany({
          where: { bazar_id: id },
        });

        // Remover agendamentos associados
        await tx.agendamentos.deleteMany({
          where: {
            data_hora: bazar.data,
            observacoes: {
              contains: bazar.nome,
            },
          },
        });

        // Adicionar novos profissionais
        if (dto.profissional_ids.length > 0) {
          await tx.bazar_profissionais.createMany({
            data: dto.profissional_ids.map((profId) => ({
              bazar_id: id,
              profissional_id: profId,
            })),
          });

          // Criar novos agendamentos
          const horaInicio = dto.horario_inicio
            ? new Date(`${dto.data || bazar.data}T${dto.horario_inicio}`)
            : new Date(bazar.data).setHours(9, 0, 0);

          for (const profissionalId of dto.profissional_ids) {
            await tx.agendamentos.create({
              data: {
                profissional_id: profissionalId,
                data_hora: new Date(horaInicio),
                status: 'AGENDADO',
                observacoes: `Bazar: ${bazar.nome} - ${bazar.local || 'Local a definir'}`,
              },
            });
          }
        }
      }

      return tx.bazares.findUnique({
        where: { id: bazar.id },
        include: BAZAR_INCLUDE,
      });
    });
  }

  async remove(id: string) {

    const bazar = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      // Remover agendamentos associados
      await tx.agendamentos.deleteMany({
        where: {
          data_hora: bazar.data,
          observacoes: {
            contains: bazar.nome,
          },
        },
      });

      await tx.bazar_profissionais.deleteMany({
        where: { bazar_id: id },
      });

      // Remover relações bazar_profissionais (cascata automática)
      return tx.bazares.delete({ where: { id } });
    });
  }

  private async validarProfissionais(profissional_ids: string[]) {
    if (!profissional_ids || profissional_ids.length === 0) {
      throw new BadRequestException('Pelo menos um profissional deve ser selecionado');
    }

    for (const id of profissional_ids) {
      const profissional = await this.prisma.usuarios.findFirst({
        where: { id, deletado_em: null },
      });

      if (!profissional) {
        throw new NotFoundException(`Profissional ${id} não encontrado`);
      }
    }
  }
}