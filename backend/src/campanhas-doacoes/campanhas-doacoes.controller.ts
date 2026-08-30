import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CampanhasDoacoesService } from './campanhas-doacoes.service';
import { CreateCampanhaDto } from './dto/create-campanha.dto';
import { UpdateCampanhaDto } from './dto/update-campanha.dto';

@Controller('campanhas-doacoes')
@UseGuards(RolesGuard)
export class CampanhasDoacoesController {
  constructor(private readonly service: CampanhasDoacoesService) {}

  @Get()
  @Roles('GESTORA', 'TRIADORA', 'PROFISSIONAL')
  findAll() { return this.service.findAll(); }

  @Get(':id')
  @Roles('GESTORA', 'TRIADORA', 'PROFISSIONAL')
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post()
  @Roles('GESTORA')
  create(@Body() dto: CreateCampanhaDto) { return this.service.create(dto); }

  @Patch(':id')
  @Roles('GESTORA')
  update(@Param('id') id: string, @Body() dto: UpdateCampanhaDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('GESTORA')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) { return this.service.remove(id); }
}