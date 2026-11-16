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
import { DoadoresService } from './doadores.service';
import { CreateDoadorDto } from './dto/create-doador.dto';
import { UpdateDoadorDto } from './dto/update-doador.dto';

// Doadores têm dados de contato (telefone, e-mail): só a gestão acessa, a
// mesma restrição que o frontend aplica ao menu "Doações".
@ApiTags('doadores')
@ApiBearerAuth()
@Controller('doadores')
@UseGuards(RolesGuard)
@Roles('GESTORA')
export class DoadoresController {
  constructor(private readonly doadoresService: DoadoresService) {}

  @Get()
  findAll() {
    return this.doadoresService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', UUID_PIPE) id: string) {
    return this.doadoresService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateDoadorDto, @CurrentUser() usuario: JwtUser) {
    return this.doadoresService.create(dto, usuario.id);
  }

  @Patch(':id')
  update(@Param('id', UUID_PIPE) id: string, @Body() dto: UpdateDoadorDto) {
    return this.doadoresService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', UUID_PIPE) id: string): Promise<void> {
    await this.doadoresService.remove(id);
  }
}
