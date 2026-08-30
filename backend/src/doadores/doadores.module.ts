import { Module } from '@nestjs/common';
import { DoadoresService } from './doadores.service';
import { DoadoresController } from './doadores.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DoadoresController],
  providers: [DoadoresService],
})
export class DoadoresModule {}