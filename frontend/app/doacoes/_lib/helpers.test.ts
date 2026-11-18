import { describe, expect, it } from "vitest";
import { maskCPF, maskTelefone } from "@/app/triagens/nova/_lib/formulario";
import { contemBusca, fmtPhone, getPlaceholder, isValidEmail, isValidPhone } from "./helpers";

describe("busca tolerante", () => {
  it("ignora acento e caixa", () => {
    expect(contemBusca("Campanha de Inverno", "INVERNO")).toBe(true);
    expect(contemBusca("Doadora Conceição", "conceicao")).toBe(true);
    expect(contemBusca("Aurora", "horizonte")).toBe(false);
  });

  it("aceita tudo quando a busca está vazia", () => {
    expect(contemBusca("Qualquer", "   ")).toBe(true);
  });
});

describe("telefone e e-mail do doador", () => {
  it("formata fixo e celular enquanto digita", () => {
    expect(fmtPhone("3133334444")).toBe("(31) 3333-4444");
    expect(fmtPhone("31988887777")).toBe("(31) 98888-7777");
  });

  it("aceita só 10 ou 11 dígitos", () => {
    expect(isValidPhone("(31) 98888-7777")).toBe(true);
    expect(isValidPhone("(31) 9888")).toBe(false);
  });

  it("valida o formato do e-mail", () => {
    expect(isValidEmail("doador@example.com")).toBe(true);
    expect(isValidEmail("doador@")).toBe(false);
  });

  it("sugere um exemplo coerente com o tipo de doação", () => {
    expect(getPlaceholder("ROUPA")).toContain("camisetas");
    expect(getPlaceholder("DESCONHECIDO")).toBe("Ex: 5 kg de arroz");
  });
});

describe("máscaras da triagem", () => {
  it("aplica a máscara de CPF e corta o excesso", () => {
    expect(maskCPF("123456789012345")).toBe("123.456.789-01");
    expect(maskCPF("1234")).toBe("123.4");
  });

  it("aplica a máscara de telefone", () => {
    expect(maskTelefone("31988887777")).toBe("(31) 98888-7777");
  });
});
