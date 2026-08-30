import { IsOptional, IsDateString, IsString } from 'class-validator';

export class ListBazarQueryDto {
  @IsOptional()
  @IsDateString()
  data_inicio?: string;

  @IsOptional()
  @IsDateString()
  data_fim?: string;

  @IsOptional()
  @IsString()
  local?: string;

  @IsOptional()
  @IsString()
  nome?: string;
}