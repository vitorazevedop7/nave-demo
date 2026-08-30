import { Module } from '@nestjs/common';
import { ProntuariosService } from './prontuarios.service';
import { ProntuariosController } from './prontuarios.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProntuariosController],
  providers: [ProntuariosService],
})
export class ProntuariosModule {}
