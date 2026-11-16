import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtUser } from '../auth/jwt-user.interface';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UUID_PIPE } from '../common/pipes/uuid.pipe';
import { CreateProntuarioDto } from './dto/create-prontuario.dto';
import { UpdateProntuarioDto } from './dto/update-prontuario.dto';
import { ProntuariosService } from './prontuarios.service';

// Prontuário é dado clínico. TRIADORA faz triagem e encaminhamento, mas não
// acessa prontuário — mesma regra que o ROUTE_PERFIS do frontend aplica na
// navegação. Sem isto, a restrição existiria só no navegador.
@ApiTags('prontuarios')
@ApiBearerAuth()
@Controller('prontuarios')
@UseGuards(RolesGuard)
@Roles('GESTORA', 'PROFISSIONAL')
export class ProntuariosController {
  constructor(private readonly prontuariosService: ProntuariosService) {}

  @Post()
  create(@Body() dto: CreateProntuarioDto, @CurrentUser() usuario: JwtUser) {
    return this.prontuariosService.create(dto, usuario.id);
  }

  @Get()
  findAll(@CurrentUser() usuario: JwtUser) {
    return this.prontuariosService.findAll(usuario.id);
  }

  @Get('meus')
  findMeus(@CurrentUser() usuario: JwtUser) {
    return this.prontuariosService.findByProfissional(usuario.id, usuario.id);
  }

  @Get('compartilhados-comigo')
  findCompartilhadosComigo(@CurrentUser() usuario: JwtUser) {
    return this.prontuariosService.findCompartilhadosComigo(usuario.id);
  }

  @Get('profissional/:profissional_id')
  findByProfissional(
    @Param('profissional_id', UUID_PIPE) profissionalId: string,
    @CurrentUser() usuario: JwtUser,
  ) {
    return this.prontuariosService.findByProfissional(
      profissionalId,
      usuario.id,
    );
  }

  @Get('beneficiaria/:beneficiaria_id')
  findByBeneficiaria(
    @Param('beneficiaria_id', UUID_PIPE) beneficiariaId: string,
    @CurrentUser() usuario: JwtUser,
  ) {
    return this.prontuariosService.findByBeneficiaria(
      beneficiariaId,
      usuario.id,
    );
  }

  @Get('agendamento/:agendamento_id')
  findByAgendamento(
    @Param('agendamento_id', UUID_PIPE) agendamentoId: string,
    @CurrentUser() usuario: JwtUser,
  ) {
    return this.prontuariosService.findByAgendamento(agendamentoId, usuario.id);
  }

  @Get(':id')
  findOne(@Param('id', UUID_PIPE) id: string, @CurrentUser() usuario: JwtUser) {
    return this.prontuariosService.findOne(id, usuario.id);
  }

  @Patch(':id')
  update(
    @Param('id', UUID_PIPE) id: string,
    @Body() dto: UpdateProntuarioDto,
    @CurrentUser() usuario: JwtUser,
  ) {
    return this.prontuariosService.update(id, dto, usuario.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', UUID_PIPE) id: string, @CurrentUser() usuario: JwtUser) {
    return this.prontuariosService.remove(id, usuario.id);
  }
}
