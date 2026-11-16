import { IsIn, IsOptional } from 'class-validator';

export const PERIODOS_DASHBOARD = ['hoje', 'semana', 'mes'] as const;
export type PeriodoDashboard = (typeof PERIODOS_DASHBOARD)[number];

export class DashboardQueryDto {
  @IsOptional()
  @IsIn(PERIODOS_DASHBOARD)
  period?: PeriodoDashboard;
}
