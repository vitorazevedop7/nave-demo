"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { fetchAuth } from "@/lib/auth";
import { StatusBadge } from "@/app/components/StatusBadge";
import { API_URL } from "@/lib/api";
import { formatarDataPura, formatarTimestamp } from "@/lib/date";
import Button from "@/components/Button";

interface Queixa {
  id: string;
  queixa_principal: string;
  queixa_secundaria?: string;
  sintomas?: string;
  tipo_violencia?: string;
  observacoes?: string;
}

interface Encaminhamento {
  id: string;
  especialidade: string;
  status: string;
  criado_em: string;
}

interface Beneficiaria {
  id: string;
  nome: string;
  cpf: string | null;
  tipo: string | null;
  status: string | null;
  data_nascimento: string | null;
  telefone: string | null;
  endereco: string | null;
  estado_civil: string | null;
  escolaridade: string | null;
  raca: string | null;
  ocupacao: string | null;
  empregada: boolean | null;
  responsavel_id: string | null;
}

interface Triagem {
  id: string;
  data_triagem: string;
  criado_em: string;
  beneficiarias: Beneficiaria;
  usuarios: { id: string; nome: string };
  queixas: Queixa[];
  encaminhamentos: Encaminhamento[];
}

// ── Badge maps ──────────────────────────────────────────────────────────────

const tipoBadge: Record<string, { background: string; color: string }> = {
  ADULTA:      { background: "#FDE8E4", color: "#C05A48" },
  CRIANCA:     { background: "#D4EDD4", color: "#3D7845" },
  ADOLESCENTE: { background: "#D4EDD4", color: "#3D7845" },
};


// ── Helpers ──────────────────────────────────────────────────────────────────

const FORMATO_LONGO: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "long",
  year: "numeric",
};

const FORMATO_CURTO: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "short",
  year: "numeric",
};

function labelMap(key: string): string {
  const map: Record<string, string> = {
    SEM_ESCOLARIDADE: "Sem escolaridade",
    FUNDAMENTAL: "Fundamental",
    MEDIO: "Médio",
    SUPERIOR: "Superior",
    POS_GRADUACAO: "Pós-graduação",
    SOLTEIRA: "Solteira",
    CASADA: "Casada",
    DIVORCIADA: "Divorciada",
    VIUVA: "Viúva",
    UNIAO_ESTAVEL: "União estável",
    BRANCA: "Branca",
    PRETA: "Preta",
    PARDA: "Parda",
    AMARELA: "Amarela",
    INDIGENA: "Indígena",
  };
  return map[key] ?? key;
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.92)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  border: "0.5px solid rgba(220, 200, 190, 0.45)",
  borderRadius: "16px",
  overflow: "hidden",
  boxShadow: "0 2px 12px rgba(224, 122, 110, 0.05)",
};

const cardHeaderStyle: React.CSSProperties = {
  padding: "14px 20px",
  borderBottom: "0.5px solid #e0dbd2",
  fontSize: "13px",
  fontWeight: 700,
  color: "#2B1F14",
};

const fieldLabelStyle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  color: "#7a7a70",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: "3px",
};

const fieldValueStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#2B1F14",
  fontWeight: 500,
};

// ── Component ────────────────────────────────────────────────────────────────

export default function DetalheTriagem() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [triagem, setTriagem] = useState<Triagem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responsavel, setResponsavel] = useState<{ id: string; nome: string; cpf: string | null } | null>(null);
  const [dependentes, setDependentes] = useState<{ id: string; nome: string; tipo: string }[]>([]);

  useEffect(() => {
    fetchAuth(`${API_URL}/triagens/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`);
        return res.json();
      })
      .then(async (data: Triagem) => {
        setTriagem(data);

        const b = data.beneficiarias;
        const [resResp, resDep] = await Promise.all([
          b.responsavel_id
            ? fetchAuth(`${API_URL}/beneficiarias/${b.responsavel_id}`)
            : Promise.resolve(null),
          fetchAuth(`${API_URL}/beneficiarias?responsavel_id=${b.id}`),
        ]);

        if (resResp?.ok) {
          const resp = await resResp.json();
          setResponsavel({ id: resp.id, nome: resp.nome, cpf: resp.cpf ?? null });
        }
        const deps = await resDep.json();
        setDependentes(Array.isArray(deps) ? deps.map((d: any) => ({ id: d.id, nome: d.nome, tipo: d.tipo ?? 'ADULTA' })) : []);

        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: "36px 32px", minHeight: "100vh" }}>
        <div style={{ padding: "80px 20px", textAlign: "center" }}>
          <div
            style={{
              width: "28px", height: "28px", borderRadius: "50%",
              border: "2.5px solid #e0dbd2", borderTopColor: "#E07A6E",
              animation: "spin 0.8s linear infinite", margin: "0 auto 12px",
            }}
          />
          <p style={{ fontSize: "13px", color: "#6a6660" }}>Carregando triagem...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error || !triagem) {
    return (
      <div style={{ padding: "36px 32px", minHeight: "100vh" }}>
        <div style={{ padding: "80px 20px", textAlign: "center" }}>
          <p style={{ fontSize: "13px", color: "#e07a6e", fontWeight: 600 }}>Erro ao carregar triagem</p>
          <p style={{ fontSize: "12px", color: "#9B8E84", marginTop: "4px" }}>{error}</p>
        </div>
      </div>
    );
  }

  const b = triagem.beneficiarias ?? {} as Beneficiaria;
  const queixa = (triagem.queixas ?? [])[0] ?? null;
  const encaminhamentos = triagem.encaminhamentos ?? [];
  const tipoBadgeStyle = tipoBadge[b.tipo ?? "ADULTA"] ?? tipoBadge.ADULTA;

  const camposBenef: { label: string; value: string | null | undefined }[] = [
    { label: "CPF",               value: b.cpf },
    { label: "Data de nascimento", value: formatarDataPura(b.data_nascimento, FORMATO_CURTO) || null },
    { label: "Telefone",          value: b.telefone },
    { label: "Endereço",          value: b.endereco },
    { label: "Raça / Cor",        value: b.raca ? labelMap(b.raca) : null },
    { label: "Estado civil",      value: b.estado_civil ? labelMap(b.estado_civil) : null },
    { label: "Escolaridade",      value: b.escolaridade ? labelMap(b.escolaridade) : null },
    { label: "Ocupação",          value: b.ocupacao },
    {
      label: "Situação de emprego",
      value: b.empregada === true ? "Empregada" : b.empregada === false ? "Desempregada" : null,
    },
  ];

  return (
    <div style={{ padding: "36px 32px", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "28px" }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/triagens")}
          style={{ padding: "8px 14px", fontSize: "13px", flexShrink: 0, marginTop: "2px" }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Voltar
        </Button>
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#2B1F14", margin: 0 }}>
            Detalhe da Triagem
          </h1>
          <p style={{ fontSize: "13px", color: "#6B5E54", marginTop: "4px" }}>
            {formatarTimestamp(triagem.data_triagem, FORMATO_LONGO)} · Triadora: {triagem.usuarios?.nome ?? "—"}
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: "20px", alignItems: "start" }}>

        {/* ── Left column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Card: Dados da Beneficiária */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>Dados da Beneficiária</div>
            <div style={{ padding: "20px" }}>

              {/* Nome + badges */}
              <p style={{ fontSize: "1.15rem", fontWeight: 700, color: "#2B1F14", margin: "0 0 10px" }}>
                {b.nome ?? "—"}
              </p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
                <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: "9999px", fontSize: "11px", fontWeight: 700, ...tipoBadgeStyle }}>
                  {b.tipo ? b.tipo.charAt(0) + b.tipo.slice(1).toLowerCase() : "—"}
                </span>
                <StatusBadge status={b.status ?? "ATIVA"} />
              </div>

              {/* Fields grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {camposBenef.map(({ label, value }) => (
                  <div key={label}>
                    <p style={fieldLabelStyle}>{label}</p>
                    <p style={fieldValueStyle}>{value || "—"}</p>
                  </div>
                ))}
              </div>

              {/* Vínculo Familiar */}
              {(responsavel || dependentes.length > 0) && (
                <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "0.5px solid #e0dbd2" }}>
                  <p style={{ ...fieldLabelStyle, marginBottom: "10px" }}>Vínculo Familiar</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {responsavel && (
                      <div>
                        <p style={fieldLabelStyle}>Responsável</p>
                        <p style={{ ...fieldValueStyle, color: "#3D7845", fontWeight: 600, marginBottom: "2px" }}>
                          {responsavel.nome}
                        </p>
                        {responsavel.cpf && (
                          <p style={{ fontSize: "11px", color: "#9B8E84", margin: 0 }}>
                            {responsavel.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                          </p>
                        )}
                      </div>
                    )}
                    {dependentes.length > 0 && (
                      <div>
                        <p style={fieldLabelStyle}>Dependentes</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
                          {dependentes.map((d) => {
                            const tipoCores: Record<string, { background: string; color: string }> = {
                              ADULTA:      { background: "#FDE8E4", color: "#C05A48" },
                              CRIANCA:     { background: "#D4EDD4", color: "#3D7845" },
                              ADOLESCENTE: { background: "#D4EDD4", color: "#3D7845" },
                            };
                            const cor = tipoCores[d.tipo] ?? tipoCores.ADULTA;
                            return (
                              <div key={d.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={fieldValueStyle}>{d.nome}</span>
                                <span style={{ padding: "2px 8px", borderRadius: "9999px", fontSize: "10px", fontWeight: 700, ...cor }}>
                                  {d.tipo.charAt(0) + d.tipo.slice(1).toLowerCase()}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card: Queixa Registrada */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>Queixa Registrada</div>
            <div style={{ padding: "20px" }}>
              {!queixa ? (
                <p style={{ fontSize: "13px", color: "#6a6660" }}>Nenhuma queixa registrada.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                  {/* Queixa principal em destaque */}
                  <div
                    style={{
                      padding: "14px 16px",
                      background: "#FDE8E4",
                      borderLeft: "3px solid #E07A6E",
                      borderRadius: "0 10px 10px 0",
                    }}
                  >
                    <p style={{ ...fieldLabelStyle, marginBottom: "6px" }}>Queixa principal</p>
                    <p style={{ fontSize: "13px", color: "#2B1F14", margin: 0, lineHeight: 1.6 }}>
                      {queixa.queixa_principal}
                    </p>
                  </div>

                  {/* Campos opcionais — só renderiza se preenchidos */}
                  {[
                    { label: "Queixa secundária", value: queixa.queixa_secundaria },
                    { label: "Sintomas",           value: queixa.sintomas },
                    { label: "Tipo de violência",  value: queixa.tipo_violencia },
                    { label: "Observações",        value: queixa.observacoes },
                  ]
                    .filter((f) => f.value?.trim())
                    .map(({ label, value }) => (
                      <div key={label}>
                        <p style={fieldLabelStyle}>{label}</p>
                        <p style={{ fontSize: "13px", color: "#2B1F14", margin: 0, lineHeight: 1.6 }}>{value}</p>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div>
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>Encaminhamentos</div>
            <div style={{ padding: "20px" }}>
              {encaminhamentos.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "flex-start" }}>
                  <StatusBadge status="PENDENTE" />
                  <p style={{ fontSize: "13px", color: "#9B8E84", margin: 0 }}>
                    Nenhum encaminhamento gerado.
                  </p>
                  <Button size="sm" onClick={() => router.push("/encaminhamentos")}>
                    Encaminhar
                  </Button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {encaminhamentos.map((enc) => {
                    return (
                      <div
                        key={enc.id}
                        style={{
                          padding: "12px 14px",
                          border: "0.5px solid #e0dbd2",
                          borderRadius: "10px",
                          background: "#faf9f6",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                          <p style={{ fontSize: "13px", fontWeight: 700, color: "#2B1F14", margin: 0 }}>
                            {enc.especialidade}
                          </p>
                          <StatusBadge status={enc.status} />
                        </div>
                        <p style={{ fontSize: "11px", color: "#9B8E84", margin: 0 }}>
                          {formatarTimestamp(enc.criado_em, FORMATO_CURTO)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
