import {
  Body,
  Controller,
  Get,
  Param,
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
import { CreateTriagemDto } from './dto/create-triagem.dto';
import { TriagensService } from './triagens.service';

@ApiTags('triagens')
@ApiBearerAuth()
@Controller('triagens')
@UseGuards(RolesGuard)
@Roles('GESTORA', 'TRIADORA')
export class TriagensController {
  constructor(private readonly triagensService: TriagensService) {}

  @Get()
  findAll(
    @Query('beneficiaria_id', UUID_OPCIONAL_PIPE) beneficiariaId?: string,
  ) {
    return this.triagensService.findAll(beneficiariaId);
  }

  @Get(':id')
  findOne(@Param('id', UUID_PIPE) id: string) {
    return this.triagensService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTriagemDto, @CurrentUser() usuario: JwtUser) {
    return this.triagensService.create(dto, usuario.id);
  }
}
