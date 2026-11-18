'use client';

import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { Agendamento } from '@/lib/agendamentos';
import { nomeEspecialidade } from '@/lib/visibilidade';
import { StatusBadge } from '../../components/StatusBadge';
import { comoBotao, corStatus, obterTituloAgendamento } from '../_lib/calendario';
import { btnClose, cardStyle, overlayStyle } from './estilos';

interface ModalDiaProps {
  modalDia: { data: Date; lista: Agendamento[] };
  detalhes: ReactNode | null;
  setModalDia: (v: { data: Date; lista: Agendamento[] } | null) => void;
  setAgDetalhes: (ag: Agendamento | null) => void;
}

export default function ModalDia({ modalDia, detalhes, setModalDia, setAgDetalhes }: ModalDiaProps) {
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Agendamentos do dia" style={overlayStyle} onClick={() => { setModalDia(null); setAgDetalhes(null); }}>
      <div style={cardStyle} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#101826' }}>
            {modalDia.data.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h3>
          <button type="button" aria-label="Fechar" onClick={() => { setModalDia(null); setAgDetalhes(null); }} style={btnClose}><X size={16} /></button>
        </div>
        {detalhes ?? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '60vh', overflowY: 'auto' }}>
            {modalDia.lista.map(ag => {
              const cor = corStatus(ag.status);
              return (
                <div
                  key={ag.id}
                  {...comoBotao(() => setAgDetalhes(ag))}
                  style={{
                    background: cor.bg, borderRadius: '10px',
                    padding: '10px 14px', cursor: 'pointer',
                    border: `1px solid ${cor.text}22`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: '#101826' }}>{obterTituloAgendamento(ag)}</span>
                    <StatusBadge status={ag.status} />
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                    {new Date(ag.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · {ag.usuarios?.nome ?? '—'}{ag.usuarios?.especialidade ? ` (${nomeEspecialidade(ag.usuarios.especialidade)})` : ''}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
