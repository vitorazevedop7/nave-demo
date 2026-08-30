import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AgendamentosService } from './agendamentos.service';
import { CreateAgendamentoDto } from './dto/create-agendamento.dto';
import { UpdateAgendamentoDto } from './dto/update-agendamento.dto';
import { ListAgendamentoQueryDto } from './dto/list-agendamento-query.dto';

type AuthenticatedRequest = {
  user: { id: string; perfis?: string[] };
};

@Controller('agendamentos')
@UseGuards(RolesGuard)
@Roles('GESTORA', 'TRIADORA')
export class AgendamentosController {
  constructor(private readonly agendamentosService: AgendamentosService) {}

  @Get()
  findAll(@Query() query: ListAgendamentoQueryDto) {
    return this.agendamentosService.findAll(query);
  }

  @Get('meus')
  @Roles('PROFISSIONAL')
  findMeus(
    @Request() req: AuthenticatedRequest,
    @Query('apenas_com_beneficiaria') apenasComBeneficiaria?: string,
  ) {
    return this.agendamentosService.findByProfissional(
      req.user.id,
      apenasComBeneficiaria === 'true',
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.agendamentosService.findOne(id);
  }

  @Post()
  @Roles('GESTORA', 'TRIADORA', 'PROFISSIONAL')
  create(
    @Body() dto: CreateAgendamentoDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const isProfissionalPuro =
      req.user.perfis?.includes('PROFISSIONAL') &&
      !req.user.perfis?.includes('GESTORA') &&
      !req.user.perfis?.includes('TRIADORA');
    const profissionalId = isProfissionalPuro
      ? req.user.id
      : dto.profissional_id;

    if (!profissionalId) {
      throw new BadRequestException('profissional_id é obrigatório');
    }

    return this.agendamentosService.create({
      ...dto,
      profissional_id: profissionalId,
    });
  }

  @Patch(':id')
  @Roles('GESTORA', 'TRIADORA', 'PROFISSIONAL')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAgendamentoDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const isProfissional =
      req.user.perfis?.includes('PROFISSIONAL') &&
      !req.user.perfis?.includes('GESTORA') &&
      !req.user.perfis?.includes('TRIADORA');
    return this.agendamentosService.update(
      id,
      dto,
      isProfissional ? req.user.id : undefined,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.agendamentosService.remove(id);
  }
}
