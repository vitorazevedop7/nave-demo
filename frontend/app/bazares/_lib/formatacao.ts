export function formatTime(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  // horario_inicio/horario_fim são campos TIME do banco: representam uma hora
  // civil, não um instante. Exibir no UTC preserva a hora informada sem aplicar
  // o deslocamento do navegador (ex.: 10:00 não vira 07:00 em Brasília).
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

export function formatCurrency(value: number | string | null): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n) || n === 0) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(n);
}

/** Soma os totais dos bazares. O Decimal chega como string da API: somar com + concatenaria. */
export function somarArrecadado(bazares: { total_arrecadado: number | string | null }[]): number {
  return bazares.reduce((soma, b) => {
    const valor = Number(b.total_arrecadado ?? 0);
    return soma + (Number.isFinite(valor) ? valor : 0);
  }, 0);
}

/** "1970-01-01T10:30:00.000Z" → "10:30", para preencher <input type="time">. */
export function extrairHora(iso: string | null): string {
  if (!iso) return "";
  if (iso.includes("T")) {
    return iso.split("T")[1].substring(0, 5);
  }
  return iso;
}
