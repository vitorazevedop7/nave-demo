import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateCampanhaDto {
  @IsNotEmpty()
  @IsString()
  nome!: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsNumber()
  meta_valor?: number;
}
