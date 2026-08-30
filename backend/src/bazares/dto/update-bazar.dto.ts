import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsArray,
  IsNumber,
} from 'class-validator';

export class UpdateBazarDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsDateString()
  data?: string;

  @IsOptional()
  @IsString()
  horario_inicio?: string;

  @IsOptional()
  @IsString()
  horario_fim?: string;

  @IsOptional()
  @IsString()
  local?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsNumber()
  total_arrecadado?: number;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  profissional_ids?: string[];
}