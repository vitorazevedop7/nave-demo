"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchAuth } from "@/lib/auth";
import { API_URL } from "@/lib/api";
import { formatarDataPura, paraInputDate, parseDataPura } from "@/lib/date";
import { useDialog } from "@/components/DialogProvider";
import Button from "@/components/Button";

interface Usuario {
  id: string;
  nome: string;
  especialidade: string | null;
  email: string;
}

interface BazarProfissional {
  id: string;
  usuarios: Usuario;
}

interface Bazar {
  id: string;
  nome: string;
  data: string;
  horario_inicio: string | null;
  horario_fim: string | null;
  local: string | null;
  descricao: string | null;
  total_arrecadado: number | null;
  observacoes: string | null;
  criado_em: string;
  usuarios: { id: string; nome: string } | null;
  bazar_profissionais: BazarProfissional[];
}

interface UserInfo {
  id: string;
  perfis?: string[];
}

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(value: number | null): string {
  if (!value) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function Bazares() {
  const router = useRouter();
  const { confirm, alert } = useDialog();
  const [bazares, setBazares] = useState<Bazar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [search, setSearch] = useState("");
  const [filterLocal, setFilterLocal] = useState("Todos");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    data: "",
    horario_inicio: "",
    horario_fim: "",
    local: "",
    descricao: "",
    observacoes: "",
    total_arrecadado: "",
    profissional_ids: [] as string[],
  });
  const [profissionais, setProfissionais] = useState<Usuario[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);

  const isGestora = userInfo?.perfis?.includes("GESTORA");
  const canEdit = isGestora;

  useEffect(() => {
    loadUserInfo();
    loadBazares();
    loadProfissionais();
  }, []);

  async function loadUserInfo() {
    try {
      const res = await fetchAuth(`${API_URL}/auth/me`);
      if (res.ok) {
        const data = await res.json();
        setUserInfo(data);
      }
    } catch (err) {
      console.error("Erro ao carregar informações do usuário", err);
    }
  }

  async function loadBazares() {
    try {
      const res = await fetchAuth(`${API_URL}/bazares`);
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const data = await res.json();
      setBazares(data);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  async function loadProfissionais() {
    try {
      const res = await fetchAuth(`${API_URL}/usuarios`);
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const data = await res.json();
      setProfissionais(data);
    } catch (err) {
      console.error("Erro ao carregar profissionais", err);
    }
  }

  function resetForm() {
    setFormData({
      nome: "",
      data: "",
      horario_inicio: "",
      horario_fim: "",
      local: "",
      descricao: "",
      observacoes: "",
      total_arrecadado: "",
      profissional_ids: [],
    });
    setEditingId(null);
    setShowForm(false);
  }

  function openNewBazar() {
    resetForm();
    setShowForm(true);
  }

  function extrairHora(iso: string | null): string {
    if (!iso) return "";
    if (iso.includes("T")) {
      return iso.split("T")[1].substring(0, 5);
    }
    return iso;
  }

  async function openEditBazar(bazar: Bazar) {
    setEditingId(bazar.id);
    setFormData({
      nome: bazar.nome,
      data: paraInputDate(bazar.data),
      horario_inicio: extrairHora(bazar.horario_inicio),
      horario_fim: extrairHora(bazar.horario_fim),
      local: bazar.local || "",
      descricao: bazar.descricao || "",
      observacoes: bazar.observacoes || "",
      total_arrecadado: bazar.total_arrecadado?.toString() || "",
      profissional_ids: bazar.bazar_profissionais.map((bp) => bp.usuarios.id),
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      const payload = {
        nome: formData.nome,
        data: formData.data,
        horario_inicio: formData.horario_inicio || undefined,
        horario_fim: formData.horario_fim || undefined,
        local: formData.local || undefined,
        descricao: formData.descricao || undefined,
        observacoes: formData.observacoes || undefined,
        total_arrecadado: formData.total_arrecadado
          ? parseFloat(formData.total_arrecadado.replace(",", "."))
          : undefined,
        profissional_ids: formData.profissional_ids,
      };

      if (editingId) {
        const res = await fetchAuth(`${API_URL}/bazares/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("Erro ao atualizar bazar");
        await alert({ message: "Bazar atualizado com sucesso!", tone: "success" });
      } else {
        const res = await fetchAuth(`${API_URL}/bazares`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("Erro ao criar bazar");
        await alert({ message: "Bazar criado com sucesso!", tone: "success" });
      }

      resetForm();
      loadBazares();
    } catch (err: any) {
      await alert({ message: err.message, tone: "error" });
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleDelete(id: string, nome: string) {
    const ok = await confirm({
      title: "Excluir bazar",
      message: `Excluir permanentemente "${nome}"? Esta ação não pode ser desfeita.`,
      confirmLabel: "Excluir",
      variant: "danger",
    });
    if (!ok) return;

    try {
      const res = await fetchAuth(`${API_URL}/bazares/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erro ao deletar");
      await alert({ message: "Bazar deletado com sucesso!", tone: "success" });
      loadBazares();
    } catch (err: any) {
      await alert({ message: err.message, tone: "error" });
    }
  }

  const locais = Array.from(new Set(bazares.map((b) => b.local).filter(Boolean))) as string[];
  const totalBazares = bazares.length;

  // Lógica para encontrar o nome do PRÓXIMO BAZAR
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const bazaresFuturos = bazares
    .filter((b) => (parseDataPura(b.data) ?? hoje) >= hoje)
    .sort(
      (a, b) =>
        (parseDataPura(a.data)?.getTime() ?? 0) - (parseDataPura(b.data)?.getTime() ?? 0),
    );

  const proximoBazarNome = bazaresFuturos.length > 0 ? bazaresFuturos[0].nome : "Nenhum bazar agendado";

  const totalArrecadado = bazares.reduce((sum, b) => sum + (b.total_arrecadado || 0), 0);

  const filtered = bazares.filter((b) => {
    const matchSearch =
      b.nome.toLowerCase().includes(search.toLowerCase()) ||
      (b.local?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (b.descricao?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchLocal = filterLocal === "Todos" || b.local === filterLocal;
    return matchSearch && matchLocal;
  });

  return (
    <div style={{ padding: "36px 32px", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
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
              Bazares
            </h1>
            <p style={{ fontSize: "13px", color: "#6B5E54", marginTop: "4px" }}>
              Gerencie os bazares da ONG
            </p>
          </div>
          {canEdit && (
            <Button onClick={openNewBazar}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Novo Bazar
            </Button>
          )}
        </div>

        {/* Summary Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          {[
            {
              label: "Total de Bazares",
              value: totalBazares,
              iconBg: "#D4EDD4",
              iconColor: "#3D7845",
              isText: false,
            },
            {
              label: "Próximo Bazar",
              value: proximoBazarNome,
              iconBg: "#e0f2fe",
              iconColor: "#0369a1",
              isText: true, // Indica que é um texto longo
            },
            {
              label: "Total Arrecadado",
              value: formatCurrency(totalArrecadado),
              iconBg: "#fef3c7",
              iconColor: "#ea580c",
              isText: false,
            },
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
                overflow: "hidden", // Impede que o cartão estique
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M7 7h10M7 12h10M7 17h10" />
                </svg>
              </div>
              <div style={{ minWidth: 0 }}> {/* minWidth 0 permite o truncate funcionar no flexbox */}
                <p style={{ fontSize: "11px", color: "#6B5E54", fontWeight: 600, margin: 0 }}>
                  {s.label}
                </p>
                <p
                  title={String(s.value)} // Mostra o nome completo ao passar o mouse
                  style={{
                    fontSize: s.isText && String(s.value).length > 12 ? "1.1rem" : "1.6rem",
                    fontWeight: 700,
                    color: "#2B1F14",
                    lineHeight: 1.1,
                    marginTop: "2px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "200px" // Limite visual
                  }}
                >
                  {loading ? "—" : s.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CONTAINER PRINCIPAL COM EFEITO DE VIDRO */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.92)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "0.5px solid rgba(220, 200, 190, 0.45)",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 2px 12px rgba(224, 122, 110, 0.05)",
          }}
        >
          {/* Filters */}
          {!loading && bazares.length > 0 && (
            <div
              style={{
                marginBottom: "24px",
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
                <svg
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9B8E84",
                  }}
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar por nome ou local..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px 8px 34px",
                    border: "0.5px solid #d6d0c4",
                    borderRadius: "10px",
                    fontSize: "13px",
                    color: "#2B1F14",
                    background: "#ffffff",
                    outline: "none",
                  }}
                />
              </div>
              <select
                value={filterLocal}
                onChange={(e) => setFilterLocal(e.target.value)}
                style={{
                  padding: "8px 12px",
                  border: "0.5px solid #d6d0c4",
                  borderRadius: "10px",
                  fontSize: "13px",
                  color: "#2B1F14",
                  background: "#ffffff",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option>Todos</option>
                {locais.map((local) => (
                  <option key={local} value={local}>
                    {local}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Cards Grid ou Mensagens Vázias */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <p style={{ color: "#6a6660" }}>Carregando bazares...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#d32f2f" }}>
              <p>{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <p style={{ color: "#6a6660" }}>Nenhum bazar encontrado</p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "20px",
              }}
            >
              {filtered.map((bazar) => (
                <div
                  key={bazar.id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e0dbd2",
                    borderRadius: "12px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow =
                      "0 8px 24px rgba(150, 65, 45, 0.12)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                  }}
                >
                  {/* Card Header */}
                  <div style={{ padding: "16px 16px 12px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "start",
                        marginBottom: "8px",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "1rem",
                          fontWeight: 700,
                          color: "#2B1F14",
                          margin: 0,
                          flex: 1,
                        }}
                      >
                        {bazar.nome}
                      </h3>
                      {canEdit && (
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            onClick={() => openEditBazar(bazar)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#3D7845",
                              cursor: "pointer",
                              padding: "4px",
                              fontSize: "12px",
                              fontWeight: 600,
                            }}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(bazar.id, bazar.nome)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#DC2626",
                              cursor: "pointer",
                              padding: "4px",
                              fontSize: "12px",
                              fontWeight: 600,
                            }}
                          >
                            Excluir
                          </button>
                        </div>
                      )}
                    </div>
                    {bazar.descricao && (
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#9B8E84",
                          margin: 0,
                          lineHeight: 1.4,
                        }}
                      >
                        {bazar.descricao.substring(0, 60)}
                        {bazar.descricao.length > 60 ? "..." : ""}
                      </p>
                    )}
                  </div>

                  {/* Card Content */}
                  <div style={{ padding: "12px 16px", flex: 1 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div>
                        <p style={{ fontSize: "11px", color: "#6B5E54", fontWeight: 600, margin: 0 }}>
                          Data
                        </p>
                        <p style={{ fontSize: "13px", color: "#2B1F14", margin: "2px 0 0" }}>
                          {formatarDataPura(bazar.data)}
                        </p>
                      </div>

                      {(bazar.horario_inicio || bazar.horario_fim) && (
                        <div>
                          <p style={{ fontSize: "11px", color: "#6B5E54", fontWeight: 600, margin: 0 }}>
                            Horário
                          </p>
                          <p style={{ fontSize: "13px", color: "#2B1F14", margin: "2px 0 0" }}>
                            {formatTime(bazar.horario_inicio)} -{" "}
                            {formatTime(bazar.horario_fim)}
                          </p>
                        </div>
                      )}

                      {bazar.local && (
                        <div>
                          <p style={{ fontSize: "11px", color: "#6B5E54", fontWeight: 600, margin: 0 }}>
                            Local
                          </p>
                          <p style={{ fontSize: "13px", color: "#2B1F14", margin: "2px 0 0" }}>
                            {bazar.local}
                          </p>
                        </div>
                      )}

                      {bazar.bazar_profissionais.length > 0 && (
                        <div>
                          <p style={{ fontSize: "11px", color: "#6B5E54", fontWeight: 600, margin: 0 }}>
                            Profissionais ({bazar.bazar_profissionais.length})
                          </p>
                          <div style={{ marginTop: "4px" }}>
                            {bazar.bazar_profissionais.slice(0, 3).map((bp) => (
                              <p
                                key={bp.usuarios.id}
                                style={{
                                  fontSize: "12px",
                                  color: "#9B8E84",
                                  margin: "2px 0",
                                }}
                              >
                                • {bp.usuarios.nome}
                              </p>
                            ))}
                            {bazar.bazar_profissionais.length > 3 && (
                              <p style={{ fontSize: "12px", color: "#9B8E84", margin: "2px 0" }}>
                                + {bazar.bazar_profissionais.length - 3} mais
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div
                    style={{
                      padding: "12px 16px",
                      borderTop: "0.5px solid #e0dbd2",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <p style={{ fontSize: "11px", color: "#6B5E54", fontWeight: 600, margin: 0 }}>
                        Total Arrecadado
                      </p>
                      <p style={{ fontSize: "14px", fontWeight: 700, color: "#ea580c", margin: "2px 0 0" }}>
                        {formatCurrency(bazar.total_arrecadado ?? 0)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Modal */}
        {showForm && canEdit && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
            onClick={() => resetForm()}
          >
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "28px",
                maxWidth: "600px",
                width: "90%",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 20px 60px rgba(150, 65, 45, 0.2)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#2B1F14", margin: "0 0 20px" }}>
                {editingId ? "Editar Bazar" : "Novo Bazar"}
              </h2>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#4a4a42" }}>
                    Nome do Bazar *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Bazar de Primavera"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      marginTop: "6px",
                      border: "0.5px solid #d6d0c4",
                      borderRadius: "10px",
                      fontSize: "13px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#4a4a42" }}>
                      Data *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.data}
                      onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        marginTop: "6px",
                        border: "0.5px solid #d6d0c4",
                        borderRadius: "10px",
                        fontSize: "13px",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#4a4a42" }}>Local</label>
                    <input
                      type="text"
                      value={formData.local}
                      onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                      placeholder="Ex: Museu da Cidade"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        marginTop: "6px",
                        border: "0.5px solid #d6d0c4",
                        borderRadius: "10px",
                        fontSize: "13px",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#4a4a42" }}>
                      Horário Início
                    </label>
                    <input
                      type="time"
                      value={formData.horario_inicio}
                      onChange={(e) =>
                        setFormData({ ...formData, horario_inicio: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        marginTop: "6px",
                        border: "0.5px solid #d6d0c4",
                        borderRadius: "10px",
                        fontSize: "13px",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#4a4a42" }}>
                      Horário Fim
                    </label>
                    <input
                      type="time"
                      value={formData.horario_fim}
                      onChange={(e) => setFormData({ ...formData, horario_fim: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        marginTop: "6px",
                        border: "0.5px solid #d6d0c4",
                        borderRadius: "10px",
                        fontSize: "13px",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#4a4a42" }}>
                    Descrição
                  </label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descrição do evento"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      marginTop: "6px",
                      border: "0.5px solid #d6d0c4",
                      borderRadius: "10px",
                      fontSize: "13px",
                      boxSizing: "border-box",
                      minHeight: "80px",
                      fontFamily: "inherit",
                      resize: "vertical",
                    }}
                  />
                </div>

                {editingId && (
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#4a4a42" }}>
                      Total Arrecadado
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.total_arrecadado}
                      onChange={(e) =>
                        setFormData({ ...formData, total_arrecadado: e.target.value })
                      }
                      placeholder="0.00"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        marginTop: "6px",
                        border: "0.5px solid #d6d0c4",
                        borderRadius: "10px",
                        fontSize: "13px",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                )}

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#4a4a42" }}>
                    Profissionais *
                  </label>
                  <div
                    style={{
                      marginTop: "8px",
                      border: "0.5px solid #d6d0c4",
                      borderRadius: "10px",
                      maxHeight: "200px",
                      overflowY: "auto",
                      padding: "8px",
                    }}
                  >
                    {profissionais.map((prof) => (
                      <label
                        key={prof.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "6px 8px",
                          cursor: "pointer",
                          fontSize: "13px",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.profissional_ids.includes(prof.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                profissional_ids: [...formData.profissional_ids, prof.id],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                profissional_ids: formData.profissional_ids.filter(
                                  (id) => id !== prof.id
                                ),
                              });
                            }
                          }}
                          style={{ marginRight: "8px", cursor: "pointer" }}
                        />
                        {prof.nome}
                        {prof.especialidade && (
                          <span style={{ color: "#9B8E84", marginLeft: "4px" }}>
                            ({prof.especialidade})
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#4a4a42" }}>
                    Observações
                  </label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    placeholder="Observações adicionais"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      marginTop: "6px",
                      border: "0.5px solid #d6d0c4",
                      borderRadius: "10px",
                      fontSize: "13px",
                      boxSizing: "border-box",
                      minHeight: "60px",
                      fontFamily: "inherit",
                      resize: "vertical",
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
                  <Button type="button" variant="ghost" size="sm" onClick={() => resetForm()} style={{ flex: 1 }}>
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm" disabled={submitLoading} style={{ flex: 1 }}>
                    {submitLoading ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
