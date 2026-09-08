/**
 * Máscara e conversão de valores em reais.
 *
 * A entrada é sempre tratada como centavos digitados da direita para a esquerda,
 * que é como o brasileiro digita dinheiro: 1 2 3 4 5 6 -> 1.234,56.
 * O formulário guarda sempre a string mascarada ("1.234,56") e só converte
 * para número na hora de enviar ao backend.
 */

/** Aplica a máscara sobre o que o usuário digitou. Devolve "" quando não há dígito. */
export function formatarMoedaInput(bruto: string): string {
  // Zeros a esquerda saem fora para que apagar ate o fim limpe o campo
  // (a meta de arrecadacao precisa poder voltar a ficar vazia).
  const digitos = (bruto ?? "").replace(/\D/g, "").replace(/^0+/, "").slice(0, 15);
  if (!digitos) return "";
  const centavos = Number(digitos);
  return (centavos / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** "1.234,56" -> 1234.56. Devolve null quando vazio ou inválido. */
export function moedaParaNumero(valor: string): number | null {
  const digitos = (valor ?? "").replace(/\D/g, "");
  if (!digitos) return null;
  const n = Number(digitos) / 100;
  return Number.isFinite(n) ? n : null;
}

/** Número/Decimal vindo do backend -> "1.234,56", para hidratar o formulário na edição. */
export function numeroParaMoeda(valor: number | string | null | undefined): string {
  if (valor === null || valor === undefined || valor === "") return "";
  const n = typeof valor === "number" ? valor : Number(valor);
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Exibição: 1234.56 -> "R$ 1.234,56". */
export function formatarMoeda(valor: number | string | null | undefined): string {
  if (valor === null || valor === undefined || valor === "") return "R$ 0,00";
  const n = typeof valor === "number" ? valor : Number(valor);
  if (!Number.isFinite(n)) return "R$ 0,00";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
