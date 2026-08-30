import { IsOptional, IsUUID, IsIn, IsDateString } from 'class-validator';
import { STATUS_AGENDAMENTO } from './create-agendamento.dto';

export class ListAgendamentoQueryDto {
  @IsOptional()
  @IsDateString()
  data_inicio?: string;

  @IsOptional()
  @IsDateString()
  data_fim?: string;

  @IsOptional()
  @IsUUID()
  profissional_id?: string;

  @IsOptional()
  @IsUUID()
  beneficiaria_id?: string;

  @IsOptional()
  @IsIn(STATUS_AGENDAMENTO)
  status?: string;
}
