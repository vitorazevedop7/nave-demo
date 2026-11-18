'use client';

import { corStatus } from '../_lib/calendario';

/** Legenda de cores dos quatro status de atendimento. */
export default function LegendaStatus() {
  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      {(['AGENDADO', 'CONFIRMADO', 'REALIZADO', 'CANCELADO'] as const).map(status => {
        const cor = corStatus(status);
        return (
          <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#667b94' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: cor.bg, border: `1px solid ${cor.text}` }} />
            {status.charAt(0) + status.slice(1).toLowerCase()}
          </div>
        );
      })}
    </div>
  );
}
