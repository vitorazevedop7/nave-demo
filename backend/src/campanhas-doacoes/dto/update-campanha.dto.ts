import { PartialType } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';
import { CreateCampanhaDto } from './create-campanha.dto';

export class UpdateCampanhaDto extends PartialType(CreateCampanhaDto) {
  /** Data de encerramento da campanha (ISO 8601). */
  @IsOptional()
  @IsDateString()
  encerrada_em?: string;
}
