'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Clock, User, Stethoscope } from 'lucide-react';
import {
  Agendamento,
  listarAgendamentos,
  meusAgendamentos,
  editarAgendamento,
  excluirAgendamento,
} from '@/lib/agendamentos';
import { getUsuario } from '@/lib/auth';
import { StatusBadge } from '../components/StatusBadge';
import AgendamentoFormModal from './components/AgendamentoFormModal';
import { useDialog } from '@/components/DialogProvider';
import Button from '@/components/Button';

type View = 'month' | 'week' | 'day';

const HORAS = Array.from({ length: 19 }, (_, i) => i + 5); // 05 – 23
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

function isoLocal(dt: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T00:00:00`;
}

function startOfWeek(d: Date): Date {
  const dt = new Date(d);
  dt.setDate(dt.getDate() - dt.getDay());
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function calcularRange(view: View, cursor: Date): { inicio: Date; fim: Date } {
  if (view === 'month') {
    const inicio = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const fim = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59);
    return { inicio, fim };
  }
  if (view === 'week') {
    const inicio = startOfWeek(cursor);
    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 6);
    fim.setHours(23, 59, 59);
    return { inicio, fim };
  }
  // day
  const inicio = new Date(cursor);
  inicio.setHours(0, 0, 0, 0);
  const fim = new Date(cursor);
  fim.setHours(23, 59, 59);
  return { inicio, fim };
}

function moverCursor(view: View, cursor: Date, delta: -1 | 1): Date {
  const d = new Date(cursor);
  if (view === 'month') d.setMonth(d.getMonth() + delta);
  else if (view === 'week') d.setDate(d.getDate() + delta * 7);
  else d.setDate(d.getDate() + delta);
  return d;
}

function formatarTituloView(view: View, cursor: Date): string {
  if (view === 'month') return `${MESES[cursor.getMonth()]} ${cursor.getFullYear()}`;
  if (view === 'week') {
    const ini = startOfWeek(cursor);
    const fim = new Date(ini); fim.setDate(fim.getDate() + 6);
    return `${ini.getDate()} – ${fim.getDate()} de ${MESES[fim.getMonth()]} ${fim.getFullYear()}`;
  }
  return cursor.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function agruparPorDia(agendamentos: Agendamento[]): Map<string, Agendamento[]> {
  const map = new Map<string, Agendamento[]>();
  for (const a of agendamentos) {
    const key = new Date(a.data_hora).toDateString();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(a);
  }
  return map;
}

function corStatus(status: string): { bg: string; text: string } {
  const map: Record<string, { bg: string; text: string }> = {
    AGENDADO:   { bg: '#dbeafe', text: '#1d4ed8' },
    CONFIRMADO: { bg: '#e0f2fe', text: '#0369a1' },
    REALIZADO:  { bg: '#dcfce7', text: '#16a34a' },
    CANCELADO:  { bg: '#f1f5f9', text: '#64748b' },
  };
  return map[status] ?? { bg: '#f1f5f9', text: '#64748b' };
}

function obterTituloAgendamento(ag: Agendamento): string {
  // 1. Se tiver beneficiária, é um agendamento normal (mostra o nome dela)
  if (ag.beneficiarias?.nome) {
    return ag.beneficiarias.nome;
  }

  // 2. Se não tiver, verifica se tem o nome do Bazar nas observações
  if (ag.observacoes && ag.observacoes.includes('Bazar:')) {
    return ag.observacoes; // Retorna "Bazar: Nome do Bazar - Local"
  }

  // 3. Caso seja um evento bloqueado/genérico sem nome
  return 'Horário Reservado';
}

export default function AgendaPage() {
  const { confirm, alert } = useDialog();
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const [usuario, setUsuario] = useState<ReturnType<typeof getUsuario>>(null);
  useEffect(() => { setUsuario(getUsuario()); }, []);
  const isProfissional =
    !!usuario?.perfis.includes('PROFISSIONAL') &&
    !usuario?.perfis.includes('GESTORA') &&
    !usuario?.perfis.includes('TRIADORA');

  const [view, setView] = useState<View>('month');
  const [cursor, setCursor] = useState(new Date(hoje));
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [carregando, setCarregando] = useState(false);

  const [modalForm, setModalForm] = useState<{ aberto: boolean; agendamento?: Agendamento }>({ aberto: false });
  const [modalDia, setModalDia] = useState<{ data: Date; lista: Agendamento[] } | null>(null);
  const [agDetalhes, setAgDetalhes] = useState<Agendamento | null>(null);

  const fetchAgendamentos = useCallback(async () => {
    setCarregando(true);
    try {
      let lista: Agendamento[];
      if (isProfissional) {
        lista = await meusAgendamentos();
      } else {
        const { inicio, fim } = calcularRange(view, cursor);
        lista = await listarAgendamentos({
          data_inicio: isoLocal(inicio),
          data_fim: `${fim.getFullYear()}-${String(fim.getMonth() + 1).padStart(2,'0')}-${String(fim.getDate()).padStart(2,'0')}T23:59:59`,
        });
      }
      setAgendamentos(lista);
    } catch {
      /* silencioso */
    } finally {
      setCarregando(false);
    }
  }, [isProfissional, view, cursor]);

  useEffect(() => { fetchAgendamentos(); }, [fetchAgendamentos]);

  const porDia = useMemo(() => agruparPorDia(agendamentos), [agendamentos]);

  async function handleCancelar(ag: Agendamento) {
    const ok = await confirm({
      title: 'Cancelar agendamento',
      message: `Cancelar agendamento de ${obterTituloAgendamento(ag)}?`,
      confirmLabel: 'Cancelar agendamento',
      cancelLabel: 'Voltar',
      variant: 'danger',
    });
    if (!ok) return;
    await editarAgendamento(ag.id, { status: 'CANCELADO' });
    fetchAgendamentos();
    setAgDetalhes(null);
    if (modalDia) {
      setModalDia(prev => prev
        ? { ...prev, lista: prev.lista.map(a => a.id === ag.id ? { ...a, status: 'CANCELADO' } : a) }
        : null
      );
    }
  }

  async function handleExcluir(ag: Agendamento) {
    const ok = await confirm({
      title: 'Excluir agendamento',
      message: `Excluir permanentemente o agendamento de ${obterTituloAgendamento(ag)}?`,
      confirmLabel: 'Excluir',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await excluirAgendamento(ag.id);
    } catch {
      await alert({ message: 'Não foi possível excluir o agendamento.', tone: 'error' });
      return;
    }
    fetchAgendamentos();
    setAgDetalhes(null);
    if (modalDia) {
      setModalDia(prev => prev
        ? { ...prev, lista: prev.lista.filter(a => a.id !== ag.id) }
        : null
      );
    }
  }

  function gerarDiasCalendario(): (Date | null)[] {
    const ano = cursor.getFullYear();
    const mes = cursor.getMonth();
    const primeiroDia = new Date(ano, mes, 1).getDay();
    const totalDias = new Date(ano, mes + 1, 0).getDate();
    const dias: (Date | null)[] = Array(primeiroDia).fill(null);
    for (let d = 1; d <= totalDias; d++) dias.push(new Date(ano, mes, d));
    while (dias.length % 7 !== 0) dias.push(null);
    return dias;
  }

  function renderMonthView() {
    const dias = gerarDiasCalendario();
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
                onClick={() => { if (lista.length > 0) setModalDia({ data: dia, lista }); }}
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

  function renderTimelineView() {
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
                          onClick={() => setAgDetalhes(ag)}
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

  function renderDetalhes(ag: Agendamento) {
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
            {ag.usuarios.especialidade}
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
            onClick={() => {
              setModalDia(null);
              setAgDetalhes(null);
              setModalForm({ aberto: true, agendamento: ag });
            }}
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

  return (
    <div style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#101826' }}>
            {isProfissional ? 'Minha Agenda' : 'Agenda'}
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#667b94' }}>
            {isProfissional ? 'Seus atendimentos' : 'Gerenciamento de atendimentos'}
          </p>
        </div>
        {usuario && (
          <Button size="sm" onClick={() => setModalForm({ aberto: true })}>
            <Plus size={15} /> Novo agendamento
          </Button>
        )}
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(14px)',
        borderRadius: '20px', border: '1px solid rgba(255,255,255,0.75)',
        boxShadow: '0 20px 44px rgba(15,23,42,0.13)', padding: '1.4rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={() => setCursor(moverCursor(view, cursor, -1))} style={btnNav}><ChevronLeft size={16} /></button>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#101826', minWidth: '200px', textAlign: 'center' }}>
              {formatarTituloView(view, cursor)}
            </span>
            <button onClick={() => setCursor(moverCursor(view, cursor, 1))} style={btnNav}><ChevronRight size={16} /></button>
            <button onClick={() => setCursor(new Date(hoje))} style={btnHoje}>Hoje</button>
          </div>
          <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', borderRadius: '8px', padding: '3px' }}>
            {(['month', 'week', 'day'] as View[]).map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '5px 14px', borderRadius: '6px', border: 'none',
                background: view === v ? '#fff' : 'transparent',
                color: view === v ? '#101826' : '#667b94',
                fontWeight: view === v ? 700 : 500,
                fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: view === v ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
              }}>
                {v === 'month' ? 'Mês' : v === 'week' ? 'Semana' : 'Dia'}
              </button>
            ))}
          </div>
        </div>

        {carregando ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#667b94', fontSize: '14px' }}>Carregando...</div>
        ) : view === 'month' ? renderMonthView() : renderTimelineView()}
      </div>

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

      {/* Modal lista do dia */}
      {modalDia && (
        <div style={overlayStyle} onClick={() => { setModalDia(null); setAgDetalhes(null); }}>
          <div style={cardStyle} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#101826' }}>
                {modalDia.data.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              <button onClick={() => { setModalDia(null); setAgDetalhes(null); }} style={btnClose}><X size={16} /></button>
            </div>
            {agDetalhes ? renderDetalhes(agDetalhes) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '60vh', overflowY: 'auto' }}>
                {modalDia.lista.map(ag => {
                  const cor = corStatus(ag.status);
                  return (
                    <div
                      key={ag.id}
                      onClick={() => setAgDetalhes(ag)}
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
                        {new Date(ag.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · {ag.usuarios?.nome ?? '—'}{ag.usuarios?.especialidade ? ` (${ag.usuarios.especialidade})` : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal detalhes (timeline view) */}
      {agDetalhes && !modalDia && (
        <div style={overlayStyle} onClick={() => setAgDetalhes(null)}>
          <div style={cardStyle} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#101826' }}>Detalhes</h3>
              <button onClick={() => setAgDetalhes(null)} style={btnClose}><X size={16} /></button>
            </div>
            {renderDetalhes(agDetalhes)}
          </div>
        </div>
      )}

      {/* Modal form */}
      {modalForm.aberto && (
        <AgendamentoFormModal
          agendamento={modalForm.agendamento}
          lockProfissional={isProfissional}
          profissionalAtual={usuario ? {
            id: usuario.id,
            nome: usuario.nome,
            especialidade: usuario.especialidade,
          } : undefined}
          onClose={() => setModalForm({ aberto: false })}
          onSalvo={(avisos) => {
            setModalForm({ aberto: false });
            setAgDetalhes(null);
            setModalDia(null);
            fetchAgendamentos();
            if (avisos.length > 0) {
              void alert({
                title: 'Agendamento salvo com aviso',
                message: avisos.join(' '),
                tone: 'warning',
              });
            }
          }}
        />
      )}
    </div>
  );
}

const btnNav: React.CSSProperties = {
  background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(0,0,0,0.1)',
  borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center',
  justifyContent: 'center', padding: '6px', color: '#101826',
};

const btnHoje: React.CSSProperties = {
  background: 'transparent', border: '1px solid rgba(0,0,0,0.15)',
  borderRadius: '8px', cursor: 'pointer', padding: '5px 12px',
  fontSize: '12px', fontWeight: 600, color: '#475569', fontFamily: 'inherit',
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 500,
  background: 'rgba(0,0,0,0.3)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const cardStyle: React.CSSProperties = {
  background: '#fff', borderRadius: '20px',
  padding: '1.5rem', width: '100%', maxWidth: '440px',
  maxHeight: '80vh', overflowY: 'auto',
  boxShadow: '0 20px 44px rgba(15,23,42,0.18)',
};

const btnClose: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer', color: '#667b94',
  display: 'flex', alignItems: 'center',
};
