import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateTriagemDto {
  @IsString()
  @IsNotEmpty()
  beneficiaria_id: string;

  @IsString()
  @IsNotEmpty()
  triador_id: string;

  @IsOptional()
  @IsString()
  data_triagem?: string;
}
