"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchAuth } from "@/lib/auth";
import { StatusBadge } from "@/app/components/StatusBadge";
import { API_URL } from "@/lib/api";
import { formatarTimestamp } from "@/lib/date";
import Button from "@/components/Button";

interface Queixa {
  id: string;
  queixa_principal: string;
  queixa_secundaria?: string;
  tipo_violencia?: string;
}

interface Triagem {
  id: string;
  data_triagem: string;
  criado_em: string;
  beneficiarias: { id: string; nome: string; cpf: string | null; tipo: string | null };
  usuarios: { id: string; nome: string };
  queixas: Queixa[];
  encaminhamentos: { id: string }[];
}

const tipoBadge: Record<string, { background: string; color: string }> = {
  ADULTA:      { background: "#FDE8E4", color: "#C05A48" },
  CRIANCA:     { background: "#D4EDD4", color: "#3D7845" },
  ADOLESCENTE: { background: "#D4EDD4", color: "#3D7845" },
};

const avatarColors = [
  { background: "#D4EDD4", color: "#3D7845" },
  { background: "#FDE8E4", color: "#C05A48" },
  { background: "#FEF3E2", color: "#C47A1E" },
  { background: "#F4CFC9", color: "#C05A48" },
  { background: "#DFE9DF", color: "#3D7845" },
];

function getIniciais(nome: string): string {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

// `data_triagem` é um timestamp real — a conversão para o fuso local é correta.
function formatarData(iso: string): string {
  return formatarTimestamp(iso, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function Triagens() {
  const router = useRouter();
  const [triagens, setTriagens] = useState<Triagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchAuth(`${API_URL}/triagens`)
      .then((res) => {
        if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`);
        return res.json();
      })
      .then((data: Triagem[]) => {
        setTriagens(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const filtered = triagens.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.beneficiarias.nome.toLowerCase().includes(q) ||
      (t.beneficiarias.cpf ?? "").toLowerCase().includes(q) ||
      t.usuarios.nome.toLowerCase().includes(q)
    );
  });

  const totalPendentes   = triagens.filter((t) => (t.encaminhamentos ?? []).length === 0).length;
  const totalEncaminhadas = triagens.filter((t) => (t.encaminhamentos ?? []).length > 0).length;

  return (
    <div style={{ padding: "36px 32px", minHeight: "100vh" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "28px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#2B1F14", margin: 0 }}>
            Triagens
          </h1>
          <p style={{ fontSize: "13px", color: "#6B5E54", marginTop: "4px" }}>
            Cadastro de beneficiárias e registro de queixas
          </p>
        </div>
        <Button size="sm" onClick={() => router.push("/triagens/nova")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nova Triagem
        </Button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "20px" }}>
        {[
          { label: "Total de Triagens", value: triagens.length,     iconBg: "#D4EDD4", iconColor: "#3D7845" },
          { label: "Pendentes",         value: totalPendentes,      iconBg: "#FDE8E4", iconColor: "#C05A48" },
          { label: "Encaminhadas",      value: totalEncaminhadas,   iconBg: "#D4EDD4", iconColor: "#3D7845" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "rgba(255, 255, 255, 0.92)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border: "0.5px solid rgba(220, 200, 190, 0.45)",
              borderRadius: "16px",
              padding: "18px 20px",
              boxShadow: "0 2px 12px rgba(224, 122, 110, 0.05)",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div
              style={{
                width: "42px", height: "42px", borderRadius: "10px",
                background: s.iconBg, color: s.iconColor,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: "11px", color: "#6B5E54", fontWeight: 600, margin: 0 }}>{s.label}</p>
              <p style={{ fontSize: "1.6rem", fontWeight: 700, color: "#2B1F14", lineHeight: 1.1, marginTop: "2px" }}>
                {loading ? "—" : s.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div
        style={{
          background: "rgba(255, 255, 255, 0.92)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          border: "0.5px solid rgba(220, 200, 190, 0.45)",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 2px 12px rgba(224, 122, 110, 0.05)",
        }}
      >
        {/* Search */}
        <div style={{ padding: "16px 20px", borderBottom: "0.5px solid #e0dbd2" }}>
          <div style={{ position: "relative" }}>
            <svg
              style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#6a6660" }}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por nome, CPF ou triadora..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 34px",
                border: "0.5px solid #d6d0c4",
                borderRadius: "10px",
                fontSize: "13px",
                color: "#2B1F14",
                background: "#faf9f6",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <div
              style={{
                width: "28px", height: "28px", borderRadius: "50%",
                border: "2.5px solid #e0dbd2", borderTopColor: "#E07A6E",
                animation: "spin 0.8s linear infinite", margin: "0 auto 12px",
              }}
            />
            <p style={{ fontSize: "13px", color: "#6a6660" }}>Carregando triagens...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <p style={{ fontSize: "13px", color: "#e07a6e", fontWeight: 600 }}>Erro ao carregar dados</p>
            <p style={{ fontSize: "12px", color: "#9B8E84", marginTop: "4px" }}>{error}</p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "0.5px solid #e0dbd2" }}>
                {["BENEFICIÁRIA", "TIPO", "QUEIXA PRINCIPAL", "TRIADORA", "DATA", "STATUS", "AÇÕES"].map((col) => (
                  <th
                    key={col}
                    style={{
                      padding: "12px 20px", textAlign: "left", fontSize: "10px",
                      fontWeight: 700, color: "#9B8E84", letterSpacing: "0.06em",
                      textTransform: "uppercase", whiteSpace: "nowrap",
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "48px 20px", textAlign: "center", fontSize: "13px", color: "#6a6660" }}>
                    Nenhuma triagem encontrada.
                  </td>
                </tr>
              ) : (
                filtered.map((t, i) => {
                  const encaminhada = (t.encaminhamentos ?? []).length > 0;
                  const tipo = t.beneficiarias?.tipo ?? "ADULTA";
                  const badge = tipoBadge[tipo] ?? tipoBadge.ADULTA;
                  const queixaPrincipal = (t.queixas ?? [])[0]?.queixa_principal ?? "—";

                  return (
                    <tr
                      key={t.id}
                      style={{
                        borderBottom: i < filtered.length - 1 ? "0.5px solid #f0ece4" : "none",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#faf9f6")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* Beneficiária */}
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "34px", height: "34px", borderRadius: "50%",
                              background: avatarColors[i % avatarColors.length].background,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: "11px", fontWeight: 700, color: avatarColors[i % avatarColors.length].color, flexShrink: 0,
                            }}
                          >
                            {getIniciais(t.beneficiarias?.nome ?? "?")}
                          </div>
                          <div>
                            <p style={{ fontSize: "13px", fontWeight: 700, color: "#2B1F14", margin: 0 }}>
                              {t.beneficiarias?.nome ?? "—"}
                            </p>
                            <p style={{ fontSize: "11px", color: "#5a5a50", marginTop: "1px" }}>
                              {t.beneficiarias?.cpf ?? "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Tipo */}
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: "9999px", fontSize: "11px", fontWeight: 700, ...badge }}>
                          {tipo.charAt(0) + tipo.slice(1).toLowerCase()}
                        </span>
                      </td>

                      {/* Queixa principal */}
                      <td style={{ padding: "14px 20px", fontSize: "13px", color: "#2B1F14", maxWidth: "240px" }}>
                        <span
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          } as React.CSSProperties}
                        >
                          {queixaPrincipal}
                        </span>
                      </td>

                      {/* Triador */}
                      <td style={{ padding: "14px 20px", fontSize: "13px", color: "#4a4a42" }}>
                        {t.usuarios?.nome ?? "—"}
                      </td>

                      {/* Data */}
                      <td style={{ padding: "14px 20px", fontSize: "13px", color: "#6B5E54", whiteSpace: "nowrap" }}>
                        {formatarData(t.data_triagem)}
                      </td>

                      {/* Status */}
                      <td style={{ padding: "14px 20px" }}>
                        <StatusBadge status={encaminhada ? "ENCAMINHADO" : "PENDENTE"} />
                      </td>

                      {/* Ações */}
                      <td style={{ padding: "14px 20px" }}>
                        <button
                          onClick={() => router.push(`/triagens/${t.id}`)}
                          style={{
                            padding: "5px 12px", border: "0.5px solid #d6d0c4",
                            borderRadius: "8px", fontSize: "12px", fontWeight: 600,
                            color: "#6B5E54", background: "#f5f2eb", cursor: "pointer",
                            display: "flex", alignItems: "center", gap: "6px",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#ece7df")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "#f5f2eb")}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                          Ver
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}

        {/* Footer */}
        {!loading && !error && (
          <div style={{ padding: "12px 20px", borderTop: "0.5px solid #e0dbd2", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "12px", color: "#6a6660" }}>
              {filtered.length} triage{filtered.length !== 1 ? "ns" : "m"} encontrada{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
