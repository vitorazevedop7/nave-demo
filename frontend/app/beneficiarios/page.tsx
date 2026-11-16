"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchAuth } from "@/lib/auth";
import { StatusBadge } from "@/app/components/StatusBadge";
import { API_URL, extrairMensagemErro, mensagemDeErro } from "@/lib/api";
import { formatarDataPura } from "@/lib/date";
import { useDialog } from "@/components/DialogProvider";
import Button from "@/components/Button";

const BENEFICIARIAS_URL = `${API_URL}/beneficiarias`;

interface Beneficiaria {
  id: string;
  nome: string;
  cpf?: string | null;
  telefone?: string | null;
  data_nascimento?: string | null;
  status: string;
}

export default function Beneficiarios() {
  const router = useRouter();
  const { confirm, alert } = useDialog();
  const [busca, setBusca] = useState("");
  const [pacientes, setPacientes] = useState<Beneficiaria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    carregarPacientes();
  }, []);

  const carregarPacientes = async () => {
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetchAuth(BENEFICIARIAS_URL);
      if (!res.ok) throw new Error(await extrairMensagemErro(res, "Não foi possível carregar as beneficiárias."));
      const data = await res.json();
      if (Array.isArray(data)) setPacientes(data);
    } catch (err: unknown) {
      setErro(mensagemDeErro(err, "Não foi possível carregar as beneficiárias."));
    } finally {
      setCarregando(false);
    }
  };

  const pacientesFiltrados = pacientes.filter((p) =>
    (p.nome && p.nome.toLowerCase().includes(busca.toLowerCase())) ||
    (p.cpf && p.cpf.includes(busca))
  );

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
      if (!res.ok) throw new Error(await extrairMensagemErro(res, "Não foi possível arquivar a beneficiária."));
      setPacientes((prev) => prev.filter((b) => b.id !== id));
    } catch (err: unknown) {
      await alert({ message: mensagemDeErro(err, "Não foi possível arquivar a beneficiária."), tone: "error" });
    }
  }

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
              type="button"
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
                type="button"
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
                type="button"
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
                type="button"
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
                type="button"
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
            aria-label="Buscar beneficiária por nome ou CPF"
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
    </div>
  );
}
