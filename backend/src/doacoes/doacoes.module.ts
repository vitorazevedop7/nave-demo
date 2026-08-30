import { Module } from '@nestjs/common';
import { DoacoesService } from './doacoes.service';
import { DoacoesController } from './doacoes.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DoacoesController],
  providers: [DoacoesService],
})
export class DoacoesModule {}