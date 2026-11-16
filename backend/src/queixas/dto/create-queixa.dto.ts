import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateQueixaDto {
  @IsUUID()
  triagem_id: string;

  @IsString()
  @IsNotEmpty()
  queixa_principal: string;

  @IsOptional()
  @IsString()
  queixa_secundaria?: string;

  @IsOptional()
  @IsString()
  sintomas?: string;

  @IsOptional()
  @IsString()
  tipo_violencia?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;
}
