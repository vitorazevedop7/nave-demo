import { Module } from '@nestjs/common';
import { BeneficiariasService } from './beneficiarias.service';
import { BeneficiariasController } from './beneficiarias.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BeneficiariasController],
  providers: [BeneficiariasService],
})
export class BeneficiariasModule {}