import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export const TIPOS_DOACAO = ['DINHEIRO', 'ALIMENTO', 'ROUPA', 'OUTRO'] as const;
export type TipoDoacao = (typeof TIPOS_DOACAO)[number];

export class CreateDoacaoDto {
  @IsOptional()
  @IsUUID()
  doador_id?: string;

  @IsOptional()
  @IsUUID()
  campanha_id?: string;

  @IsIn(TIPOS_DOACAO)
  tipo!: TipoDoacao;

  @IsOptional()
  @IsNumber()
  valor?: number;

  @IsOptional()
  @IsString()
  quantidade?: string;

  /** Data da doação (ISO 8601, ex.: `2026-11-16`). */
  @IsDateString()
  data!: string;

  @IsOptional()
  @IsString()
  observacao?: string;
}
