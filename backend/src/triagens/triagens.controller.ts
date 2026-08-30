import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TriagensService } from './triagens.service';
import { CreateTriagemDto } from './dto/create-triagem.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('triagens')
@UseGuards(RolesGuard)
@Roles('GESTORA', 'TRIADORA')
export class TriagensController {
  constructor(private readonly triagensService: TriagensService) {}

  @Get()
  findAll(@Query('beneficiaria_id') beneficiaria_id?: string) {
    return this.triagensService.findAll(beneficiaria_id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.triagensService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTriagemDto) {
    return this.triagensService.create(dto);
  }
}
