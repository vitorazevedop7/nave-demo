import { IsString, IsOptional, IsNotEmpty, IsBoolean } from 'class-validator';

export class CreateBeneficiarioDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsOptional()
  @IsString()
  cpf?: string;

  @IsOptional()
  @IsString()
  data_nascimento?: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  @IsString()
  endereco?: string;

  @IsOptional()
  @IsString()
  tipo?: string; // ADULTA, CRIANCA, ADOLESCENTE

  @IsOptional()
  @IsString()
  responsavel_id?: string;

  @IsOptional()
  @IsString()
  status?: string; // ATIVA, EM_ESPERA, ENCERRADA, DESISTENTE

  @IsOptional()
  @IsString()
  estado_civil?: string;

  @IsOptional()
  @IsString()
  escolaridade?: string;

  @IsOptional()
  @IsString()
  raca?: string;

  @IsOptional()
  @IsString()
  ocupacao?: string;

  @IsOptional()
  @IsBoolean()
  empregada?: boolean;
}
