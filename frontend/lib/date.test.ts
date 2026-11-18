import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatarDataPura,
  formatarTimestamp,
  hojeInputDate,
  paraInputDate,
  parseDataPura,
} from "./date";

describe("datas puras (coluna date)", () => {
  it("preserva o dia mesmo quando a API manda meia-noite UTC", () => {
    // Em Brasília, new Date("2018-06-15T00:00:00Z") cairia no dia 14.
    const data = parseDataPura("2018-06-15T00:00:00.000Z");
    expect(data?.getFullYear()).toBe(2018);
    expect(data?.getMonth()).toBe(5);
    expect(data?.getDate()).toBe(15);
  });

  it("formata em dd/mm/aaaa sem deslocar o dia", () => {
    expect(formatarDataPura("2018-06-15T00:00:00.000Z")).toBe("15/06/2018");
  });

  it("devolve vazio para valores ausentes ou inválidos", () => {
    expect(parseDataPura(null)).toBeNull();
    expect(parseDataPura("ontem")).toBeNull();
    expect(formatarDataPura(undefined)).toBe("");
  });

  it("extrai YYYY-MM-DD para inputs de data", () => {
    expect(paraInputDate("2026-09-21T03:00:00.000Z")).toBe("2026-09-21");
    expect(paraInputDate("")).toBe("");
  });
});

describe("hojeInputDate", () => {
  afterEach(() => vi.useRealTimers());

  it("usa o dia local, não o dia em UTC", () => {
    vi.useFakeTimers();
    // 23h30 de 18/11 em Brasília já é dia 19 em UTC.
    vi.setSystemTime(new Date("2026-11-19T02:30:00.000Z"));
    expect(hojeInputDate()).toBe("2026-11-18");
  });
});

describe("formatarTimestamp", () => {
  it("converte o instante para o fuso local", () => {
    expect(formatarTimestamp("2026-11-19T02:30:00.000Z")).toBe("18/11/2026");
  });

  it("ignora valores inválidos", () => {
    expect(formatarTimestamp("não é data")).toBe("");
    expect(formatarTimestamp(null)).toBe("");
  });
});
