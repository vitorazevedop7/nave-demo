/**
 * Fixa o fuso dos testes no fuso de operação da ONG. Sem isto, os testes de
 * agrupamento por dia passariam por acaso em máquinas/CI em UTC, onde data
 * local e data UTC coincidem.
 */
export default function definirFusoHorario(): void {
  process.env.TZ = 'America/Sao_Paulo';
}
