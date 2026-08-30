// ── campanhas.service.ts ───────────────────────────────────────
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampanhaDto } from './dto/create-campanha.dto';
import { UpdateCampanhaDto } from './dto/update-campanha.dto';

@Injectable()
export class CampanhasDoacoesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.campanhas_doacoes.findMany({
      include: { _count: { select: { doacoes: true } } },
      orderBy: { criado_em: 'desc' },
    });
  }

  async findOne(id: string) {
    const c = await this.prisma.campanhas_doacoes.findUnique({ where: { id } });
    if (!c) throw new NotFoundException(`Campanha ${id} não encontrada`);
    return c;
  }

  create(dto: CreateCampanhaDto) {
    return this.prisma.campanhas_doacoes.create({
      data: { nome: dto.nome, descricao: dto.descricao ?? null, meta_valor: dto.meta_valor ?? null },
    });
  }

  async update(id: string, dto: UpdateCampanhaDto) {
    await this.findOne(id);
    return this.prisma.campanhas_doacoes.update({
      where: { id },
      data: {
        ...(dto.nome && { nome: dto.nome }),
        ...(dto.descricao !== undefined && { descricao: dto.descricao }),
        ...(dto.meta_valor !== undefined && { meta_valor: dto.meta_valor }),
        ...(dto.encerrada_em && { encerrada_em: new Date(dto.encerrada_em) }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.campanhas_doacoes.delete({ where: { id } });
  }
}