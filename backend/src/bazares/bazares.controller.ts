import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtUser } from '../auth/jwt-user.interface';
import { RolesGuard } from '../auth/roles.guard';
import { UUID_PIPE } from '../common/pipes/uuid.pipe';
import { Roles } from '../auth/roles.decorator';
import { BazaresService } from './bazares.service';
import { CreateBazarDto } from './dto/create-bazar.dto';
import { UpdateBazarDto } from './dto/update-bazar.dto';
import { ListBazarQueryDto } from './dto/list-bazar-query.dto';

@ApiTags('bazares')
@ApiBearerAuth()
@Controller('bazares')
@UseGuards(RolesGuard)
export class BazaresController {
  constructor(private readonly bazaresService: BazaresService) {}

  @Get()
  @Roles('GESTORA', 'TRIADORA')
  findAll(@Query() query: ListBazarQueryDto) {
    return this.bazaresService.findAll(query);
  }

  @Get(':id')
  @Roles('GESTORA', 'TRIADORA')
  findOne(@Param('id', UUID_PIPE) id: string) {
    return this.bazaresService.findOne(id);
  }

  @Post()
  @Roles('GESTORA')
  create(@Body() dto: CreateBazarDto, @CurrentUser() usuario: JwtUser) {
    return this.bazaresService.create(dto, usuario.id);
  }

  @Patch(':id')
  @Roles('GESTORA')
  update(@Param('id', UUID_PIPE) id: string, @Body() dto: UpdateBazarDto) {
    return this.bazaresService.update(id, dto);
  }

  @Delete(':id')
  @Roles('GESTORA')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', UUID_PIPE) id: string): Promise<void> {
    await this.bazaresService.remove(id);
  }
}
