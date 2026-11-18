'use client';

import { Clock, Stethoscope, User } from 'lucide-react';
import Button from '@/components/Button';
import type { Agendamento } from '@/lib/agendamentos';
import { nomeEspecialidade } from '@/lib/visibilidade';
import { StatusBadge } from '../../components/StatusBadge';
import { obterTituloAgendamento } from '../_lib/calendario';

interface DetalhesAgendamentoProps {
  ag: Agendamento;
  isProfissional: boolean;
  onEditar: (ag: Agendamento) => void;
  handleCancelar: (ag: Agendamento) => void;
  handleExcluir: (ag: Agendamento) => void;
}

export default function DetalhesAgendamento({ ag, isProfissional, onEditar, handleCancelar, handleExcluir }: DetalhesAgendamentoProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, fontSize: '1rem', color: '#101826' }}>{obterTituloAgendamento(ag)}</span>
        <StatusBadge status={ag.status} />
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: '#475569' }}>
        <Clock size={14} />
        {new Date(ag.data_hora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: '#475569' }}>
        <User size={14} />
        {ag.usuarios?.nome ?? '—'}
      </div>
      {ag.usuarios?.especialidade && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: '#475569' }}>
          <Stethoscope size={14} />
          {nomeEspecialidade(ag.usuarios.especialidade)}
        </div>
      )}
      {ag.observacoes && (
        <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px', fontSize: '13px', color: '#475569' }}>
          {ag.observacoes}
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
        <Button
          size="sm"
          style={{ padding: '7px 14px', fontSize: '12px' }}
          onClick={() => onEditar(ag)}
        >
          Editar
        </Button>
        {ag.status !== 'CANCELADO' && (
          <Button variant="ghost" size="sm" style={{ padding: '7px 14px', fontSize: '12px' }} onClick={() => handleCancelar(ag)}>
            Cancelar consulta
          </Button>
        )}
        {!isProfissional && (
          <Button variant="danger" size="sm" style={{ padding: '7px 14px', fontSize: '12px' }} onClick={() => handleExcluir(ag)}>
            Excluir
          </Button>
        )}
      </div>
    </div>
  );
}
