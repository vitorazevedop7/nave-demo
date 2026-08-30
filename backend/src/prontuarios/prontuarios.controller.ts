import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ProntuariosService } from './prontuarios.service';
import { CreateProntuarioDto } from './dto/create-prontuario.dto';
import { UpdateProntuarioDto } from './dto/update-prontuario.dto';

type AuthenticatedRequest = {
  user: { id: string };
};

// Prontuário é dado clínico. TRIADORA faz triagem e encaminhamento, mas não
// acessa prontuário — mesma regra que o ROUTE_PERFIS do frontend já aplicava
// na navegação. Sem isto, a restrição existia só no navegador.
@Controller('prontuarios')
@UseGuards(RolesGuard)
@Roles('GESTORA', 'PROFISSIONAL')
export class ProntuariosController {
  constructor(private readonly prontuariosService: ProntuariosService) {}

  @Post()
  create(
    @Body() createProntuarioDto: CreateProntuarioDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.prontuariosService.create(createProntuarioDto, req.user.id);
  }

  @Get()
  findAll(@Request() req: AuthenticatedRequest) {
    return this.prontuariosService.findAll(req.user.id);
  }

  @Get('meus')
  findMeus(@Request() req: AuthenticatedRequest) {
    const profissional_id = req.user.id;
    return this.prontuariosService.findByProfissional(
      profissional_id,
      req.user.id,
    );
  }

  @Get('compartilhados-comigo')
  findCompartilhadosComigo(@Request() req: AuthenticatedRequest) {
    return this.prontuariosService.findCompartilhadosComigo(req.user.id);
  }

  @Get('profissional/:profissional_id')
  findByProfissional(
    @Param('profissional_id') profissional_id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.prontuariosService.findByProfissional(
      profissional_id,
      req.user.id,
    );
  }

  @Get('beneficiaria/:beneficiaria_id')
  findByBeneficiaria(
    @Param('beneficiaria_id') beneficiaria_id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.prontuariosService.findByBeneficiaria(
      beneficiaria_id,
      req.user.id,
    );
  }

  @Get('agendamento/:agendamento_id')
  findByAgendamento(
    @Param('agendamento_id') agendamento_id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.prontuariosService.findByAgendamento(
      agendamento_id,
      req.user.id,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.prontuariosService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProntuarioDto: UpdateProntuarioDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.prontuariosService.update(id, updateProntuarioDto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.prontuariosService.remove(id, req.user.id);
  }
}
