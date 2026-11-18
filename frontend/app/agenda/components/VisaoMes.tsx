'use client';

import type { Agendamento } from '@/lib/agendamentos';
import { DIAS_SEMANA, comoBotao, corStatus, gerarDiasCalendario, obterTituloAgendamento } from '../_lib/calendario';

interface VisaoMesProps {
  cursor: Date;
  hoje: Date;
  porDia: Map<string, Agendamento[]>;
  setModalDia: (dia: { data: Date; lista: Agendamento[] }) => void;
}

export default function VisaoMes({ cursor, hoje, porDia, setModalDia }: VisaoMesProps) {
  const dias = gerarDiasCalendario(cursor);
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
        {DIAS_SEMANA.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#667b94', padding: '6px 0' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
        {dias.map((dia, i) => {
          if (!dia) return <div key={`vazio-${i}`} />;
          const isHoje = dia.toDateString() === hoje.toDateString();
          const lista = porDia.get(dia.toDateString()) ?? [];
          return (
            <div
              key={dia.toISOString()}
              {...(lista.length > 0
                ? {
                    ...comoBotao(() => setModalDia({ data: dia, lista })),
                    'aria-label': `${dia.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}: ${lista.length} agendamento(s)`,
                  }
                : {})}
              style={{
                minHeight: '90px', padding: '6px', borderRadius: '10px',
                background: isHoje ? 'rgba(46, 92, 53, 0.08)' : 'rgba(255,255,255,0.6)',
                border: isHoje ? '1.5px solid #2e5c35' : '1px solid rgba(0,0,0,0.07)',
                cursor: lista.length ? 'pointer' : 'default',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (lista.length) e.currentTarget.style.background = 'rgba(46,92,53,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = isHoje ? 'rgba(46,92,53,0.08)' : 'rgba(255,255,255,0.6)'; }}
            >
              <div style={{
                fontSize: '12px', fontWeight: isHoje ? 800 : 500,
                color: isHoje ? '#2e5c35' : '#101826', marginBottom: '4px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={isHoje ? { background: '#2e5c35', color: '#fff', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}}>
                  {dia.getDate()}
                </span>
                {lista.length > 0 && <span style={{ fontSize: '10px', color: '#667b94' }}>{lista.length}</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {lista.slice(0, 3).map(ag => {
                  const cor = corStatus(ag.status);
                  return (
                    <div key={ag.id} style={{
                      background: cor.bg, color: cor.text,
                      fontSize: '10px', fontWeight: 600,
                      borderRadius: '4px', padding: '2px 5px',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {new Date(ag.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} {obterTituloAgendamento(ag)}
                    </div>
                  );
                })}
                {lista.length > 3 && (
                  <div style={{ fontSize: '10px', color: '#667b94', paddingLeft: '4px' }}>+{lista.length - 3} mais</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
