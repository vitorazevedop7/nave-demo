import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgendamentoDto } from './dto/create-agendamento.dto';
import { UpdateAgendamentoDto } from './dto/update-agendamento.dto';
import { ListAgendamentoQueryDto } from './dto/list-agendamento-query.dto';
const AGENDAMENTO_INCLUDE = {
  beneficiarias: {
    select: {
      id: true,
      nome: true,
      cpf: true,
      telefone: true,
      data_nascimento: true,
      endereco: true,
      estado_civil: true,
      escolaridade: true,
      ocupacao: true,
      empregada: true,
    },
  },
  usuarios: { select: { id: true, nome: true, especialidade: true } },
  encaminhamentos: { select: { id: true, especialidade: true, status: true } },
} as const;

const CONFLITO_JANELA_MS = 30 * 60 * 1000;
const AVISO_ESPECIALIDADE_DIVERGENTE =
  'A especialidade do profissional diverge da especialidade do encaminhamento';

@Injectable()
export class AgendamentosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListAgendamentoQueryDto) {
    const where: Record<string, unknown> = {};

    if (query.data_inicio || query.data_fim) {
      where.data_hora = {
        ...(query.data_inicio && { gte: new Date(query.data_inicio) }),
        ...(query.data_fim && { lte: new Date(query.data_fim) }),
      };
    }

    if (query.profissional_id) where.profissional_id = query.profissional_id;
    if (query.beneficiaria_id) where.beneficiaria_id = query.beneficiaria_id;
    if (query.status) where.status = query.status;

    return this.prisma.agendamentos.findMany({
      where,
      include: AGENDAMENTO_INCLUDE,
      orderBy: { data_hora: 'asc' },
    });
  }

  async findByProfissional(
    profissional_id: string,
    apenasComBeneficiaria = false,
  ) {
    return this.prisma.agendamentos.findMany({
      where: {
        profissional_id,
        ...(apenasComBeneficiaria && { beneficiaria_id: { not: null } }),
      },
      include: AGENDAMENTO_INCLUDE,
      orderBy: { data_hora: 'asc' },
    });
  }

  async findOne(id: string) {
    const ag = await this.prisma.agendamentos.findUnique({
      where: { id },
      include: AGENDAMENTO_INCLUDE,
    });
    if (!ag) throw new NotFoundException(`Agendamento ${id} não encontrado`);
    return ag;
  }

  async create(dto: CreateAgendamentoDto & { profissional_id: string }) {
    const avisos = await this.validarFKs(
      dto.beneficiaria_id,
      dto.profissional_id,
      dto.encaminhamento_id,
    );
    await this.checarConflito(dto.profissional_id, dto.data_hora);

    const agendamento = await this.prisma.$transaction(async (tx) => {
      const agendamento = await tx.agendamentos.create({
        data: {
          beneficiaria_id: dto.beneficiaria_id,
          profissional_id: dto.profissional_id,
          encaminhamento_id: dto.encaminhamento_id ?? null,
          data_hora: new Date(dto.data_hora),
          status: dto.status ?? 'AGENDADO',
          observacoes: dto.observacoes ?? null,
        },
        include: AGENDAMENTO_INCLUDE,
      });

      if (dto.encaminhamento_id) {
        await tx.encaminhamentos.update({
          where: { id: dto.encaminhamento_id },
          data: { status: 'AGENDADO' },
        });
      }

      return agendamento;
    });

    return { ...agendamento, avisos };
  }

  async update(id: string, dto: UpdateAgendamentoDto, solicitanteId?: string) {
    const atual = await this.findOne(id);

    if (solicitanteId && atual.profissional_id !== solicitanteId) {
      throw new ForbiddenException(
        'Você só pode editar seus próprios agendamentos',
      );
    }

    let avisos: string[] = [];
    if (
      dto.beneficiaria_id !== undefined ||
      dto.profissional_id !== undefined ||
      dto.encaminhamento_id !== undefined
    ) {
      avisos = await this.validarFKs(
        dto.beneficiaria_id ?? atual.beneficiaria_id,
        dto.profissional_id ?? atual.profissional_id,
        dto.encaminhamento_id ?? atual.encaminhamento_id ?? undefined,
      );
    }

    if (dto.data_hora || dto.profissional_id) {
      await this.checarConflito(
        dto.profissional_id ?? atual.profissional_id,
        dto.data_hora ?? atual.data_hora.toISOString(),
        id,
      );
    }

    const data: Record<string, unknown> = {};
    if (dto.beneficiaria_id !== undefined)
      data.beneficiaria_id = dto.beneficiaria_id;
    if (dto.profissional_id !== undefined)
      data.profissional_id = dto.profissional_id;
    if (dto.encaminhamento_id !== undefined)
      data.encaminhamento_id = dto.encaminhamento_id;
    if (dto.data_hora !== undefined) data.data_hora = new Date(dto.data_hora);
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.observacoes !== undefined) data.observacoes = dto.observacoes;

    const agendamento = await this.prisma.agendamentos.update({
      where: { id },
      data,
      include: AGENDAMENTO_INCLUDE,
    });

    return { ...agendamento, avisos };
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.agendamentos.delete({ where: { id } });
  }

  private async validarFKs(
    beneficiaria_id: string | null | undefined,
    profissional_id: string,
    encaminhamento_id?: string,
  ): Promise<string[]> {
    if (beneficiaria_id) {
      const beneficiaria = await this.prisma.beneficiarias.findFirst({
        where: { id: beneficiaria_id, deletado_em: null },
      });
      if (!beneficiaria)
        throw new NotFoundException('Beneficiária não encontrada');
    }

    const profissional = await this.prisma.usuarios.findFirst({
      where: { id: profissional_id, deletado_em: null },
      select: { especialidade: true },
    });
    if (!profissional)
      throw new NotFoundException('Profissional não encontrado');

    if (encaminhamento_id) {
      const enc = await this.prisma.encaminhamentos.findFirst({
        where: { id: encaminhamento_id },
        select: {
          especialidade: true,
          triagens: { select: { beneficiaria_id: true } },
        },
      });
      if (!enc) throw new NotFoundException('Encaminhamento não encontrado');

      if (enc.triagens.beneficiaria_id !== beneficiaria_id) {
        throw new ConflictException(
          'Encaminhamento não pertence à beneficiária do agendamento',
        );
      }

      const especialidadeProfissional = profissional.especialidade
        ?.trim()
        .toUpperCase();
      const especialidadeEncaminhamento = enc.especialidade
        .trim()
        .toUpperCase();

      if (especialidadeProfissional !== especialidadeEncaminhamento) {
        return [AVISO_ESPECIALIDADE_DIVERGENTE];
      }
    }

    return [];
  }

  private async checarConflito(
    profissional_id: string,
    data_hora: string,
    excluirId?: string,
  ) {
    const data = new Date(data_hora);
    const inicio = new Date(data.getTime() - CONFLITO_JANELA_MS);
    const fim = new Date(data.getTime() + CONFLITO_JANELA_MS);

    const conflito = await this.prisma.agendamentos.findFirst({
      where: {
        profissional_id,
        data_hora: { gte: inicio, lte: fim },
        status: { not: 'CANCELADO' },
        ...(excluirId && { id: { not: excluirId } }),
      },
    });

    if (conflito) {
      throw new ConflictException(
        'Profissional já possui agendamento dentro de ±30 minutos desse horário',
      );
    }
  }
}
