'use client';

import type { Agendamento } from '@/lib/agendamentos';
import { DIAS_SEMANA, HORAS, comoBotao, corStatus, obterTituloAgendamento, startOfWeek, type View } from '../_lib/calendario';

interface VisaoLinhaDoTempoProps {
  view: View;
  cursor: Date;
  hoje: Date;
  porDia: Map<string, Agendamento[]>;
  setAgDetalhes: (ag: Agendamento) => void;
}

export default function VisaoLinhaDoTempo({ view, cursor, hoje, porDia, setAgDetalhes }: VisaoLinhaDoTempoProps) {
  const ini = view === 'week' ? startOfWeek(cursor) : new Date(cursor);
  const colDias = view === 'week' ? 7 : 1;
  const dias: Date[] = Array.from({ length: colDias }, (_, i) => {
    const d = new Date(ini); d.setDate(ini.getDate() + i); d.setHours(0, 0, 0, 0); return d;
  });

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `64px repeat(${colDias}, 1fr)`, minWidth: colDias === 1 ? '300px' : '700px' }}>
        <div />
        {dias.map(dia => {
          const isHoje = dia.toDateString() === hoje.toDateString();
          return (
            <div key={dia.toISOString()} style={{
              textAlign: 'center', padding: '8px 4px',
              fontSize: '12px', fontWeight: isHoje ? 800 : 600,
              color: isHoje ? '#2e5c35' : '#667b94',
              borderBottom: '2px solid rgba(0,0,0,0.08)',
            }}>
              {DIAS_SEMANA[dia.getDay()]} {dia.getDate()}
            </div>
          );
        })}
        {HORAS.map(hora => (
          <div key={hora} style={{ display: 'contents' }}>
            <div style={{
              fontSize: '11px', color: '#94a3b8', textAlign: 'right',
              paddingRight: '8px', paddingTop: '4px',
              height: '60px', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
            }}>
              {String(hora).padStart(2, '0')}:00
            </div>
            {dias.map(dia => {
              const lista = (porDia.get(dia.toDateString()) ?? []).filter(ag => {
                const h = new Date(ag.data_hora).getHours();
                return h === hora;
              });
              return (
                <div key={dia.toISOString()} style={{
                  borderLeft: '1px solid rgba(0,0,0,0.06)',
                  borderBottom: '1px solid rgba(0,0,0,0.06)',
                  height: '60px', padding: '2px 3px',
                  background: dia.toDateString() === hoje.toDateString() ? 'rgba(46,92,53,0.03)' : 'transparent',
                }}>
                  {lista.map(ag => {
                    const cor = corStatus(ag.status);
                    return (
                      <div
                        key={ag.id}
                        {...comoBotao(() => setAgDetalhes(ag))}
                        style={{
                          background: cor.bg, color: cor.text,
                          borderRadius: '5px', padding: '2px 6px',
                          fontSize: '10px', fontWeight: 600,
                          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                          cursor: 'pointer', marginBottom: '2px',
                        }}
                      >
                        {new Date(ag.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} {obterTituloAgendamento(ag)}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
