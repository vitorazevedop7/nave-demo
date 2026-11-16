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
import { DoacoesService } from './doacoes.service';
import { CreateDoacaoDto } from './dto/create-doacao.dto';
import { UpdateDoacaoDto } from './dto/update-doacao.dto';

// Doações carregam contato de doadores (telefone, e-mail): só a gestão acessa,
// a mesma restrição que o frontend aplica ao menu "Doações".
@ApiTags('doacoes')
@ApiBearerAuth()
@Controller('doacoes')
@UseGuards(RolesGuard)
@Roles('GESTORA')
export class DoacoesController {
  constructor(private readonly doacoesService: DoacoesService) {}

  @Get()
  findAll() {
    return this.doacoesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', UUID_PIPE) id: string) {
    return this.doacoesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateDoacaoDto, @CurrentUser() usuario: JwtUser) {
    return this.doacoesService.create(dto, usuario.id);
  }

  @Patch(':id')
  update(@Param('id', UUID_PIPE) id: string, @Body() dto: UpdateDoacaoDto) {
    return this.doacoesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', UUID_PIPE) id: string): Promise<void> {
    await this.doacoesService.remove(id);
  }
}
