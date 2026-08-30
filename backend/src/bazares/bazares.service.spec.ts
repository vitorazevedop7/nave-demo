import { Test, TestingModule } from '@nestjs/testing';
import { BazaresService } from './bazares.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BazaresService', () => {
  let service: BazaresService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      bazares: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      bazar_profissionais: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      agendamentos: {
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
      usuarios: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn((fn: any) => fn(mockPrisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BazaresService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<BazaresService>(BazaresService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('deve retornar lista de bazares', async () => {
      const mockData = [{ id: '1', nome: 'Bazar 1' }];
      mockPrisma.bazares.findMany.mockResolvedValue(mockData);

      const result = await service.findAll({});

      expect(result).toEqual(mockData);
    });
  });

  describe('findOne', () => {
    it('deve retornar um bazar por ID', async () => {
      const mockData = { id: '1', nome: 'Bazar 1' };
      mockPrisma.bazares.findUnique.mockResolvedValue(mockData);

      const result = await service.findOne('1');

      expect(result).toEqual(mockData);
    });

    it('deve lançar erro se bazar não encontrado', async () => {
      mockPrisma.bazares.findUnique.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('deve criar novo bazar', async () => {
      const dto = {
        nome: 'Novo Bazar',
        data: '2024-05-15',
        profissional_ids: ['prof1'],
      };
      const mockData = { id: '1', ...dto };

      mockPrisma.usuarios.findFirst.mockResolvedValue({ id: 'prof1' });
      mockPrisma.bazares.create.mockResolvedValue(mockData);
      mockPrisma.bazares.findUnique.mockResolvedValue(mockData);

      const result = await service.create(dto as any, 'gestora-id');

      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    it('deve atualizar bazar', async () => {
      const mockData = { id: '1', nome: 'Atualizado' };

      mockPrisma.bazares.findUnique.mockResolvedValue(mockData);
      mockPrisma.bazares.update.mockResolvedValue(mockData);

      await service.update('1', { nome: 'Atualizado' });

      expect(mockPrisma.bazares.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deve deletar bazar', async () => {
      const mockData = { id: '1' };

      mockPrisma.bazares.findUnique.mockResolvedValue(mockData);
      mockPrisma.bazares.delete.mockResolvedValue(mockData);

      await service.remove('1');

      expect(mockPrisma.bazares.delete).toHaveBeenCalled();
    });
  });
});