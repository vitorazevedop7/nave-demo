import { IsString, IsNotEmpty } from 'class-validator';

export class CreateEncaminhamentoDto {
  @IsString()
  @IsNotEmpty()
  triagemId: string;

  @IsString()
  @IsNotEmpty()
  especialidade: string;
}
