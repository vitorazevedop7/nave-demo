import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsUUID,
  IsDateString,
  IsArray,
} from 'class-validator';

export class CreateBazarDto {
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @IsDateString()
  @IsNotEmpty()
  data!: string;

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
  @IsString()
  observacoes?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  profissional_ids!: string[];
}