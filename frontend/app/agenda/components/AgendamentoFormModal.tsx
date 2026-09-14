'use client';

import { useState, useEffect, useId } from 'react';
import { X } from 'lucide-react';
import { fetchAuth } from '@/lib/auth';
import { API_URL, extrairMensagemErro, mensagemDeErro } from '@/lib/api';
import Button from '@/components/Button';
import { formatCpf } from '@/lib/formatters';
import { nomeEspecialidade } from '@/lib/visibilidade';
import { createPortal } from 'react-dom';
import {
  Agendamento,
  Profissional,
  STATUS_AGENDAMENTO,
  criarAgendamento,
  editarAgendamento,
  listarProfissionais,
} from '@/lib/agendamentos';

interface Beneficiaria {
  id: string;
  nome: string;
  cpf: string | null;
}

interface Prefill {
  beneficiaria_id: string;
  beneficiaria_nome: string;
  encaminhamento_id: string;
  especialidade?: string;
}

interface Props {
  agendamento?: Agendamento;
  prefill?: Prefill;
  lockProfissional?: boolean;
  profissionalAtual?: Profissional;
  onClose: () => void;
  onSalvo: (avisos: string[]) => void;
}

export default function AgendamentoFormModal({ agendamento, prefill, lockProfissional, profissionalAtual, onClose, onSalvo }: Props) {
  const editando = !!agendamento;
  const uid = useId();
  const ids = {
    titulo: `${uid}-titulo`,
    benef: `${uid}-benef`,
    prof: `${uid}-prof`,
    data: `${uid}-data`,
    hora: `${uid}-hora`,
    status: `${uid}-status`,
    obs: `${uid}-obs`,
  };

  const [beneficiarias, setBeneficiarias] = useState<Beneficiaria[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [buscaBenef, setBuscaBenef] = useState(prefill?.beneficiaria_nome ?? '');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const [encaminhamentoId] = useState(prefill?.encaminhamento_id ?? '');
  const [beneficiariaId, setBeneficiariaId] = useState(agendamento?.beneficiaria_id ?? prefill?.beneficiaria_id ?? '');
  const [profissionalId, setProfissionalId] = useState(
    agendamento?.profissional_id ?? profissionalAtual?.id ?? '',
  );
  const [dataStr, setDataStr] = useState(() => {
    if (!agendamento) return '';
    const d = new Date(agendamento.data_hora);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });
  const [horaStr, setHoraStr] = useState(() => {
    if (!agendamento) return '';
    const d = new Date(agendamento.data_hora);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  const [status, setStatus] = useState(agendamento?.status ?? 'AGENDADO');
  const [observacoes, setObservacoes] = useState(agendamento?.observacoes ?? '');

  useEffect(() => {
    if (lockProfissional) return;
    listarProfissionais()
      .then(setProfissionais)
      .catch((err: unknown) => setErro(mensagemDeErro(err, 'Não foi possível carregar os profissionais.')));
  }, [lockProfissional]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (lockProfissional && profissionalAtual) {
      setProfissionalId(profissionalAtual.id);
    }
  }, [lockProfissional, profissionalAtual]);

  useEffect(() => {
    if (buscaBenef.length < 2) { setBeneficiarias([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetchAuth(`${API_URL}/beneficiarias/buscar?busca=${encodeURIComponent(buscaBenef)}`);
        if (!res.ok) throw new Error(await extrairMensagemErro(res, 'Não foi possível buscar beneficiárias.'));
        setBeneficiarias(await res.json());
      } catch (err: unknown) {
        setBeneficiarias([]);
        setErro(mensagemDeErro(err, 'Não foi possível buscar beneficiárias.'));
      }
    }, 300);
    return () => clearTimeout(t);
  }, [buscaBenef]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    if (!beneficiariaId || !profissionalId || !dataStr || !horaStr) {
      setErro('Preencha todos os campos obrigatórios.');
      return;
    }
    setSalvando(true);
    try {
      let avisos: string[] = [];
      if (editando) {
        const orig = new Date(agendamento.data_hora);
        const pad = (n: number) => String(n).padStart(2, '0');
        const originalDataStr = `${orig.getFullYear()}-${pad(orig.getMonth() + 1)}-${pad(orig.getDate())}`;
        const originalHoraStr = `${pad(orig.getHours())}:${pad(orig.getMinutes())}`;
        const dataHoraAlterada = dataStr !== originalDataStr || horaStr !== originalHoraStr;

        const salvo = await editarAgendamento(agendamento.id, {
          beneficiaria_id: beneficiariaId,
          profissional_id: profissionalId,
          ...(dataHoraAlterada && { data_hora: new Date(`${dataStr}T${horaStr}:00`).toISOString() }),
          status,
          observacoes: observacoes || undefined,
        });
        avisos = salvo.avisos ?? [];
      } else {
        const salvo = await criarAgendamento({
          beneficiaria_id: beneficiariaId,
          profissional_id: profissionalId,
          encaminhamento_id: encaminhamentoId || undefined,
          data_hora: new Date(`${dataStr}T${horaStr}:00`).toISOString(),
          status,
          observacoes: observacoes || undefined,
        });
        avisos = salvo.avisos ?? [];
      }
      onSalvo(avisos);
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar agendamento.');
    } finally {
      setSalvando(false);
    }
  }

  const benef = beneficiarias.find(b => b.id === beneficiariaId);
  const nomeBenef = agendamento?.beneficiarias?.nome ?? benef?.nome ?? '';

  return createPortal(
    <div role="dialog" aria-modal="true" aria-labelledby={ids.titulo} style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.35)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: '#fff',
        borderRadius: '20px',
        padding: '2rem',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 44px rgba(15,23,42,0.18)',
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 id={ids.titulo} style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#101826' }}>
              {editando ? 'Editar agendamento' : 'Novo agendamento'}
            </h2>
            {prefill && (
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#7c3aed', fontWeight: 600 }}>
                Vinculando encaminhamento — {prefill.especialidade ?? 'Encaminhamento'}
              </p>
            )}
          </div>
          <button type="button" aria-label="Fechar" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#667b94' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Beneficiária */}
          <div>
            <label htmlFor={ids.benef} style={labelStyle}>Beneficiária *</label>
            {editando || prefill ? (
              <input id={ids.benef} style={inputStyle} value={prefill ? prefill.beneficiaria_nome : nomeBenef} disabled />
            ) : (
              <>
                <input
                  id={ids.benef}
                  style={inputStyle}
                  placeholder="Digite o nome para buscar..."
                  value={benef ? benef.nome : buscaBenef}
                  onChange={e => {
                    setBuscaBenef(e.target.value);
                    if (!e.target.value) setBeneficiariaId('');
                  }}
                />
                {beneficiarias.length > 0 && !beneficiariaId && (
                  <div style={{
                    border: '1px solid #e2e8f0', borderRadius: '8px',
                    background: '#fff', maxHeight: '140px', overflowY: 'auto',
                    marginTop: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}>
                    {beneficiarias.map(b => (
                      <button
                        type="button"
                        key={b.id}
                        onClick={() => { setBeneficiariaId(b.id); setBuscaBenef(b.nome); setBeneficiarias([]); }}
                        style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', borderBottom: '1px solid #f1f5f9', background: 'transparent', fontFamily: 'inherit', color: 'inherit', padding: '8px 12px', cursor: 'pointer', fontSize: '13px' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        {b.nome}{b.cpf ? ` — ${formatCpf(b.cpf)}` : ''}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Profissional */}
          <div>
            <label htmlFor={ids.prof} style={labelStyle}>Profissional *</label>
            {lockProfissional ? (
              <input
                id={ids.prof}
                style={inputStyle}
                value={agendamento?.usuarios?.nome ?? profissionalAtual?.nome ?? ''}
                disabled
              />
            ) : (
              <select id={ids.prof} style={inputStyle} value={profissionalId} onChange={e => setProfissionalId(e.target.value)} required>
                <option value="">Selecione...</option>
                {profissionais.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nome}{p.especialidade ? ` — ${nomeEspecialidade(p.especialidade)}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Data e Hora */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label htmlFor={ids.data} style={labelStyle}>Data *</label>
              <input id={ids.data} type="date" style={inputStyle} value={dataStr} onChange={e => setDataStr(e.target.value)} required />
            </div>
            <div>
              <label htmlFor={ids.hora} style={labelStyle}>Hora *</label>
              <input id={ids.hora} type="time" style={inputStyle} value={horaStr} onChange={e => setHoraStr(e.target.value)} required />
            </div>
          </div>

          {/* Status */}
          <div>
            <label htmlFor={ids.status} style={labelStyle}>Status</label>
            <select id={ids.status} style={inputStyle} value={status} onChange={e => setStatus(e.target.value)}>
              {STATUS_AGENDAMENTO.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Observações */}
          <div>
            <label htmlFor={ids.obs} style={labelStyle}>Observações</label>
            <textarea
              id={ids.obs}
              style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }}
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              placeholder="Informações adicionais..."
            />
          </div>

          {erro && (
            <div role="alert" style={{
              background: '#fef2f2', border: '1px solid #fca5a5',
              borderRadius: '8px', padding: '10px 14px',
              color: '#dc2626', fontSize: '13px',
            }}>
              {erro}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
            <Button type="submit" size="sm" disabled={salvando}>
              {salvando ? 'Salvando...' : editando ? 'Salvar' : 'Agendar'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: 600,
  color: '#475569', marginBottom: '4px',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: '8px',
  border: '1px solid #cbd5e1', fontSize: '13px', color: '#101826',
  background: '#f8fafc', boxSizing: 'border-box', fontFamily: 'inherit',
  outline: 'none',
};
