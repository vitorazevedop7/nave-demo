"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchAuth } from "@/lib/auth";
import { StatusBadge } from "@/app/components/StatusBadge";
import { API_URL } from "@/lib/api";
import { formatarDataPura, paraInputDate } from "@/lib/date";
import { useDialog } from "@/components/DialogProvider";
import Button from "@/components/Button";

const BENEFICIARIAS_URL = `${API_URL}/beneficiarias`;

const formatarCPF = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
};

const formatarTelefone = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .replace(/(-\d{4})\d+?$/, "$1");
};

export default function Beneficiarios() {
  const router = useRouter();
  const { confirm, alert } = useDialog();
  const [busca, setBusca] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetalhesOpen, setIsDetalhesOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const formInicial = {
    id: "",
    nome: "",
    cpf: "",
    telefone: "",
    data_nascimento: "",
    endereco: "",
    status: "SEGURA",
  };
  const [formData, setFormData] = useState(formInicial);

  useEffect(() => {
    carregarPacientes();
  }, []);

  const carregarPacientes = async () => {
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetchAuth(BENEFICIARIAS_URL);
      const data = await res.json();
      if (Array.isArray(data)) setPacientes(data);
    } catch (err) {
      console.error("Erro na carga inicial:", err);
      setErro("Não foi possível carregar as beneficiárias.");
    } finally {
      setCarregando(false);
    }
  };

  const pacientesFiltrados = pacientes.filter((p) =>
    (p.nome && p.nome.toLowerCase().includes(busca.toLowerCase())) ||
    (p.cpf && p.cpf.includes(busca))
  );

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const method = formData.id ? "PATCH" : "POST";
      const url = formData.id
        ? `${BENEFICIARIAS_URL}/${formData.id}`
        : BENEFICIARIAS_URL;

      const payload = {
        nome: formData.nome.trim(),
        cpf: formData.cpf.trim(),
        telefone: formData.telefone.trim(),
        data_nascimento: formData.data_nascimento || null,
        endereco: formData.endereco.trim(),
        status: formData.status,
      };

      const res = await fetchAuth(url, {
        method,
        body: JSON.stringify(payload),
      });

      const resultado = await res.json();

      if (!res.ok) {
        throw new Error(resultado.message || "Erro ao salvar no banco.");
      }

      if (formData.id) {
        setPacientes(pacientes.map((p) => (p.id === formData.id ? resultado : p)));
      } else {
        setPacientes([...pacientes, resultado]);
      }

      setIsModalOpen(false);
      setIsEditMode(false);
      setFormData(formInicial);
    } catch (error: any) {
      await alert({ message: `Erro: ${error.message}`, tone: "error" });
    }
  };

  const handleEditar = () => {
    if (pacienteSelecionado) {
      setFormData({
        ...pacienteSelecionado,
        data_nascimento: paraInputDate(pacienteSelecionado.data_nascimento),
      });
      setIsEditMode(true);
    }
  };

  // Arquivamento (soft delete): a beneficiária sai da listagem, mas o histórico
  // clínico — triagens, queixas, encaminhamentos e prontuários — é preservado.
  async function handleArquivar(id: string, nome: string) {
    const ok = await confirm({
      title: "Arquivar beneficiária",
      message: `Arquivar "${nome}"? O histórico clínico é preservado e a beneficiária deixa de aparecer na listagem.`,
      confirmLabel: "Arquivar",
      variant: "danger",
    });
    if (!ok) return;
    try {
      const res = await fetchAuth(`${BENEFICIARIAS_URL}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setPacientes((prev) => prev.filter((b) => b.id !== id));
      if (pacienteSelecionado?.id === id) {
        setIsDetalhesOpen(false);
        setPacienteSelecionado(null);
      }
    } catch {
      await alert({ message: "Não foi possível arquivar a beneficiária.", tone: "error" });
    }
  }

  const abrirDetalhes = (paciente: any) => {
    setPacienteSelecionado(paciente);
    setIsDetalhesOpen(true);
    setIsEditMode(false);
  };

  const fecharDetalhes = () => {
    setIsDetalhesOpen(false);
    setPacienteSelecionado(null);
    setIsEditMode(false);
    setFormData(formInicial);
  };

  const fecharModal = () => {
    setIsModalOpen(false);
    setFormData(formInicial);
  };

  const NUM_COLUNAS = 5;

  function renderCorpo() {
    if (carregando) {
      return Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} style={{ borderBottom: "0.5px solid #f0ece4" }}>
          {Array.from({ length: NUM_COLUNAS }).map((__, j) => (
            <td key={j} style={{ padding: "14px 20px" }}>
              <div
                className="skeleton-pulse"
                style={{
                  height: "14px",
                  borderRadius: "6px",
                  background: "#f0ece4",
                  width: j === 0 ? "60%" : j === NUM_COLUNAS - 1 ? "80%" : "50%",
                }}
              />
            </td>
          ))}
        </tr>
      ));
    }

    if (erro) {
      return (
        <tr>
          <td colSpan={NUM_COLUNAS} style={{ padding: "32px 20px", textAlign: "center" }}>
            <p style={{ fontSize: "13px", color: "#9B8E84", marginBottom: "12px" }}>{erro}</p>
            <button
              onClick={() => { setErro(null); carregarPacientes(); }}
              style={{
                padding: "8px 20px",
                background: "#E07A6E",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Tentar novamente
            </button>
          </td>
        </tr>
      );
    }

    if (pacientesFiltrados.length > 0) {
      return pacientesFiltrados.map((p) => (
        <tr
          key={p.id}
          style={{
            borderBottom: "0.5px solid #f0ece4",
            fontSize: "13px",
          }}
        >
          <td style={{ padding: "14px 20px", fontWeight: 700 }}>{p.nome || "-"}</td>
          <td style={{ padding: "14px 20px" }}>
            {formatarDataPura(p.data_nascimento) || "-"}
          </td>
          <td style={{ padding: "14px 20px" }}>{p.telefone || "-"}</td>
          <td style={{ padding: "14px 20px" }}>
            <StatusBadge status={p.status} />
          </td>
          <td style={{ padding: "14px 20px" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button
                onClick={() => router.push(`/beneficiarios/${p.id}/editar`)}
                style={{ padding: "5px 12px", border: "0.5px solid #d6d0c4", borderRadius: "8px", fontSize: "12px", fontWeight: 600, color: "#4a4a42", background: "#f5f2eb", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
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
                onClick={() => router.push(`/beneficiarios/${p.id}/historico`)}
                style={{ padding: "5px 12px", border: "0.5px solid #93c5a8", borderRadius: "8px", fontSize: "12px", fontWeight: 600, color: "#2d6a4f", background: "#edf7f1", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#d8f0e3")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#edf7f1")}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  <path d="M3 12h4"/>
                  <path d="M3 6h8"/>
                  <path d="M3 18h4"/>
                </svg>
                Histórico
              </button>
              <button
                onClick={() => router.push(`/triagens/nova?beneficiaria_id=${p.id}&nome=${encodeURIComponent(p.nome ?? "")}`)}
                style={{ padding: "5px 12px", border: "0.5px solid #e6b89c", borderRadius: "8px", fontSize: "12px", fontWeight: 600, color: "#b5651d", background: "#fdf1e7", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f9e5d3")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#fdf1e7")}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
                Iniciar triagem
              </button>
              <button
                onClick={() => handleArquivar(p.id, p.nome)}
                aria-label={`Arquivar ${p.nome}`}
                style={{ padding: "5px 10px", border: "0.5px solid #e07a6e", borderRadius: "8px", fontSize: "12px", fontWeight: 600, color: "#c05a2a", background: "#fef3ee", cursor: "pointer", display: "flex", alignItems: "center" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#fce8e0")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#fef3ee")}
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
      ));
    }

    if (busca.trim()) {
      return (
        <tr>
          <td colSpan={NUM_COLUNAS} style={{ padding: "32px 20px", textAlign: "center", fontSize: "13px", color: "#9B8E84" }}>
            Nenhuma beneficiária encontrada para a busca.
          </td>
        </tr>
      );
    }

    return (
      <tr>
        <td colSpan={NUM_COLUNAS} style={{ padding: "32px 20px", textAlign: "center", fontSize: "13px", color: "#9B8E84" }}>
          Nenhuma beneficiária cadastrada ainda.
        </td>
      </tr>
    );
  }

  return (
    <div style={{ padding: "36px 32px", minHeight: "100vh" }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .skeleton-pulse { animation: pulse 1.4s ease-in-out infinite; }
      `}</style>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700 }}>Beneficiárias</h1>
          <p style={{ fontSize: "13px", color: "#6B5E54" }}>
            Gestão de pacientes e registros
          </p>
        </div>
        <Button onClick={() => router.push("/beneficiarios/nova")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nova Beneficiária
        </Button>
      </div>

      <div style={{ background: "#fff", borderRadius: "16px", border: "0.5px solid #d2c3b2" }}>
        <div style={{ padding: "16px 20px", borderBottom: "0.5px solid #e0dbd2" }}>
          <input
            type="text"
            placeholder="Buscar por nome ou CPF..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{
              width: "100%",
              maxWidth: "300px",
              padding: "8px 12px",
              border: "1px solid #d6d0c4",
              borderRadius: "10px",
              fontSize: "13px",
            }}
          />
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{
                borderBottom: "0.5px solid #e0dbd2",
                fontSize: "10px",
                color: "#6a6660",
                textAlign: "left",
              }}
            >
              <th style={{ padding: "12px 20px" }}>NOME</th>
              <th style={{ padding: "12px 20px" }}>DATA DE NASCIMENTO</th>
              <th style={{ padding: "12px 20px" }}>TELEFONE</th>
              <th style={{ padding: "12px 20px" }}>STATUS</th>
              <th style={{ padding: "12px 20px", textAlign: "left" }}>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {renderCorpo()}
          </tbody>
        </table>
      </div>

      {/* Modal de Cadastro/Edição */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={fecharModal}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "30px",
              width: "100%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: "20px" }}>
              {formData.id ? "Editar Beneficiária" : "Novo Cadastro"}
            </h2>
            <form onSubmit={handleSalvar}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <input
                  type="text"
                  placeholder="Nome *"
                  required
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    gridColumn: "span 2",
                    fontSize: "13px",
                  }}
                />
                <input
                  type="text"
                  placeholder="CPF *"
                  required
                  value={formData.cpf}
                  onChange={(e) =>
                    setFormData({ ...formData, cpf: formatarCPF(e.target.value) })
                  }
                  style={{ padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "13px" }}
                />
                <input
                  type="text"
                  placeholder="Telefone"
                  value={formData.telefone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      telefone: formatarTelefone(e.target.value),
                    })
                  }
                  style={{ padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "13px" }}
                />
                <input
                  type="date"
                  value={formData.data_nascimento}
                  onChange={(e) =>
                    setFormData({ ...formData, data_nascimento: e.target.value })
                  }
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    fontSize: "13px",
                  }}
                />
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    fontSize: "13px",
                  }}
                >
                  <option value="SEGURA">Segura</option>
                  <option value="NAO_SEGURA">Não Segura</option>
                </select>
                <input
                  type="text"
                  placeholder="Endereço"
                  value={formData.endereco}
                  onChange={(e) =>
                    setFormData({ ...formData, endereco: e.target.value })
                  }
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    gridColumn: "span 2",
                    fontSize: "13px",
                  }}
                />
              </div>
              <div
                style={{
                  marginTop: "20px",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                }}
              >
                <Button type="button" variant="ghost" size="sm" onClick={fecharModal}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm">
                  Salvar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalhes */}
      {isDetalhesOpen && pacienteSelecionado && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={fecharDetalhes}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "30px",
              width: "100%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Título */}
            <div style={{ textAlign: "center", marginBottom: "8px" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#3D7845", margin: 0 }}>
                Detalhes da Beneficiária
              </h2>
              <div style={{ width: "40px", height: "3px", background: "#E07A6E", borderRadius: "9999px", margin: "8px auto 0" }} />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <span />
              {!isEditMode && (
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    onClick={handleEditar}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      opacity: 0.7,
                      transition: "opacity 0.2s",
                      display: "inline-flex",
                      alignItems: "center",
                      color: "#3D7845",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
                    title="Editar"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleArquivar(pacienteSelecionado.id, pacienteSelecionado.nome)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      opacity: 0.7,
                      transition: "opacity 0.2s",
                      display: "inline-flex",
                      alignItems: "center",
                      color: "#DC2626",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
                    title="Arquivar"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6"/>
                      <path d="M14 11v6"/>
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {isEditMode ? (
              <form onSubmit={handleSalvar}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                  <input
                    type="text"
                    placeholder="Nome"
                    required
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    style={{
                      padding: "10px",
                      border: "1px solid #ddd",
                      borderRadius: "6px",
                      gridColumn: "span 2",
                      fontSize: "13px",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="CPF"
                    required
                    value={formData.cpf}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cpf: formatarCPF(e.target.value),
                      })
                    }
                    style={{
                      padding: "10px",
                      border: "1px solid #ddd",
                      borderRadius: "6px",
                      fontSize: "13px",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Telefone"
                    value={formData.telefone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        telefone: formatarTelefone(e.target.value),
                      })
                    }
                    style={{
                      padding: "10px",
                      border: "1px solid #ddd",
                      borderRadius: "6px",
                      fontSize: "13px",
                    }}
                  />
                  <input
                    type="date"
                    value={formData.data_nascimento}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        data_nascimento: e.target.value,
                      })
                    }
                    style={{
                      padding: "10px",
                      border: "1px solid #ddd",
                      borderRadius: "6px",
                      fontSize: "13px",
                    }}
                  />
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    style={{
                      padding: "10px",
                      border: "1px solid #ddd",
                      borderRadius: "6px",
                      fontSize: "13px",
                    }}
                  >
                    <option value="SEGURA">Segura</option>
                    <option value="NAO_SEGURA">Não Segura</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Endereço"
                    value={formData.endereco}
                    onChange={(e) =>
                      setFormData({ ...formData, endereco: e.target.value })
                    }
                    style={{
                      padding: "10px",
                      border: "1px solid #ddd",
                      borderRadius: "6px",
                      gridColumn: "span 2",
                      fontSize: "13px",
                    }}
                  />
                </div>
                <div
                  style={{
                    marginTop: "20px",
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "10px",
                  }}
                >
                  <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditMode(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm">
                    Salvar
                  </Button>
                </div>
              </form>
            ) : (
              <div style={{ display: "grid", gap: "12px" }}>
                {[
                  { label: "Nome", value: pacienteSelecionado.nome },
                  { label: "CPF", value: pacienteSelecionado.cpf },
                  { label: "Telefone", value: pacienteSelecionado.telefone },
                  {
                    label: "Data de Nascimento",
                    value: formatarDataPura(pacienteSelecionado.data_nascimento) || null,
                  },
                  { label: "Endereço", value: pacienteSelecionado.endereco },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "12px 16px",
                      background: "#faf9f6",
                      borderRadius: "10px",
                      border: "0.5px solid #e8e3da",
                      gap: "12px",
                    }}
                  >
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#C05A48", minWidth: "140px" }}>
                      {label}
                    </span>
                    <span style={{ fontSize: "13px", color: "#2B1F14", fontWeight: 500 }}>
                      {value || <span style={{ color: "#aaa" }}>—</span>}
                    </span>
                  </div>
                ))}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "12px 16px",
                    background: "#faf9f6",
                    borderRadius: "10px",
                    border: "0.5px solid #e8e3da",
                    gap: "12px",
                  }}
                >
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#C05A48", minWidth: "140px" }}>
                    Status
                  </span>
                  <StatusBadge status={pacienteSelecionado.status} />
                </div>
              </div>
            )}

            {!isEditMode && (
              <div
                style={{
                  marginTop: "24px",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <Button variant="ghost" size="sm" onClick={fecharDetalhes}>
                  Fechar
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}