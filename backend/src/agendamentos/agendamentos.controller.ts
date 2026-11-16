import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtUser } from '../auth/jwt-user.interface';
import { RolesGuard } from '../auth/roles.guard';
import { UUID_PIPE } from '../common/pipes/uuid.pipe';
import { Roles } from '../auth/roles.decorator';
import { AgendamentosService } from './agendamentos.service';
import { CreateAgendamentoDto } from './dto/create-agendamento.dto';
import { UpdateAgendamentoDto } from './dto/update-agendamento.dto';
import { ListAgendamentoQueryDto } from './dto/list-agendamento-query.dto';

/** PROFISSIONAL sem perfil administrativo só agenda e edita a própria agenda. */
function ehProfissionalPuro(usuario: JwtUser): boolean {
  return (
    usuario.perfis.includes('PROFISSIONAL') &&
    !usuario.perfis.includes('GESTORA') &&
    !usuario.perfis.includes('TRIADORA')
  );
}

@ApiTags('agendamentos')
@ApiBearerAuth()
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
    @CurrentUser() usuario: JwtUser,
    @Query('apenas_com_beneficiaria') apenasComBeneficiaria?: string,
  ) {
    return this.agendamentosService.findByProfissional(
      usuario.id,
      apenasComBeneficiaria === 'true',
    );
  }

  @Get(':id')
  findOne(@Param('id', UUID_PIPE) id: string) {
    return this.agendamentosService.findOne(id);
  }

  @Post()
  @Roles('GESTORA', 'TRIADORA', 'PROFISSIONAL')
  create(@Body() dto: CreateAgendamentoDto, @CurrentUser() usuario: JwtUser) {
    const profissionalId = ehProfissionalPuro(usuario)
      ? usuario.id
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
    @Param('id', UUID_PIPE) id: string,
    @Body() dto: UpdateAgendamentoDto,
    @CurrentUser() usuario: JwtUser,
  ) {
    return this.agendamentosService.update(
      id,
      dto,
      ehProfissionalPuro(usuario) ? usuario.id : undefined,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', UUID_PIPE) id: string): Promise<void> {
    await this.agendamentosService.remove(id);
  }
}
