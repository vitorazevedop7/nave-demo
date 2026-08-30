import { Controller, Get, Post, Patch, Delete, Param, Body, Request, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { DoadoresService } from './doadores.service';
import { CreateDoadorDto } from './dto/create-doador.dto';
import { UpdateDoadorDto } from './dto/update-doador.dto';

@Controller('doadores')
@UseGuards(RolesGuard)
export class DoadoresController {
  constructor(private readonly doadoresService: DoadoresService) {}

  @Get()
  @Roles('GESTORA', 'TRIADORA', 'PROFISSIONAL')
  findAll() { return this.doadoresService.findAll(); }

  @Get(':id')
  @Roles('GESTORA', 'TRIADORA', 'PROFISSIONAL')
  findOne(@Param('id') id: string) { return this.doadoresService.findOne(id); }

  @Post()
  @Roles('GESTORA', 'TRIADORA')
  create(@Body() dto: CreateDoadorDto, @Request() req: any) {
    return this.doadoresService.create(dto, req.user.id);
  }

  @Patch(':id')
  @Roles('GESTORA', 'TRIADORA')
  update(@Param('id') id: string, @Body() dto: UpdateDoadorDto) {
    return this.doadoresService.update(id, dto);
  }

  @Delete(':id')
  @Roles('GESTORA')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) { return this.doadoresService.remove(id); }
}