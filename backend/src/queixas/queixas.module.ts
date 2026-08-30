import { Module } from '@nestjs/common';
import { QueixasService } from './queixas.service';
import { QueixasController } from './queixas.controller';

@Module({
  controllers: [QueixasController],
  providers: [QueixasService],
})
export class QueixasModule {}
