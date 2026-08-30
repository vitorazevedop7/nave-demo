import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CreateEncaminhamentoDto } from './dto/create-encaminhamento.dto';
import { EncaminhamentosService } from './encaminhamentos.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('encaminhamentos')
@UseGuards(RolesGuard)
@Roles('GESTORA', 'TRIADORA')
export class EncaminhamentosController {
  constructor(private readonly encaminhamentosService: EncaminhamentosService) {}

  @Get('pendentes')
  findTriagensPendentes() {
    return this.encaminhamentosService.findTriagensPendentes();
  }

  @Get('historico')
  findHistorico() {
    return this.encaminhamentosService.findHistorico();
  }

  @Post()
  create(@Body() dto: CreateEncaminhamentoDto) {
    return this.encaminhamentosService.create(dto);
  }
}
