import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { QueixasService } from './queixas.service';
import { CreateQueixaDto } from './dto/create-queixa.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('queixas')
@UseGuards(RolesGuard)
@Roles('GESTORA', 'TRIADORA')
export class QueixasController {
  constructor(private readonly queixasService: QueixasService) {}

  @Post()
  create(@Body() dto: CreateQueixaDto) {
    return this.queixasService.create(dto);
  }

  @Get()
  findAll() {
    return this.queixasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.queixasService.findOne(id);
  }

  @Get('triagem/:triagem_id')
  findByTriagem(@Param('triagem_id') triagem_id: string) {
    return this.queixasService.findByTriagem(triagem_id);
  }
}
