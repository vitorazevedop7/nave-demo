import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { BazaresService } from './bazares.service';
import { CreateBazarDto } from './dto/create-bazar.dto';
import { UpdateBazarDto } from './dto/update-bazar.dto';
import { ListBazarQueryDto } from './dto/list-bazar-query.dto';

@Controller('bazares')
@UseGuards(RolesGuard)
export class BazaresController {
  constructor(private readonly bazaresService: BazaresService) {}

  @Get()
  @Roles('GESTORA', 'TRIADORA', 'PROFISSIONAL')
  findAll(@Query() query: ListBazarQueryDto) {
    return this.bazaresService.findAll(query);
  }

  @Get(':id')
  @Roles('GESTORA', 'TRIADORA', 'PROFISSIONAL')
  findOne(@Param('id') id: string) {
    return this.bazaresService.findOne(id);
  }

  @Post()
  @Roles('GESTORA')
  create(@Body() dto: CreateBazarDto, @Request() req: any) {
    return this.bazaresService.create(dto, req.user.id);
  }

  @Patch(':id')
  @Roles('GESTORA')
  update(@Param('id') id: string, @Body() dto: UpdateBazarDto) {
    return this.bazaresService.update(id, dto);
  }

  @Delete(':id')
  @Roles('GESTORA')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.bazaresService.remove(id);
  }
}