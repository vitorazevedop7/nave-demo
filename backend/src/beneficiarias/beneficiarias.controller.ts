import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BeneficiariasService } from './beneficiarias.service';
import { CreateBeneficiarioDto } from './dto/create-beneficiaria.dto';
import { UpdateBeneficiarioDto } from './dto/update-beneficiaria.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('beneficiarias')
@UseGuards(RolesGuard)
@Roles('GESTORA', 'TRIADORA')
export class BeneficiariasController {
  constructor(private readonly beneficiariasService: BeneficiariasService) {}

  @Post()
  create(@Body() createBeneficiarioDto: CreateBeneficiarioDto) {
    return this.beneficiariasService.create(createBeneficiarioDto);
  }

  @Get()
  findAll(
    @Query('tipo') tipo?: string,
    @Query('busca') busca?: string,
    @Query('responsavel_id') responsavel_id?: string,
  ) {
    if (tipo || busca || responsavel_id) {
      return this.beneficiariasService.findAllSimple(
        tipo,
        busca,
        responsavel_id,
      );
    }
    return this.beneficiariasService.findAll();
  }

  @Get('buscar')
  @Roles('GESTORA', 'TRIADORA', 'PROFISSIONAL')
  buscar(@Query('busca') busca?: string) {
    return this.beneficiariasService.buscar(busca);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('incluir_arquivadas') incluirArquivadas?: string,
  ) {
    return this.beneficiariasService.findOne(id, incluirArquivadas === 'true');
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateBeneficiarioDto: UpdateBeneficiarioDto,
  ) {
    return this.beneficiariasService.update(id, updateBeneficiarioDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.beneficiariasService.remove(id);
  }
}
