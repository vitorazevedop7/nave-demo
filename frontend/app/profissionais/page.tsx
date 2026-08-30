"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchAuth } from "@/lib/auth";
import { StatusBadge } from "@/app/components/StatusBadge";
import { API_URL } from "@/lib/api";
import { formatarTimestamp } from "@/lib/date";
import { useDialog } from "@/components/DialogProvider";
import Button from "@/components/Button";

interface PerfilUsuario {
  id: string;
  perfil: string;
}

interface Usuario {
  id: string;
  nome: string;
  email: string;
  especialidade: string | null;
  ativo: boolean;
  criado_em: string;
  perfis_usuario: PerfilUsuario[];
}

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

// `criado_em` é um timestamp real — a conversão para o fuso local é correta.
function formatarData(iso: string): string {
  return formatarTimestamp(iso, {
    month: "short",
    year: "numeric",
  });
}

function getPerfil(perfis: PerfilUsuario[]): string {
  if (!perfis || perfis.length === 0) return "—";
  return perfis.map((p) => p.perfil.charAt(0) + p.perfil.slice(1).toLowerCase()).join(", ");
}

export default function Profissionais() {
  const router = useRouter();
  const { confirm, alert } = useDialog();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  async function handleDelete(id: string, nome: string) {
    const ok = await confirm({
      title: "Excluir profissional",
      message: `Excluir permanentemente "${nome}"? Esta ação não pode ser desfeita.`,
      confirmLabel: "Excluir",
      variant: "danger",
    });
    if (!ok) return;
    try {
      const res = await fetchAuth(`${API_URL}/usuarios/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setUsuarios((prev) => prev.filter((u) => u.id !== id));
    } catch {
      await alert({ message: "Não foi possível excluir o profissional.", tone: "error" });
    }
  }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");

  useEffect(() => {
    fetchAuth(`${API_URL}/usuarios`)
      .then((res) => {
        if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`);
        return res.json();
      })
      .then((data: Usuario[]) => {
        setUsuarios(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const filtered = usuarios.filter((u) => {
    const matchSearch =
      u.nome.toLowerCase().includes(search.toLowerCase()) ||
      (u.especialidade ?? "").toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const status = u.ativo ? "Ativo" : "Inativo";
    const matchStatus = filterStatus === "Todos" || status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalAtivos = usuarios.filter((u) => u.ativo).length;
  const totalEspecialidades = new Set(
    usuarios.map((u) => u.especialidade).filter(Boolean)
  ).size;

  return (
    <div style={{ padding: "36px 32px", minHeight: "100vh" }}>
      {/* Page Header */}
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
            Profissionais
          </h1>
          <p style={{ fontSize: "13px", color: "#6B5E54", marginTop: "4px" }}>
            Gerencie os profissionais da ONG
          </p>
        </div>
        <Button size="sm" onClick={() => router.push("/usuarios/novo")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Novo Profissional
        </Button>
      </div>

      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        {[
          { label: "Total de Profissionais", value: usuarios.length, iconBg: "#D4EDD4", iconColor: "#3D7845" },
          { label: "Profissionais Ativos", value: totalAtivos, iconBg: "#D4EDD4", iconColor: "#3D7845" },
          { label: "Especialidades", value: totalEspecialidades, iconBg: "#FDE8E4", iconColor: "#E07A6E" },
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
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: s.iconBg,
                color: s.iconColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: "11px", color: "#6B5E54", fontWeight: 600, margin: 0 }}>
                {s.label}
              </p>
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
        {/* Filters */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "0.5px solid #e0dbd2",
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
            <svg
              style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#6a6660" }}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por nome, especialidade ou e-mail..."
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
              }}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: "8px 12px",
              border: "0.5px solid #d6d0c4",
              borderRadius: "10px",
              fontSize: "13px",
              color: "#2B1F14",
              background: "#faf9f6",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="Todos">Todos os status</option>
            <option value="Ativo">Ativo</option>
            <option value="Inativo">Inativo</option>
          </select>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                border: "2.5px solid #e0dbd2",
                borderTopColor: "#E07A6E",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 12px",
              }}
            />
            <p style={{ fontSize: "13px", color: "#6a6660" }}>Carregando profissionais...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <p style={{ fontSize: "13px", color: "#e07a6e", fontWeight: 600 }}>
              Erro ao carregar dados
            </p>
            <p style={{ fontSize: "12px", color: "#9B8E84", marginTop: "4px" }}>{error}</p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "0.5px solid #e0dbd2" }}>
                {["PROFISSIONAL", "ESPECIALIDADE", "E-MAIL", "PERFIL", "STATUS", "AÇÕES"].map((col) => (
                  <th
                    key={col}
                    style={{
                      padding: "12px 20px",
                      textAlign: "left",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#9B8E84",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
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
                  <td
                    colSpan={6}
                    style={{ padding: "48px 20px", textAlign: "center", fontSize: "13px", color: "#6a6660" }}
                  >
                    Nenhum profissional encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((u, i) => {
                  const status = u.ativo ? "Ativo" : "Inativo";
                  return (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: i < filtered.length - 1 ? "0.5px solid #f0ece4" : "none",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#faf9f6")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* Nome */}
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "34px",
                              height: "34px",
                              borderRadius: "50%",
                              background: avatarColors[i % avatarColors.length].background,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "11px",
                              fontWeight: 700,
                              color: avatarColors[i % avatarColors.length].color,
                              flexShrink: 0,
                            }}
                          >
                            {getIniciais(u.nome)}
                          </div>
                          <div>
                            <p style={{ fontSize: "13px", fontWeight: 700, color: "#2B1F14", margin: 0 }}>
                              {u.nome}
                            </p>
                            <p style={{ fontSize: "11px", color: "#5a5a50", marginTop: "1px" }}>
                              Desde {formatarData(u.criado_em)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Especialidade */}
                      <td style={{ padding: "14px 20px", fontSize: "13px", color: "#2B1F14" }}>
                        {u.especialidade ?? <span style={{ color: "#6a6660" }}>—</span>}
                      </td>

                      {/* Email */}
                      <td style={{ padding: "14px 20px", fontSize: "13px", color: "#4a4a42" }}>
                        {u.email}
                      </td>

                      {/* Perfil */}
                      <td style={{ padding: "14px 20px", fontSize: "13px", color: "#2B1F14" }}>
                        {getPerfil(u.perfis_usuario)}
                      </td>

                      {/* Status */}
                      <td style={{ padding: "14px 20px" }}>
                        <StatusBadge status={status} />
                      </td>

                      {/* Ações */}
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => router.push(`/usuarios/${u.id}/editar`)}
                            style={{ padding: "5px 12px", border: "0.5px solid #d6d0c4", borderRadius: "8px", fontSize: "12px", fontWeight: 600, color: "#6B5E54", background: "#f5f2eb", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#ece7df")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "#f5f2eb")}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                            Ver
                          </button>
                          <button
                            onClick={() => router.push(`/usuarios/${u.id}/editar`)}
                            style={{ padding: "5px 12px", border: "0.5px solid #d6d0c4", borderRadius: "8px", fontSize: "12px", fontWeight: 600, color: "#6B5E54", background: "#f5f2eb", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#ece7df")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "#f5f2eb")}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(u.id, u.nome)}
                            aria-label={`Excluir ${u.nome}`}
                            style={{ padding: "5px 10px", border: "0.5px solid #fca5a5", borderRadius: "8px", fontSize: "12px", fontWeight: 600, color: "#DC2626", background: "#fef2f2", cursor: "pointer", display: "flex", alignItems: "center" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#fee2e2")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "#fef2f2")}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6M14 11v6" />
                              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                          </button>
                        </div>
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
          <div
            style={{
              padding: "12px 20px",
              borderTop: "0.5px solid #e0dbd2",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: "12px", color: "#6a6660" }}>
              {filtered.length} profissiona{filtered.length !== 1 ? "is" : "l"} encontrado{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
