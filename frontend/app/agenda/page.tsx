'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import {
  Agendamento,
  listarAgendamentos,
  meusAgendamentos,
  editarAgendamento,
  excluirAgendamento,
} from '@/lib/agendamentos';
import { getUsuario } from '@/lib/auth';
import { mensagemDeErro } from '@/lib/api';
import AgendamentoFormModal from './components/AgendamentoFormModal';
import DetalhesAgendamento from './components/DetalhesAgendamento';
import LegendaStatus from './components/LegendaStatus';
import ModalDetalhes from './components/ModalDetalhes';
import ModalDia from './components/ModalDia';
import VisaoLinhaDoTempo from './components/VisaoLinhaDoTempo';
import VisaoMes from './components/VisaoMes';
import { btnHoje, btnNav } from './components/estilos';
import {
  agruparPorDia, calcularRange, formatarTituloView, isoLocal, moverCursor,
  obterTituloAgendamento, type View,
} from './_lib/calendario';
import { useDialog } from '@/components/DialogProvider';
import Button from '@/components/Button';

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
  const [erroCarga, setErroCarga] = useState<string | null>(null);

  const [modalForm, setModalForm] = useState<{ aberto: boolean; agendamento?: Agendamento }>({ aberto: false });
  const [modalDia, setModalDia] = useState<{ data: Date; lista: Agendamento[] } | null>(null);
  const [agDetalhes, setAgDetalhes] = useState<Agendamento | null>(null);

  const fetchAgendamentos = useCallback(async () => {
    // Aguarda o usuário para saber se deve buscar só a agenda própria (evita 403 para profissionais).
    if (!usuario) return;
    setCarregando(true);
    setErroCarga(null);
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
    } catch (err: unknown) {
      setErroCarga(mensagemDeErro(err, 'Não foi possível carregar os agendamentos.'));
    } finally {
      setCarregando(false);
    }
  }, [usuario, isProfissional, view, cursor]);

  useEffect(() => { fetchAgendamentos(); }, [fetchAgendamentos]);

  const algumModalAberto = !!modalDia || !!agDetalhes;
  useEffect(() => {
    if (!algumModalAberto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setModalDia(null); setAgDetalhes(null); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [algumModalAberto]);

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
    try {
      await editarAgendamento(ag.id, { status: 'CANCELADO' });
    } catch (err: unknown) {
      await alert({ message: mensagemDeErro(err, 'Não foi possível cancelar o agendamento.'), tone: 'error' });
      return;
    }
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
    } catch (err: unknown) {
      await alert({ message: mensagemDeErro(err, 'Não foi possível excluir o agendamento.'), tone: 'error' });
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

  function abrirEdicao(ag: Agendamento) {
    setModalDia(null);
    setAgDetalhes(null);
    setModalForm({ aberto: true, agendamento: ag });
  }

  const renderDetalhes = (ag: Agendamento) => (
    <DetalhesAgendamento
      ag={ag}
      isProfissional={isProfissional}
      onEditar={abrirEdicao}
      handleCancelar={handleCancelar}
      handleExcluir={handleExcluir}
    />
  );

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
            <button type="button" aria-label="Período anterior" onClick={() => setCursor(moverCursor(view, cursor, -1))} style={btnNav}><ChevronLeft size={16} /></button>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#101826', minWidth: '200px', textAlign: 'center' }}>
              {formatarTituloView(view, cursor)}
            </span>
            <button type="button" aria-label="Próximo período" onClick={() => setCursor(moverCursor(view, cursor, 1))} style={btnNav}><ChevronRight size={16} /></button>
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

        {erroCarga && (
          <div role="alert" style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '10px 14px', color: '#dc2626', fontSize: '13px', marginBottom: '12px' }}>
            {erroCarga}
          </div>
        )}

        {carregando ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#667b94', fontSize: '14px' }}>Carregando...</div>
        ) : view === 'month' ? (
          <VisaoMes cursor={cursor} hoje={hoje} porDia={porDia} setModalDia={setModalDia} />
        ) : (
          <VisaoLinhaDoTempo view={view} cursor={cursor} hoje={hoje} porDia={porDia} setAgDetalhes={setAgDetalhes} />
        )}
      </div>

      <LegendaStatus />

      {/* Modal lista do dia */}
      {modalDia && (
        <ModalDia modalDia={modalDia} detalhes={agDetalhes ? renderDetalhes(agDetalhes) : null} setModalDia={setModalDia} setAgDetalhes={setAgDetalhes} />
      )}

      {/* Modal detalhes (timeline view) */}
      {agDetalhes && !modalDia && (
        <ModalDetalhes setAgDetalhes={setAgDetalhes}>{renderDetalhes(agDetalhes)}</ModalDetalhes>
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
