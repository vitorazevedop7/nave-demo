import { NotFoundException } from '@nestjs/common';
import { criarPrismaMock, type PrismaMock } from '../test-utils/prisma-mock';
import { TriagensService } from './triagens.service';

describe('TriagensService', () => {
  let prisma: PrismaMock;
  let service: TriagensService;

  beforeEach(() => {
    prisma = criarPrismaMock();
    service = new TriagensService(prisma);
  });

  it('registra a triagem em nome do usuário autenticado', async () => {
    prisma.beneficiarias.findFirst.mockResolvedValue({ id: 'b-1' } as never);
    prisma.triagens.create.mockResolvedValue({ id: 't-1' } as never);

    await service.create({ beneficiaria_id: 'b-1' }, 'triadora-logada');

    expect(prisma.triagens.create).toHaveBeenCalledWith({
      data: {
        beneficiaria_id: 'b-1',
        triador_id: 'triadora-logada',
        data_triagem: expect.any(Date) as unknown,
      },
    });
  });

  it('não registra triagem de beneficiária arquivada', async () => {
    prisma.beneficiarias.findFirst.mockResolvedValue(null);

    await expect(
      service.create({ beneficiaria_id: 'b-1' }, 'triadora-logada'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.beneficiarias.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'b-1', deletado_em: null } }),
    );
    expect(prisma.triagens.create).not.toHaveBeenCalled();
  });

  it('nunca inclui a senha da triadora nas leituras', async () => {
    prisma.triagens.findMany.mockResolvedValue([]);

    await service.findAll();

    expect(prisma.triagens.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          usuarios: { select: { id: true, nome: true, email: true } },
        }) as unknown,
      }),
    );
  });
});
