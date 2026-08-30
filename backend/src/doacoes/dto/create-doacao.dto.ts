import { IsString, IsOptional, IsNotEmpty, IsNumber, IsEnum } from 'class-validator';

export class CreateDoacaoDto {
  @IsOptional()
  @IsString()
  doador_id?: string;

  @IsOptional()
  @IsString()
  campanha_id?: string;

  @IsNotEmpty()
  @IsEnum(['DINHEIRO', 'ALIMENTO', 'ROUPA', 'OUTRO'])
  tipo!: 'DINHEIRO' | 'ALIMENTO' | 'ROUPA' | 'OUTRO';

  @IsOptional()
  @IsNumber()
  valor?: number;

  @IsOptional()
  @IsString()
  quantidade?: string;

  @IsNotEmpty()
  @IsString()
  data!: string; // ISO date string

  @IsOptional()
  @IsString()
  observacao?: string;
}