import {
  chaveDia,
  chaveMes,
  diasDeCalendarioEntre,
  inicioDoDia,
  somarDias,
} from './datas';

describe('utilitários de data do dashboard (TZ America/Sao_Paulo)', () => {
  it('roda no fuso de operação da ONG', () => {
    expect(new Date(2026, 0, 1).getTimezoneOffset()).toBe(180);
  });

  it('chaveDia usa o dia local mesmo quando em UTC já é o dia seguinte', () => {
    const noite = new Date(2026, 10, 17, 22, 30);
    expect(noite.toISOString().slice(0, 10)).toBe('2026-11-18');
    expect(chaveDia(noite)).toBe('2026-11-17');
  });

  it('chaveMes usa o mês local na virada do mês', () => {
    expect(chaveMes(new Date(2026, 9, 31, 23, 30))).toBe('2026-10');
  });

  it('inicioDoDia zera hora, minuto, segundo e milissegundo locais', () => {
    expect(inicioDoDia(new Date(2026, 10, 18, 17, 45, 12, 345))).toEqual(
      new Date(2026, 10, 18),
    );
  });

  it('somarDias atravessa a virada de mês e de ano', () => {
    expect(somarDias(new Date(2026, 11, 31, 15), 1)).toEqual(
      new Date(2027, 0, 1),
    );
    expect(somarDias(new Date(2026, 2, 1), -1)).toEqual(new Date(2026, 1, 28));
  });

  it('diasDeCalendarioEntre conta dias de calendário, não blocos de 24h', () => {
    const hoje = new Date(2026, 10, 18);
    expect(diasDeCalendarioEntre(new Date(2026, 10, 18, 23, 59), hoje)).toBe(0);
    expect(diasDeCalendarioEntre(new Date(2026, 10, 17, 23, 59), hoje)).toBe(1);
    expect(diasDeCalendarioEntre(new Date(2026, 10, 11, 0, 1), hoje)).toBe(7);
  });
});
