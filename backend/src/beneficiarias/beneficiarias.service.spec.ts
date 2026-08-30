import { BeneficiariasService } from './beneficiarias.service';

describe('BeneficiariasService', () => {
  it('busca somente beneficiárias ativas e seleciona o payload mínimo', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const service = new BeneficiariasService({
      beneficiarias: { findMany },
    } as never);

    await service.buscar('Maria');

    expect(findMany).toHaveBeenCalledWith({
      where: {
        deletado_em: null,
        nome: { contains: 'Maria', mode: 'insensitive' },
      },
      orderBy: { nome: 'asc' },
      select: { id: true, nome: true, cpf: true },
    });
  });
});
