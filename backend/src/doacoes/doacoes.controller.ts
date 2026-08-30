import { Controller, Get, Post, Patch, Delete, Param, Body, Request, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { DoacoesService } from './doacoes.service';
import { CreateDoacaoDto } from './dto/create-doacao.dto';
import { UpdateDoacaoDto } from './dto/update-doacao.dto';

@Controller('doacoes')
@UseGuards(RolesGuard)
export class DoacoesController {
  constructor(private readonly doacoesService: DoacoesService) {}

  @Get()
  @Roles('GESTORA', 'TRIADORA', 'PROFISSIONAL')
  findAll() { return this.doacoesService.findAll(); }

  @Get(':id')
  @Roles('GESTORA', 'TRIADORA', 'PROFISSIONAL')
  findOne(@Param('id') id: string) { return this.doacoesService.findOne(id); }

  @Post()
  @Roles('GESTORA', 'TRIADORA')
  create(@Body() dto: CreateDoacaoDto, @Request() req: any) {
    return this.doacoesService.create(dto, req.user.id);
  }

  @Patch(':id')
  @Roles('GESTORA', 'TRIADORA')
  update(@Param('id') id: string, @Body() dto: UpdateDoacaoDto) {
    return this.doacoesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('GESTORA')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) { return this.doacoesService.remove(id); }
}