import { API_URL } from "./api";
import { fetchAuth } from "./auth";

export interface BeneficiariaResumo {
  id: string;
  nome: string;
  tipo?: string | null;
}

export interface BeneficiariaOpcao {
  id: string;
  nome: string;
}

function resumir(lista: unknown): BeneficiariaResumo[] {
  return Array.isArray(lista) ? (lista as BeneficiariaResumo[]) : [];
}

/** Busca beneficiárias por nome/CPF para autocompletar. Em caso de falha retorna lista vazia. */
export async function buscarBeneficiarias(termo: string, tipo?: string): Promise<BeneficiariaOpcao[]> {
  const params = new URLSearchParams({ busca: termo });
  if (tipo) params.set("tipo", tipo);
  try {
    const res = await fetchAuth(`${API_URL}/beneficiarias?${params.toString()}`);
    if (!res.ok) return [];
    return resumir(await res.json()).map((b) => ({ id: b.id, nome: b.nome }));
  } catch {
    return [];
  }
}

export interface Dependente {
  id: string;
  nome: string;
  tipo: string;
}

/** Converte a resposta de `/beneficiarias?responsavel_id=` em uma lista de dependentes. */
export function paraDependentes(lista: unknown): Dependente[] {
  return resumir(lista).map((d) => ({ id: d.id, nome: d.nome, tipo: d.tipo ?? "ADULTA" }));
}
