import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UUID_PIPE } from '../common/pipes/uuid.pipe';
import { CreateQueixaDto } from './dto/create-queixa.dto';
import { QueixasService } from './queixas.service';

@ApiTags('queixas')
@ApiBearerAuth()
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

  @Get('triagem/:triagem_id')
  findByTriagem(@Param('triagem_id', UUID_PIPE) triagemId: string) {
    return this.queixasService.findByTriagem(triagemId);
  }

  @Get(':id')
  findOne(@Param('id', UUID_PIPE) id: string) {
    return this.queixasService.findOne(id);
  }
}
