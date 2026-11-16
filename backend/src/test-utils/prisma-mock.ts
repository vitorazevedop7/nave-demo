import { mockDeep, type DeepMockProxy } from 'jest-mock-extended';
import { PrismaService } from '../prisma/prisma.service';

export type PrismaMock = DeepMockProxy<PrismaService>;

/**
 * Mock tipado do `PrismaService`: cada delegate (`usuarios.findFirst`, ...) é
 * um `jest.fn` com a assinatura real, então uma mudança de schema que quebre a
 * chamada também quebra o teste em tempo de compilação.
 */
export function criarPrismaMock(): PrismaMock {
  return mockDeep<PrismaService>();
}

/**
 * Faz `$transaction(callback)` executar o callback com o próprio mock como
 * cliente transacional — o suficiente para testar a lógica dentro da
 * transação sem um banco.
 */
export function executarTransacoesNoMock(
  prisma: PrismaMock,
  cliente: unknown = prisma,
): void {
  prisma.$transaction.mockImplementation((operacao: (tx: unknown) => unknown) =>
    Promise.resolve(operacao(cliente)),
  );
}
