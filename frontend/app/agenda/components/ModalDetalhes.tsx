'use client';

import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { Agendamento } from '@/lib/agendamentos';
import { btnClose, cardStyle, overlayStyle } from './estilos';

interface ModalDetalhesProps {
  setAgDetalhes: (ag: Agendamento | null) => void;
  children: ReactNode;
}

export default function ModalDetalhes({ setAgDetalhes, children }: ModalDetalhesProps) {
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Detalhes do agendamento" style={overlayStyle} onClick={() => setAgDetalhes(null)}>
      <div style={cardStyle} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#101826' }}>Detalhes</h3>
          <button type="button" aria-label="Fechar" onClick={() => setAgDetalhes(null)} style={btnClose}><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
