import { Module } from '@nestjs/common';
import { BazaresService } from './bazares.service';
import { BazaresController } from './bazares.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BazaresController],
  providers: [BazaresService],
})
export class BazaresModule {}