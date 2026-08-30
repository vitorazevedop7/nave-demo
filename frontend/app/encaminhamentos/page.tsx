'use client';

import { useEffect, useState } from 'react';
import { fetchAuth } from '@/lib/auth';
import { API_URL } from '@/lib/api';
import { formatarTimestamp } from '@/lib/date';

interface Beneficiario {
  id: string;
  nome: string;
  cpf: string;
  categoria: string;
}

interface TriagemPendente {
  id: string;
  dataTriagem: string;
  queixa: string | null;
  triador: string;
  beneficiario: Beneficiario;
}

interface Encaminhamento {
  id: string;
  triagemId: string;
  especialidade: string;
  status: string;
  criadoEm: string;
  beneficiario: Beneficiario;
  queixa: string | null;
}

const ESPECIALIDADES = [
  { value: 'PSICOLOGIA', label: 'Psicologia' },
  { value: 'ASSISTENCIA_SOCIAL', label: 'Assistência Social' },
  { value: 'ACUPUNTURA', label: 'Acupuntura' },
  { value: 'FISIOTERAPIA', label: 'Fisioterapia' },
  { value: 'FEPAD', label: 'FEPAD' },
];

import { StatusBadge } from '@/app/components/StatusBadge';
import AgendamentoFormModal from '@/app/agenda/components/AgendamentoFormModal';
import Button from '@/components/Button';

// `dataTriagem` e `criadoEm` são timestamps reais — a conversão para o fuso local é correta.
function formatarData(iso: string): string {
  return formatarTimestamp(iso, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function Encaminhamentos() {
  const [pendentes, setPendentes] = useState<TriagemPendente[]>([]);
  const [historico, setHistorico] = useState<Encaminhamento[]>([]);
  const [selecionada, setSelecionada] = useState<TriagemPendente | null>(null);
  const [especialidadesSelecionadas, setEspecialidadesSelecionadas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  interface AgendarPrefill {
    beneficiaria_id: string;
    beneficiaria_nome: string;
    encaminhamento_id: string;
    especialidade: string;
  }
  const [agendarModal, setAgendarModal] = useState<AgendarPrefill | null>(null);

  const carregarDados = async () => {
    setLoading(true);
    setErro(null);
    try {
      const [resPendentes, resHistorico] = await Promise.all([
        fetchAuth(`${API_URL}/encaminhamentos/pendentes`),
        fetchAuth(`${API_URL}/encaminhamentos/historico`),
      ]);
      if (!resPendentes.ok || !resHistorico.ok) {
        throw new Error('Não foi possível carregar os dados.');
      }
      const [dadosPendentes, dadosHistorico] = await Promise.all([
        resPendentes.json() as Promise<TriagemPendente[]>,
        resHistorico.json() as Promise<Encaminhamento[]>,
      ]);
      setPendentes(dadosPendentes);
      setHistorico(dadosHistorico);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void carregarDados();
  }, []);

  const toggleEspecialidade = (value: string) => {
    setEspecialidadesSelecionadas((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const confirmar = async () => {
    if (!selecionada || especialidadesSelecionadas.length === 0) return;
    setSalvando(true);
    setErro(null);
    try {
      await Promise.all(
        especialidadesSelecionadas.map((especialidade) =>
          fetchAuth(`${API_URL}/encaminhamentos`, {
            method: 'POST',
            body: JSON.stringify({ triagemId: selecionada.id, especialidade }),
          }).then((res) => {
            if (!res.ok) {
              return res.json().then((data: { message?: string }) => {
                throw new Error(data.message ?? `Erro ao encaminhar para ${especialidade}`);
              });
            }
          }),
        ),
      );
      await carregarDados();
      setSelecionada(null);
      setEspecialidadesSelecionadas([]);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao confirmar encaminhamento.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', padding: '32px' }}>
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#2B1F14', margin: 0 }}>
            Encaminhamentos
          </h1>
          <p style={{ fontSize: '13px', color: '#6B5E54', marginTop: '4px' }}>
            Encaminhe beneficiárias para as especialidades adequadas
          </p>
        </div>

        {/* Topo — duas colunas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          {/* Coluna esquerda — Triagens Pendentes */}
          <div
            style={{
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '0.5px solid rgba(220,200,190,0.45)',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(224,122,110,0.05)',
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '0.5px solid #e0dbd2' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#2B1F14', margin: 0 }}>
                Triagens Pendentes
              </h3>
            </div>

            {loading ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: '#9a9a8e' }}>Carregando...</p>
              </div>
            ) : pendentes.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: '#9a9a8e' }}>Nenhuma triagem pendente.</p>
              </div>
            ) : (
              <div style={{ maxHeight: '480px', overflowY: 'auto' }}>
                {pendentes.map((triagem, i) => {
                  const isSelected = selecionada?.id === triagem.id;
                  return (
                    <div
                      key={triagem.id}
                      onClick={() => {
                        setSelecionada(triagem);
                        setEspecialidadesSelecionadas([]);
                        setErro(null);
                      }}
                      style={{
                        padding: '16px 20px',
                        cursor: 'pointer',
                        borderBottom: i < pendentes.length - 1 ? '0.5px solid #f0ece4' : 'none',
                        borderLeft: isSelected ? '3px solid #E07A6E' : '3px solid transparent',
                        background: isSelected ? '#FDE8E4' : 'transparent',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#faf9f6'; }}
                      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <p style={{ fontSize: '14px', fontWeight: 700, color: '#2B1F14', margin: '0 0 2px' }}>
                        {triagem.beneficiario.nome}
                      </p>
                      <p style={{ fontSize: '11px', color: '#7a7a70', margin: '0 0 8px' }}>
                        CPF: {triagem.beneficiario.cpf}
                      </p>
                      {triagem.queixa && (
                        <p
                          style={{
                            fontSize: '12px',
                            color: '#6B5E54',
                            margin: '0 0 8px',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {triagem.queixa}
                        </p>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11px', color: '#9a9a8e' }}>
                          {formatarData(triagem.dataTriagem)}
                        </span>
                        <span style={{ fontSize: '11px', color: '#9a9a8e' }}>
                          {triagem.triador}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Coluna direita — Encaminhar */}
          <div
            style={{
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '0.5px solid rgba(220,200,190,0.45)',
              borderRadius: '16px',
              boxShadow: '0 2px 12px rgba(224,122,110,0.05)',
            }}
          >
            {!selecionada ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '48px 24px', textAlign: 'center' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: '#FDE8E4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '14px',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E07A6E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </div>
                <p style={{ fontSize: '13px', color: '#7a7a70' }}>
                  Selecione uma triagem ao lado para encaminhar
                </p>
              </div>
            ) : (
              <div style={{ padding: '20px' }}>
                {/* Nome da beneficiária */}
                <p style={{ fontSize: '16px', fontWeight: 700, color: '#2B1F14', margin: '0 0 12px' }}>
                  {selecionada.beneficiario.nome}
                </p>

                {/* Queixa */}
                {selecionada.queixa && (
                  <div
                    style={{
                      padding: '12px 14px',
                      borderLeft: '3px solid #E07A6E',
                      background: '#FDE8E4',
                      borderRadius: '0 10px 10px 0',
                      marginBottom: '20px',
                    }}
                  >
                    <p style={{ fontSize: '10px', fontWeight: 700, color: '#C05A48', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>
                      Queixa Principal
                    </p>
                    <p style={{ fontSize: '13px', color: '#3a3a35', margin: 0 }}>{selecionada.queixa}</p>
                  </div>
                )}

                {/* Especialidades */}
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#2B1F14', margin: '0 0 12px' }}>
                  Selecione as especialidades:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                  {ESPECIALIDADES.map((esp) => {
                    const checked = especialidadesSelecionadas.includes(esp.value);
                    return (
                      <label
                        key={esp.value}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 14px',
                          border: checked ? '0.5px solid #E07A6E' : '0.5px solid #d6d0c4',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          background: checked ? '#FDE8E4' : '#faf9f6',
                          transition: 'all 0.15s',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleEspecialidade(esp.value)}
                          style={{ accentColor: '#E07A6E', width: '15px', height: '15px' }}
                        />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#3a3a35' }}>
                          {esp.label}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {/* Erro */}
                {erro && (
                  <div style={{ marginBottom: '14px', padding: '10px 14px', borderRadius: '10px', background: '#fdf0ef', border: '1px solid #e07a6e', color: '#c05a2a', fontSize: '13px' }}>
                    {erro}
                  </div>
                )}

                {/* Botão */}
                <Button
                  fullWidth
                  size="sm"
                  onClick={() => void confirmar()}
                  disabled={especialidadesSelecionadas.length === 0 || salvando}
                  style={{ padding: '11px' }}
                >
                  {salvando ? 'Salvando...' : 'Confirmar Encaminhamento'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Erro global */}
        {erro && !selecionada && (
          <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '10px', background: '#fdf0ef', border: '1px solid #e07a6e', color: '#c05a2a', fontSize: '13px' }}>
            {erro}
          </div>
        )}

        {/* Histórico de Encaminhamentos */}
        <div
          style={{
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '0.5px solid rgba(220,200,190,0.45)',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 2px 12px rgba(224,122,110,0.05)',
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '0.5px solid #e0dbd2' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#2B1F14', margin: 0 }}>
              Histórico de Encaminhamentos
            </h3>
          </div>

          {loading ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: '#9a9a8e' }}>Carregando...</p>
            </div>
          ) : historico.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: '#9a9a8e' }}>Nenhum encaminhamento registrado.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '0.5px solid #e0dbd2' }}>
                    {['BENEFICIÁRIA', 'ESPECIALIDADE', 'STATUS', 'DATA', 'AÇÃO'].map((col) => (
                      <th
                        key={col}
                        style={{
                          padding: '10px 20px',
                          textAlign: 'left',
                          fontSize: '10px',
                          fontWeight: 700,
                          color: '#b8b4aa',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {historico.map((enc, i) => {
                    return (
                      <tr
                        key={enc.id}
                        style={{ borderBottom: i < historico.length - 1 ? '0.5px solid #f0ece4' : 'none' }}
                      >
                        <td style={{ padding: '14px 20px' }}>
                          <p style={{ fontSize: '13px', fontWeight: 700, color: '#2B1F14', margin: '0 0 2px' }}>
                            {enc.beneficiario.nome}
                          </p>
                          <p style={{ fontSize: '11px', color: '#7a7a70', margin: 0 }}>
                            CPF: {enc.beneficiario.cpf}
                          </p>
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: '13px', color: '#3a3a35' }}>
                          {ESPECIALIDADES.find((e) => e.value === enc.especialidade)?.label ?? enc.especialidade}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <StatusBadge status={enc.status} />
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: '13px', color: '#3a3a35' }}>
                          {formatarData(enc.criadoEm)}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          {enc.status === 'PENDENTE' && (
                            <Button
                              size="sm"
                              onClick={() => setAgendarModal({
                                beneficiaria_id: enc.beneficiario.id,
                                beneficiaria_nome: enc.beneficiario.nome,
                                encaminhamento_id: enc.id,
                                especialidade: ESPECIALIDADES.find((e) => e.value === enc.especialidade)?.label ?? enc.especialidade,
                              })}
                              style={{ padding: '6px 14px', fontSize: '12px' }}
                            >
                              Agendar
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {agendarModal && (
        <AgendamentoFormModal
          prefill={agendarModal}
          onClose={() => setAgendarModal(null)}
          onSalvo={() => {
            setAgendarModal(null);
            void carregarDados();
          }}
        />
      )}
    </div>
  );
}
