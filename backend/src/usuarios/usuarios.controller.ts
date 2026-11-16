import {
  Body,
  Controller,
  Delete,
  Get,
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
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { UsuariosService } from './usuarios.service';

@ApiTags('usuarios')
@ApiBearerAuth()
@Controller('usuarios')
@UseGuards(RolesGuard)
@Roles('GESTORA')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  findAll() {
    return this.usuariosService.findAll();
  }

  @Get('profissionais')
  @Roles('GESTORA', 'TRIADORA')
  findProfissionais() {
    return this.usuariosService.findProfissionais();
  }

  // Antes de @Get(':id') — o Nest resolve na ordem de declaração e
  // 'compartilhaveis' cairia no parâmetro :id.
  @Get('compartilhaveis')
  @Roles('GESTORA', 'PROFISSIONAL')
  findCompartilhaveis() {
    return this.usuariosService.findCompartilhaveis();
  }

  @Get(':id')
  findOne(@Param('id', UUID_PIPE) id: string) {
    return this.usuariosService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateUsuarioDto) {
    return this.usuariosService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', UUID_PIPE) id: string,
    @Body() dto: UpdateUsuarioDto,
    @CurrentUser() usuario: JwtUser,
  ) {
    return this.usuariosService.update(id, dto, usuario.id);
  }

  @Delete(':id')
  remove(@Param('id', UUID_PIPE) id: string, @CurrentUser() usuario: JwtUser) {
    return this.usuariosService.remove(id, usuario.id);
  }
}
