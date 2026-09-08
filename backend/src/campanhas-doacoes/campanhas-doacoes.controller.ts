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
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UUID_PIPE } from '../common/pipes/uuid.pipe';
import { CampanhasDoacoesService } from './campanhas-doacoes.service';
import { CreateCampanhaDto } from './dto/create-campanha.dto';
import { UpdateCampanhaDto } from './dto/update-campanha.dto';

@ApiTags('campanhas-doacoes')
@ApiBearerAuth()
@Controller('campanhas-doacoes')
@UseGuards(RolesGuard)
@Roles('GESTORA')
export class CampanhasDoacoesController {
  constructor(private readonly service: CampanhasDoacoesService) {}

  // Campanhas não têm dado pessoal: a leitura fica aberta a toda a equipe.
  @Get()
  @Roles('GESTORA', 'TRIADORA')
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles('GESTORA', 'TRIADORA')
  findOne(@Param('id', UUID_PIPE) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCampanhaDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id', UUID_PIPE) id: string, @Body() dto: UpdateCampanhaDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', UUID_PIPE) id: string): Promise<void> {
    await this.service.remove(id);
  }
}
