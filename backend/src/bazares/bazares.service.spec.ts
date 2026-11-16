import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  criarPrismaMock,
  executarTransacoesNoMock,
  type PrismaMock,
} from '../test-utils/prisma-mock';
import { BazaresService } from './bazares.service';

const PROFISSIONAL_ID = '6f1b0f0e-2b8a-4c55-9d3f-7a2e9d1c4b10';

describe('BazaresService', () => {
  let service: BazaresService;
  let prisma: PrismaMock;

  beforeEach(() => {
    prisma = criarPrismaMock();
    executarTransacoesNoMock(prisma);
    service = new BazaresService(prisma);
  });

  describe('findAll', () => {
    it('retorna a lista de bazares', async () => {
      const bazares = [{ id: '1', nome: 'Bazar 1' }];
      prisma.bazares.findMany.mockResolvedValue(bazares as never);

      await expect(service.findAll({})).resolves.toEqual(bazares);
    });

    it('aplica filtros de período, local e nome', async () => {
      prisma.bazares.findMany.mockResolvedValue([]);

      await service.findAll({
        data_inicio: '2026-05-01',
        data_fim: '2026-05-31',
        local: 'centro',
        nome: 'inverno',
      });

      expect(prisma.bazares.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            data: {
              gte: new Date('2026-05-01'),
              lte: new Date('2026-05-31'),
            },
            local: { contains: 'centro', mode: 'insensitive' },
            nome: { contains: 'inverno', mode: 'insensitive' },
          },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('retorna um bazar por ID', async () => {
      const bazar = { id: '1', nome: 'Bazar 1' };
      prisma.bazares.findUnique.mockResolvedValue(bazar as never);

      await expect(service.findOne('1')).resolves.toEqual(bazar);
    });

    it('lança NotFoundException se o bazar não existe', async () => {
      prisma.bazares.findUnique.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const dto = {
      nome: 'Novo Bazar',
      data: '2026-05-15',
      horario_inicio: '10:00',
      profissional_ids: [PROFISSIONAL_ID],
    };

    it('cria o bazar e um compromisso na agenda de cada profissional', async () => {
      prisma.usuarios.findFirst.mockResolvedValue({
        id: PROFISSIONAL_ID,
      } as never);
      prisma.bazares.create.mockResolvedValue({
        id: 'bazar-1',
        nome: dto.nome,
        local: null,
      } as never);
      prisma.bazares.findUnique.mockResolvedValue({ id: 'bazar-1' } as never);

      await expect(service.create(dto, 'gestora-id')).resolves.toEqual({
        id: 'bazar-1',
      });

      expect(prisma.bazar_profissionais.createMany).toHaveBeenCalledWith({
        data: [{ bazar_id: 'bazar-1', profissional_id: PROFISSIONAL_ID }],
        skipDuplicates: true,
      });
      expect(prisma.agendamentos.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          profissional_id: PROFISSIONAL_ID,
          data_hora: new Date('2026-05-15T10:00'),
          status: 'AGENDADO',
        }) as unknown,
      });
    });

    it('exige ao menos um profissional', async () => {
      await expect(
        service.create({ ...dto, profissional_ids: [] }, 'gestora-id'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.bazares.create).not.toHaveBeenCalled();
    });

    it('rejeita profissional inexistente ou removido', async () => {
      prisma.usuarios.findFirst.mockResolvedValue(null);

      await expect(service.create(dto, 'gestora-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.bazares.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('atualiza os campos informados', async () => {
      prisma.bazares.findUnique.mockResolvedValue({ id: '1' } as never);
      prisma.bazares.update.mockResolvedValue({ id: '1' } as never);

      await service.update('1', { nome: 'Atualizado' });

      expect(prisma.bazares.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { nome: 'Atualizado' },
      });
    });

    it('aceita total arrecadado e o grava como número', async () => {
      prisma.bazares.findUnique.mockResolvedValue({ id: '1' } as never);
      prisma.bazares.update.mockResolvedValue({ id: '1' } as never);

      await service.update('1', { total_arrecadado: 915.5 });

      expect(prisma.bazares.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { total_arrecadado: 915.5 },
      });
    });
  });

  describe('remove', () => {
    it('exclui o bazar dentro de uma transação', async () => {
      prisma.bazares.findUnique.mockResolvedValue({
        id: '1',
        nome: 'Bazar',
        data: new Date('2026-05-15'),
      } as never);

      await service.remove('1');

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.bazares.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });
});
