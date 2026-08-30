import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDoacaoDto } from './dto/create-doacao.dto';
import { UpdateDoacaoDto } from './dto/update-doacao.dto';

const DOACAO_INCLUDE = {
  doadores: { select: { id: true, nome: true, tipo: true, telefone: true, email: true } },
  campanhas_doacoes: { select: { id: true, nome: true } },
  usuarios: { select: { id: true, nome: true } },
} as const;

@Injectable()
export class DoacoesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.doacoes.findMany({
      include: DOACAO_INCLUDE,
      orderBy: { data: 'desc' },
    });
  }

  async findOne(id: string) {
    const doacao = await this.prisma.doacoes.findUnique({ where: { id }, include: DOACAO_INCLUDE });
    if (!doacao) throw new NotFoundException(`Doação ${id} não encontrada`);
    return doacao;
  }

  create(dto: CreateDoacaoDto, registradoPorId: string) {
    return this.prisma.doacoes.create({
      data: {
        tipo: dto.tipo,
        valor: dto.valor ?? null,
        quantidade: dto.quantidade ?? null,
        data: new Date(dto.data),
        observacao: dto.observacao ?? null,
        doador_id: dto.doador_id ?? null,
        campanha_id: dto.campanha_id ?? null,
        registrado_por: registradoPorId,
      },
      include: DOACAO_INCLUDE,
    });
  }

  async update(id: string, dto: UpdateDoacaoDto) {
    await this.findOne(id);
    return this.prisma.doacoes.update({
      where: { id },
      data: {
        ...(dto.tipo && { tipo: dto.tipo }),
        ...(dto.valor !== undefined && { valor: dto.valor }),
        ...(dto.quantidade !== undefined && { quantidade: dto.quantidade }),
        ...(dto.data && { data: new Date(dto.data) }),
        ...(dto.observacao !== undefined && { observacao: dto.observacao }),
        ...(dto.doador_id !== undefined && { doador_id: dto.doador_id }),
        ...(dto.campanha_id !== undefined && { campanha_id: dto.campanha_id }),
      },
      include: DOACAO_INCLUDE,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.doacoes.delete({ where: { id } });
  }
}