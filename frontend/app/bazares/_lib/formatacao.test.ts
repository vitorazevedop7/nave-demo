import { describe, expect, it } from "vitest";
import { extrairHora, formatCurrency, formatTime, somarArrecadado } from "./formatacao";

describe("somarArrecadado", () => {
  it("soma os Decimais que a API devolve como string", () => {
    // Antes, "780" + "915.5" + "640" virava R$ 780.915,56 no card de resumo.
    const bazares = [
      { total_arrecadado: "780" },
      { total_arrecadado: "915.5" },
      { total_arrecadado: "640" },
      { total_arrecadado: null },
    ];
    expect(somarArrecadado(bazares)).toBe(2335.5);
  });

  it("ignora valores que não são número", () => {
    expect(somarArrecadado([{ total_arrecadado: "abc" }, { total_arrecadado: 10 }])).toBe(10);
  });
});

describe("formatCurrency", () => {
  it("formata número ou string em reais", () => {
    expect(formatCurrency("915.5")).toBe("R$ 915,50");
    expect(formatCurrency(2335.5)).toBe("R$ 2.335,50");
    expect(formatCurrency(null)).toBe("R$ 0,00");
  });
});

describe("horários (coluna TIME)", () => {
  it("exibe a hora informada, sem aplicar o fuso do navegador", () => {
    expect(formatTime("1970-01-01T10:00:00.000Z")).toBe("10:00");
    expect(formatTime(null)).toBe("—");
  });

  it("extrai HH:MM para o input de horário", () => {
    expect(extrairHora("1970-01-01T14:30:00.000Z")).toBe("14:30");
    expect(extrairHora("09:15")).toBe("09:15");
    expect(extrairHora(null)).toBe("");
  });
});
