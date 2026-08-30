import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsUUID,
  IsIn,
  IsDateString,
} from 'class-validator';

export const STATUS_AGENDAMENTO = [
  'AGENDADO',
  'CONFIRMADO',
  'REALIZADO',
  'CANCELADO',
] as const;

export class CreateAgendamentoDto {
  @IsUUID()
  @IsNotEmpty()
  beneficiaria_id: string;

  @IsOptional()
  @IsUUID()
  profissional_id?: string;

  @IsOptional()
  @IsUUID()
  encaminhamento_id?: string;

  @IsDateString()
  @IsNotEmpty()
  data_hora: string;

  @IsOptional()
  @IsIn(STATUS_AGENDAMENTO)
  status?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;
}
