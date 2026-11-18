import { describe, expect, it } from "vitest";
import { formatarMoedaInput, moedaParaNumero, numeroParaMoeda } from "./moeda";

describe("formatarMoedaInput", () => {
  it("trata os dígitos como centavos digitados da direita para a esquerda", () => {
    expect(formatarMoedaInput("1")).toBe("0,01");
    expect(formatarMoedaInput("12345")).toBe("123,45");
    expect(formatarMoedaInput("123456")).toBe("1.234,56");
  });

  it("ignora o que não é dígito, inclusive a máscara anterior", () => {
    expect(formatarMoedaInput("R$ 1.234,567")).toBe("12.345,67");
  });

  it("volta a ficar vazio quando todos os dígitos são apagados", () => {
    expect(formatarMoedaInput("")).toBe("");
    expect(formatarMoedaInput("0,0")).toBe("");
  });
});

describe("moedaParaNumero", () => {
  it("converte o texto mascarado em número", () => {
    expect(moedaParaNumero("1.234,56")).toBe(1234.56);
  });

  it("devolve null para campo vazio", () => {
    expect(moedaParaNumero("")).toBeNull();
  });
});

describe("numeroParaMoeda", () => {
  it("aceita o Decimal que a API manda como string", () => {
    expect(numeroParaMoeda("915.5")).toBe("915,50");
    expect(numeroParaMoeda(1234.5)).toBe("1.234,50");
  });

  it("devolve vazio para ausente ou inválido", () => {
    expect(numeroParaMoeda(null)).toBe("");
    expect(numeroParaMoeda("abc")).toBe("");
  });

  it("faz ida e volta com a máscara do formulário", () => {
    expect(moedaParaNumero(numeroParaMoeda(5000))).toBe(5000);
  });
});
