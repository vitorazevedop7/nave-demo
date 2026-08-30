'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { fetchAuth } from '@/lib/auth';
import { API_URL } from '@/lib/api';
import Button from '@/components/Button';
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
    listarProfissionais().then(setProfissionais).catch(() => {});
  }, [lockProfissional]);

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
        if (res.ok) setBeneficiarias(await res.json());
      } catch { /* ignorar */ }
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

  return (
    <div style={{
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
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#101826' }}>
              {editando ? 'Editar agendamento' : 'Novo agendamento'}
            </h2>
            {prefill && (
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#7c3aed', fontWeight: 600 }}>
                Vinculando encaminhamento — {prefill.especialidade ?? 'Encaminhamento'}
              </p>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#667b94' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Beneficiária */}
          <div>
            <label style={labelStyle}>Beneficiária *</label>
            {editando || prefill ? (
              <input style={inputStyle} value={prefill ? prefill.beneficiaria_nome : nomeBenef} disabled />
            ) : (
              <>
                <input
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
                      <div
                        key={b.id}
                        onClick={() => { setBeneficiariaId(b.id); setBuscaBenef(b.nome); setBeneficiarias([]); }}
                        style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #f1f5f9' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        {b.nome}{b.cpf ? ` — ${b.cpf}` : ''}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Profissional */}
          <div>
            <label style={labelStyle}>Profissional *</label>
            {lockProfissional ? (
              <input
                style={inputStyle}
                value={agendamento?.usuarios?.nome ?? profissionalAtual?.nome ?? ''}
                disabled
              />
            ) : (
              <select style={inputStyle} value={profissionalId} onChange={e => setProfissionalId(e.target.value)} required>
                <option value="">Selecione...</option>
                {profissionais.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nome}{p.especialidade ? ` — ${p.especialidade}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Data e Hora */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Data *</label>
              <input type="date" style={inputStyle} value={dataStr} onChange={e => setDataStr(e.target.value)} required />
            </div>
            <div>
              <label style={labelStyle}>Hora *</label>
              <input type="time" style={inputStyle} value={horaStr} onChange={e => setHoraStr(e.target.value)} required />
            </div>
          </div>

          {/* Status */}
          <div>
            <label style={labelStyle}>Status</label>
            <select style={inputStyle} value={status} onChange={e => setStatus(e.target.value)}>
              {STATUS_AGENDAMENTO.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Observações */}
          <div>
            <label style={labelStyle}>Observações</label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }}
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              placeholder="Informações adicionais..."
            />
          </div>

          {erro && (
            <div style={{
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
    </div>
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
