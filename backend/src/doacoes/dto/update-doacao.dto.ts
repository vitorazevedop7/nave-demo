import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class UpdateDoacaoDto {
  @IsOptional()
  @IsString()
  doador_id?: string;

  @IsOptional()
  @IsString()
  campanha_id?: string;

  @IsOptional()
  @IsEnum(['DINHEIRO', 'ALIMENTO', 'ROUPA', 'OUTRO'])
  tipo?: string;

  @IsOptional()
  @IsNumber()
  valor?: number;

  @IsOptional()
  @IsString()
  quantidade?: string;

  @IsOptional()
  @IsString()
  data?: string;

  @IsOptional()
  @IsString()
  observacao?: string;
}