import { IsDateString, IsOptional, IsUUID } from 'class-validator';

/** A triadora responsável é sempre o usuário autenticado, nunca o corpo. */
export class CreateTriagemDto {
  @IsUUID()
  beneficiaria_id: string;

  @IsOptional()
  @IsDateString()
  data_triagem?: string;
}
