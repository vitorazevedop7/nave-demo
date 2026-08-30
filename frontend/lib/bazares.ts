import { fetchAuth } from './auth';

import { API_BASE } from './api';

const API_BASE_URL = `${API_BASE}/bazares`;

export interface CreateBazarPayload {
  nome: string;
  data: string;
  horario_inicio?: string;
  horario_fim?: string;
  local?: string;
  descricao?: string;
  observacoes?: string;
  profissional_ids: string[];
}

export interface UpdateBazarPayload {
  nome?: string;
  data?: string;
  horario_inicio?: string;
  horario_fim?: string;
  local?: string;
  descricao?: string;
  total_arrecadado?: number;
  observacoes?: string;
  profissional_ids?: string[];
}

export interface ListBazarFilters {
  data_inicio?: string;
  data_fim?: string;
  local?: string;
  nome?: string;
}

export class BazaresAPI {
  /**
   * Listar todos os bazares com filtros opcionais
   */
  static async listar(filtros?: ListBazarFilters) {
    const params = new URLSearchParams();

    if (filtros?.data_inicio) params.append('data_inicio', filtros.data_inicio);
    if (filtros?.data_fim) params.append('data_fim', filtros.data_fim);
    if (filtros?.local) params.append('local', filtros.local);
    if (filtros?.nome) params.append('nome', filtros.nome);

    const url = params.toString()
      ? `${API_BASE_URL}?${params.toString()}`
      : API_BASE_URL;

    const res = await fetchAuth(url);
    if (!res.ok) throw new Error(`Erro ao listar bazares: ${res.status}`);
    return res.json();
  }

  /**
   * Obter detalhes de um bazar específico
   */
  static async obter(id: string) {
    const res = await fetchAuth(`${API_BASE_URL}/${id}`);
    if (!res.ok) throw new Error(`Erro ao obter bazar: ${res.status}`);
    return res.json();
  }

  /**
   * Criar novo bazar
   */
  static async criar(payload: CreateBazarPayload) {
    const res = await fetchAuth(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || `Erro ao criar bazar: ${res.status}`);
    }

    return res.json();
  }

  /**
   * Atualizar bazar existente
   */
  static async atualizar(id: string, payload: UpdateBazarPayload) {
    const res = await fetchAuth(`${API_BASE_URL}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || `Erro ao atualizar bazar: ${res.status}`);
    }

    return res.json();
  }

  /**
   * Deletar bazar
   */
  static async deletar(id: string) {
    const res = await fetchAuth(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) throw new Error(`Erro ao deletar bazar: ${res.status}`);
  }

  /**
   * Buscar bazares por período
   */
  static async buscarPorPeriodo(dataInicio: string, dataFim: string) {
    return this.listar({ data_inicio: dataInicio, data_fim: dataFim });
  }

  /**
   * Buscar bazares por local
   */
  static async buscarPorLocal(local: string) {
    return this.listar({ local });
  }

  /**
   * Buscar bazares por nome
   */
  static async buscarPorNome(nome: string) {
    return this.listar({ nome });
  }
}