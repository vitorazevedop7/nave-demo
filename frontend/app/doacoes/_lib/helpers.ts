/** Comparacao tolerante a acento e caixa, para os campos de busca. */
export function contemBusca(texto: string, busca: string) {
  const limpar = (v: string) =>
    v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  if (!busca.trim()) return true;
  return limpar(texto).includes(limpar(busca));
}

export function fmtBRL(v: number | null) {
  if (!v) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

// Formatar telefone brasileiro
export function fmtPhone(value: string): string {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
}

// Validar telefone brasileiro
export function isValidPhone(phone: string): boolean {
  const numbers = phone.replace(/\D/g, '');
  return numbers.length === 10 || numbers.length === 11;
}

// Validar email
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Placeholder dinâmico baseado no tipo de doação
export function getPlaceholder(tipo: string): string {
  const placeholders: Record<string, string> = {
    DINHEIRO: "0,00",
    ALIMENTO: "Ex: 5 kg de arroz, 10 latas de leite",
    ROUPA: "Ex: 10 camisetas, 5 calças tamanho M",
    OUTRO: "Ex: livros, brinquedos, etc",
  };
  return placeholders[tipo] || "Ex: 5 kg de arroz";
}
