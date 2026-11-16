/**
 * Utilitários de data do dashboard. Todo agrupamento por dia ou mês usa os
 * componentes de data LOCAIS do servidor (fuso de operação: America/Sao_Paulo),
 * nunca `toISOString()`: em UTC-3, um atendimento às 22h cairia no dia
 * seguinte se a chave fosse calculada em UTC.
 */

const MS_POR_DIA = 24 * 60 * 60 * 1000;

const doisDigitos = (n: number) => String(n).padStart(2, '0');

/** Meia-noite local do dia de `data`. */
export function inicioDoDia(data: Date): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

/** Soma dias de calendário (seguro em mudança de horário de verão). */
export function somarDias(data: Date, dias: number): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate() + dias);
}

/** Chave `AAAA-MM-DD` do dia local de `data`. */
export function chaveDia(data: Date): string {
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`;
}

/** Chave `AAAA-MM` do mês local de `data`. */
export function chaveMes(data: Date): string {
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}`;
}

/**
 * Quantos dias de calendário separam `de` de `ate` (0 = mesmo dia local).
 * Arredonda para absorver dias de 23h/25h em transições de horário de verão.
 */
export function diasDeCalendarioEntre(de: Date, ate: Date): number {
  return Math.round(
    (inicioDoDia(ate).getTime() - inicioDoDia(de).getTime()) / MS_POR_DIA,
  );
}
