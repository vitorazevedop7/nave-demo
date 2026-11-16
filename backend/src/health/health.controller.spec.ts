import { ServiceUnavailableException } from '@nestjs/common';
import { criarPrismaMock, type PrismaMock } from '../test-utils/prisma-mock';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let prisma: PrismaMock;
  let controller: HealthController;

  beforeEach(() => {
    prisma = criarPrismaMock();
    controller = new HealthController(prisma);
  });

  it('responde ok quando o banco responde ao ping', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    await expect(controller.check()).resolves.toEqual({
      status: 'ok',
      database: 'ok',
    });
  });

  it('responde 503 quando o banco está fora do ar', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(controller.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
