import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtUser } from '../auth/jwt-user.interface';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UUID_OPCIONAL_PIPE, UUID_PIPE } from '../common/pipes/uuid.pipe';
import { BeneficiariasService } from './beneficiarias.service';
import { CreateBeneficiariaDto } from './dto/create-beneficiaria.dto';
import { UpdateBeneficiariaDto } from './dto/update-beneficiaria.dto';

@ApiTags('beneficiarias')
@ApiBearerAuth()
@Controller('beneficiarias')
@UseGuards(RolesGuard)
@Roles('GESTORA', 'TRIADORA')
export class BeneficiariasController {
  constructor(private readonly beneficiariasService: BeneficiariasService) {}

  @Post()
  create(@Body() dto: CreateBeneficiariaDto) {
    return this.beneficiariasService.create(dto);
  }

  @Get()
  findAll(
    @Query('tipo') tipo?: string,
    @Query('busca') busca?: string,
    @Query('responsavel_id', UUID_OPCIONAL_PIPE) responsavelId?: string,
  ) {
    if (tipo || busca || responsavelId) {
      return this.beneficiariasService.findAllSimple(
        tipo,
        busca,
        responsavelId,
      );
    }
    return this.beneficiariasService.findAll();
  }

  /**
   * Busca mínima para seletores (ex.: agendar atendimento). PROFISSIONAL
   * recebe só id e nome; o CPF fica restrito a quem já administra cadastros.
   */
  @Get('buscar')
  @Roles('GESTORA', 'TRIADORA', 'PROFISSIONAL')
  buscar(@CurrentUser() usuario: JwtUser, @Query('busca') busca?: string) {
    return this.beneficiariasService.buscar(busca, usuario.perfis);
  }

  @Get(':id')
  findOne(
    @Param('id', UUID_PIPE) id: string,
    @Query('incluir_arquivadas') incluirArquivadas?: string,
  ) {
    return this.beneficiariasService.findOne(id, incluirArquivadas === 'true');
  }

  @Patch(':id')
  update(
    @Param('id', UUID_PIPE) id: string,
    @Body() dto: UpdateBeneficiariaDto,
  ) {
    return this.beneficiariasService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', UUID_PIPE) id: string) {
    return this.beneficiariasService.remove(id);
  }
}
