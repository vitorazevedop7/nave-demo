/**
 * Utilitários para o módulo de Bazares
 *
 * `bazar.data` é uma data pura (coluna `date`), então nunca deve passar por
 * `new Date(iso)` direto — ver `lib/date.ts`.
 */

import { formatarDataPura, parseDataPura } from './date';

export const BazarUtils = {
  /**
   * Formata data ISO para formato brasileiro
   */
  formatDate: (iso: string): string => {
    return formatarDataPura(iso);
  },

  /**
   * Formata tempo para HH:MM
   */
  formatTime: (time: string | null): string => {
    if (!time) return '—';
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  },

  /**
   * Formata valor monetário em Real
   */
  formatCurrency: (value: number | null | undefined): string => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  },

  /**
   * Formata data e hora completa
   */
  formatDateTime: (iso: string): string => {
    const date = new Date(iso);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  /**
   * Obtém iniciais de um nome
   */
  getInitials: (nome: string): string => {
    return nome
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('');
  },

  /**
   * Verifica se bazar é futuro
   */
  isFutureBazar: (data: string): boolean => {
    const bazarDate = parseDataPura(data);
    if (!bazarDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bazarDate >= today;
  },

  /**
   * Verifica se bazar é hoje
   */
  isToday: (data: string): boolean => {
    const bazarDate = parseDataPura(data);
    if (!bazarDate) return false;
    const today = new Date();
    return (
      bazarDate.getDate() === today.getDate() &&
      bazarDate.getMonth() === today.getMonth() &&
      bazarDate.getFullYear() === today.getFullYear()
    );
  },

  /**
   * Calcula dias até o bazar
   */
  daysUntil: (data: string): number => {
    const bazarDate = parseDataPura(data);
    if (!bazarDate) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = bazarDate.getTime() - today.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  },

  /**
   * Obtém status visual do bazar
   */
  getStatusBadge: (data: string): { label: string; color: string } => {
    const days = BazarUtils.daysUntil(data);

    if (days < 0) {
      return { label: 'Passado', color: '#6a6660' };
    } else if (days === 0) {
      return { label: 'Hoje', color: '#16a34a' };
    } else if (days === 1) {
      return { label: 'Amanhã', color: '#2563eb' };
    } else if (days <= 7) {
      return { label: `Em ${days} dias`, color: '#ea580c' };
    } else {
      return { label: 'Agendado', color: '#6a9e6e' };
    }
  },

  /**
   * Valida dados do formulário
   */
  validateBazarData: (data: {
    nome: string;
    data: string;
    profissional_ids: string[];
  }): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data.nome || data.nome.trim().length === 0) {
      errors.push('Nome do bazar é obrigatório');
    }

    if (!data.data) {
      errors.push('Data é obrigatória');
    } else if (!parseDataPura(data.data)) {
      errors.push('Data inválida');
    }

    if (!data.profissional_ids || data.profissional_ids.length === 0) {
      errors.push('Selecione pelo menos uma profissional');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Gera cor baseada em hash do ID
   */
  getColorByHash: (id: string): string => {
    const colors = [
      '#6a9e6e',
      '#3b82f6',
      '#9333ea',
      '#ea580c',
      '#e07a6e',
      '#16a34a',
      '#2563eb',
      '#d32f2f',
    ];

    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % colors.length;
    return colors[index];
  },

  /**
   * Exporta bazar para JSON
   */
  exportJSON: (bazar: any): void => {
    const dataStr = JSON.stringify(bazar, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bazar-${bazar.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  },

  /**
   * Copia texto para clipboard
   */
  copyToClipboard: async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Ordena bazares por data
   */
  sortByDate: (bazares: any[], order: 'asc' | 'desc' = 'asc'): any[] => {
    return [...bazares].sort((a, b) => {
      const dateA = parseDataPura(a.data)?.getTime() ?? 0;
      const dateB = parseDataPura(b.data)?.getTime() ?? 0;
      return order === 'asc' ? dateA - dateB : dateB - dateA;
    });
  },

  /**
   * Agrupa bazares por mês
   */
  groupByMonth: (bazares: any[]): Record<string, any[]> => {
    const grouped: Record<string, any[]> = {};

    bazares.forEach((bazar) => {
      const date = parseDataPura(bazar.data);
      if (!date) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(bazar);
    });

    return grouped;
  },

  /**
   * Calcula estatísticas de bazares
   */
  calculateStats: (bazares: any[]) => {
    const stats = {
      total: bazares.length,
      futuros: bazares.filter((b) => BazarUtils.isFutureBazar(b.data)).length,
      passados: bazares.filter((b) => !BazarUtils.isFutureBazar(b.data)).length,
      arrecadado: bazares.reduce((sum, b) => sum + (b.total_arrecadado || 0), 0),
      mediaArrecadado: 0,
      localMaisFrequente: '',
    };

    if (bazares.length > 0) {
      stats.mediaArrecadado = stats.arrecadado / bazares.length;
    }

    // Encontrar local mais frequente
    const localCounts: Record<string, number> = {};
    bazares.forEach((b) => {
      if (b.local) {
        localCounts[b.local] = (localCounts[b.local] || 0) + 1;
      }
    });

    stats.localMaisFrequente = Object.entries(localCounts).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0] || '';

    return stats;
  },
};