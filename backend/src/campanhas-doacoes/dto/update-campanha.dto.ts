import { IsString, IsNumber, IsOptional } from 'class-validator';

export class UpdateCampanhaDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsNumber()
  meta_valor?: number;

  @IsOptional()
  @IsString()
  encerrada_em?: string;
}
