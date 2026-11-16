import { NotFoundException } from '@nestjs/common';
import { criarPrismaMock, type PrismaMock } from '../test-utils/prisma-mock';
import { BeneficiariasService } from './beneficiarias.service';

describe('BeneficiariasService', () => {
  let prisma: PrismaMock;
  let service: BeneficiariasService;

  beforeEach(() => {
    prisma = criarPrismaMock();
    prisma.beneficiarias.findMany.mockResolvedValue([]);
    service = new BeneficiariasService(prisma);
  });

  describe('buscar', () => {
    it('busca somente beneficiárias ativas e inclui CPF para TRIADORA', async () => {
      await service.buscar('Maria', ['TRIADORA']);

      expect(prisma.beneficiarias.findMany).toHaveBeenCalledWith({
        where: {
          deletado_em: null,
          nome: { contains: 'Maria', mode: 'insensitive' },
        },
        orderBy: { nome: 'asc' },
        select: { id: true, nome: true, cpf: true },
      });
    });

    it('omite o CPF para PROFISSIONAL (minimização de dados)', async () => {
      await service.buscar('Maria', ['PROFISSIONAL']);

      expect(prisma.beneficiarias.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: { id: true, nome: true, cpf: false },
        }),
      );
    });

    it('inclui o CPF quando um dos perfis é administrativo', async () => {
      await service.buscar(undefined, ['PROFISSIONAL', 'GESTORA']);

      expect(prisma.beneficiarias.findMany).toHaveBeenCalledWith({
        where: { deletado_em: null },
        orderBy: { nome: 'asc' },
        select: { id: true, nome: true, cpf: true },
      });
    });
  });

  describe('findOne', () => {
    it('oculta beneficiária arquivada por padrão', async () => {
      prisma.beneficiarias.findFirst.mockResolvedValue(null);

      await expect(service.findOne('b-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.beneficiarias.findFirst).toHaveBeenCalledWith({
        where: { id: 'b-1', deletado_em: null },
      });
    });

    it('encontra arquivada quando o histórico pede incluir_arquivadas', async () => {
      prisma.beneficiarias.findFirst.mockResolvedValue({ id: 'b-1' } as never);

      await service.findOne('b-1', true);

      expect(prisma.beneficiarias.findFirst).toHaveBeenCalledWith({
        where: { id: 'b-1' },
      });
    });
  });

  describe('update', () => {
    it('envia ao Prisma apenas os campos informados', async () => {
      prisma.beneficiarias.update.mockResolvedValue({ id: 'b-1' } as never);

      await service.update('b-1', {
        nome: 'Nova',
        responsavel_id: undefined,
        data_nascimento: '1990-05-10',
      });

      expect(prisma.beneficiarias.update).toHaveBeenCalledWith({
        where: { id: 'b-1' },
        data: { nome: 'Nova', data_nascimento: new Date('1990-05-10') },
      });
    });
  });

  describe('remove', () => {
    it('arquiva (soft delete) em vez de apagar', async () => {
      prisma.beneficiarias.findUnique.mockResolvedValue({
        id: 'b-1',
        deletado_em: null,
      } as never);

      await service.remove('b-1');

      expect(prisma.beneficiarias.update).toHaveBeenCalledWith({
        where: { id: 'b-1' },
        data: { deletado_em: expect.any(Date) as unknown },
      });
      expect(prisma.beneficiarias.delete).not.toHaveBeenCalled();
    });

    it('é idempotente para beneficiária já arquivada', async () => {
      const arquivada = { id: 'b-1', deletado_em: new Date() };
      prisma.beneficiarias.findUnique.mockResolvedValue(arquivada as never);

      await expect(service.remove('b-1')).resolves.toBe(arquivada);
      expect(prisma.beneficiarias.update).not.toHaveBeenCalled();
    });

    it('retorna 404 para id inexistente', async () => {
      prisma.beneficiarias.findUnique.mockResolvedValue(null);

      await expect(service.remove('b-x')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
