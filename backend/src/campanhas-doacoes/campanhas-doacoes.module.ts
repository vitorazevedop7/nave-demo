import { Module } from '@nestjs/common';
import { CampanhasDoacoesService } from './campanhas-doacoes.service';
import { CampanhasDoacoesController } from './campanhas-doacoes.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CampanhasDoacoesController],
  providers: [CampanhasDoacoesService],
})
export class CampanhasDoacoesModule {}