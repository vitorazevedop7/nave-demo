import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTriagemDto } from './dto/create-triagem.dto';

// A relação `usuarios` aqui é a triadora. Nunca inclua o registro inteiro:
// `usuarios` carrega `senha_hash`, que vazaria na resposta da API.
const TRIADOR_SELECT = {
  select: { id: true, nome: true, email: true },
} as const;

@Injectable()
export class TriagensService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(beneficiaria_id?: string) {
    return this.prisma.triagens.findMany({
      where: { ...(beneficiaria_id ? { beneficiaria_id } : {}) },
      orderBy: { data_triagem: 'desc' },
      include: {
        beneficiarias: true,
        queixas: true,
        usuarios: TRIADOR_SELECT,
        encaminhamentos: true,
      },
    });
  }

  async findOne(id: string) {
    const triagem = await this.prisma.triagens.findUnique({
      where: { id },
      include: {
        beneficiarias: true,
        queixas: true,
        encaminhamentos: true,
        usuarios: TRIADOR_SELECT,
      },
    });
    if (!triagem) throw new NotFoundException(`Triagem ${id} não encontrada`);
    return triagem;
  }

  async create(dto: CreateTriagemDto, triadorId: string) {
    const beneficiaria = await this.prisma.beneficiarias.findFirst({
      where: { id: dto.beneficiaria_id, deletado_em: null },
      select: { id: true },
    });
    if (!beneficiaria)
      throw new NotFoundException('Beneficiária não encontrada');

    return this.prisma.triagens.create({
      data: {
        beneficiaria_id: dto.beneficiaria_id,
        triador_id: triadorId,
        data_triagem: dto.data_triagem
          ? new Date(dto.data_triagem)
          : new Date(),
      },
    });
  }
}
