import { Module } from '@nestjs/common';
import { TriagensController } from './triagens.controller';
import { TriagensService } from './triagens.service';

@Module({
  controllers: [TriagensController],
  providers: [TriagensService],
  exports: [TriagensService],
})
export class TriagensModule {}