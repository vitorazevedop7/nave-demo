import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQueixaDto } from './dto/create-queixa.dto';

@Injectable()
export class QueixasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateQueixaDto) {
    const triagem = await this.prisma.triagens.findUnique({
      where: { id: dto.triagem_id },
    });
    if (!triagem) throw new NotFoundException('Triagem não encontrada');

    return this.prisma.queixas.create({ data: dto });
  }

  findAll() {
    return this.prisma.queixas.findMany({
      orderBy: { criado_em: 'desc' },
      include: { triagens: true },
    });
  }

  async findOne(id: string) {
    const queixa = await this.prisma.queixas.findUnique({
      where: { id },
      include: { triagens: true },
    });
    if (!queixa) throw new NotFoundException('Queixa não encontrada');
    return queixa;
  }

  findByTriagem(triagem_id: string) {
    return this.prisma.queixas.findMany({
      where: { triagem_id },
    });
  }
}
