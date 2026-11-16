import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateEncaminhamentoDto {
  @IsUUID()
  triagemId: string;

  @IsString()
  @IsNotEmpty()
  especialidade: string;
}
