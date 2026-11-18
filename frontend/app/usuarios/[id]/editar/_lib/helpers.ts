import { formatarTimestamp } from "@/lib/date";

export function getIniciais(nome: string): string {
  return nome.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0].toUpperCase()).join("");
}

// `criado_em` é um timestamp real — a conversão para o fuso local é correta.
export function formatarData(iso: string): string {
  return formatarTimestamp(iso, { day: "2-digit", month: "long", year: "numeric" });
}

export function validateEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
