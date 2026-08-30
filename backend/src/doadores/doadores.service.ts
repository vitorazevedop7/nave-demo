// ── doadores.service.ts ───────────────────────────────────────
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDoadorDto } from './dto/create-doador.dto';
import { UpdateDoadorDto } from './dto/update-doador.dto';

@Injectable()
export class DoadoresService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.doadores.findMany({
      where: { deletado_em: null },
      include: { _count: { select: { doacoes: true } } },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string) {
    const d = await this.prisma.doadores.findFirst({ where: { id, deletado_em: null } });
    if (!d) throw new NotFoundException(`Doador ${id} não encontrado`);
    return d;
  }

  create(dto: CreateDoadorDto, registradoPorId: string) {
    return this.prisma.doadores.create({
      data: { nome: dto.nome, tipo: dto.tipo ?? null, telefone: dto.telefone ?? null, email: dto.email ?? null, registrado_por: registradoPorId },
    });
  }

  async update(id: string, dto: UpdateDoadorDto) {
    await this.findOne(id);
    return this.prisma.doadores.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.doadores.update({ where: { id }, data: { deletado_em: new Date() } });
  }
}