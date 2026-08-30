import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EncaminhamentosController } from './encaminhamentos.controller';
import { EncaminhamentosService } from './encaminhamentos.service';

@Module({
  imports: [PrismaModule],
  controllers: [EncaminhamentosController],
  providers: [EncaminhamentosService],
  exports: [EncaminhamentosService],
})
export class EncaminhamentosModule {}
