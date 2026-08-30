"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchAuth } from "@/lib/auth";
import { API_URL } from "@/lib/api";
import { formatarDataPura, hojeInputDate, parseDataPura } from "@/lib/date";
import Button from "@/components/Button";

/* ─── Types ─────────────────────────────────────────────────── */
interface Doador {
  id: string;
  nome: string;
  tipo: string | null;
  telefone: string | null;
  email: string | null;
}

interface Campanha {
  id: string;
  nome: string;
  descricao: string | null;
  meta_valor: number | null;
  criado_em: string;
  encerrada_em: string | null;
  _count?: { doacoes: number };
  total_arrecadado?: number;
}

interface Doacao {
  id: string;
  tipo: string;
  valor: number | null;
  quantidade: string | null;
  data: string;
  observacao: string | null;
  criado_em: string;
  campanha_id: string | null;
  doadores: Doador | null;
  campanhas_doacoes: { nome: string } | null;
}

type ModalType = "doacao" | "doador" | "campanha" | "gerenciar-doadores" | null;

/* ─── Helpers ───────────────────────────────────────────────── */

function fmtBRL(v: number | null) {
  if (!v) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

// Formatar telefone brasileiro
function fmtPhone(value: string): string {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
}

// Validar telefone brasileiro
function isValidPhone(phone: string): boolean {
  const numbers = phone.replace(/\D/g, '');
  return numbers.length === 10 || numbers.length === 11;
}

// Validar email
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Placeholder dinâmico baseado no tipo de doação
function getPlaceholder(tipo: string): string {
  const placeholders: Record<string, string> = {
    DINHEIRO: "0,00",
    ALIMENTO: "Ex: 5 kg de arroz, 10 latas de leite",
    ROUPA: "Ex: 10 camisetas, 5 calças tamanho M",
    OUTRO: "Ex: livros, brinquedos, etc",
  };
  return placeholders[tipo] || "Ex: 5 kg de arroz";
}

/* ─── Palette helpers ───────────────────────────────────────── */
const card: React.CSSProperties = {
  background: "var(--bg-card)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  border: "0.5px solid var(--border-card)",
  borderRadius: "16px",
  padding: "24px",
  boxShadow: "0 2px 12px rgba(224,122,110,0.06)",
};

/* ─── Sub-components ────────────────────────────────────────── */

function StatCard({
  label,
  value,
  icon,
  accent = false,
  action,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div
      className="dash-metric-card dash-metric-card--salmon"
      style={{
        ...card,
        background: accent ? "var(--salmon-primary)" : "var(--bg-card)",
        padding: "22px 26px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "18px",
        flex: 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "18px", flex: 1 }}>
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            background: accent ? "rgba(255,255,255,0.2)" : "var(--salmon-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div>
          <p
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: accent ? "rgba(255,255,255,0.75)" : "var(--text-muted)",
              marginBottom: "4px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {label}
          </p>
          <p
            style={{
              fontSize: "1.7rem",
              fontWeight: 800,
              color: accent ? "#fff" : "var(--text-primary)",
              margin: 0,
              lineHeight: 1,
            }}
          >
            {value}
          </p>
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

/* ─── SVG Icons ──────────────────────────────────────────────── */
function IconGift() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--salmon-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="M12 4v4M9 8h6V6a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v2Z" />
      <line x1="12" y1="8" x2="12" y2="20" />
    </svg>
  );
}

function IconMoney() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--salmon-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" fill="var(--salmon-primary)" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17v.01" />
      <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function IconPeople() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--salmon-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L21 6Z" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

function BarChart({ doacoes }: { doacoes: Doacao[] }) {
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const now = new Date();
  const data = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const m = d.getMonth();
    const y = d.getFullYear();
    const total = doacoes
      .filter((d2) => {
        const dd = parseDataPura(d2.data);
        return dd?.getMonth() === m && dd?.getFullYear() === y && d2.tipo === "DINHEIRO";
      })
      .reduce((s, d2) => {
        const valor = typeof d2.valor === 'string' ? parseFloat(d2.valor) : (d2.valor ?? 0);
        return s + valor;
      }, 0);
    const isCurrent = m === now.getMonth() && y === now.getFullYear();
    return { label: months[m], total, isCurrent };
  });

  const max = Math.max(...data.map((d) => d.total), 1);
  const W = 300;
  const H = 60;
  const barW = 28;
  const gap = (W - data.length * barW) / (data.length + 1);

  return (
    <div style={{ width: "100%" }}>
      <svg viewBox={`0 0 ${W} ${H + 20}`} style={{ width: "100%", overflow: "visible" }}>
        {[0.33, 0.66, 1].map((t) => (
          <line
            key={t}
            x1={0} y1={H - t * H}
            x2={W} y2={H - t * H}
            stroke="rgba(220,200,190,0.5)"
            strokeWidth="0.5"
            strokeDasharray="4,4"
          />
        ))}
        {data.map((d, i) => {
          const barH = Math.max((d.total / max) * H, d.total > 0 ? 4 : 0);
          const x = gap + i * (barW + gap);
          return (
            <g key={i}>
              <rect x={x} y={0} width={barW} height={H} rx={6}
                fill="var(--salmon-light)" opacity={0.5} />
              {barH > 0 && (
                <rect className="dash-chart-bar"
                  x={x} y={H - barH} width={barW} height={barH} rx={6}
                  fill={d.isCurrent ? "var(--salmon-dark)" : "var(--salmon-primary)"}
                  opacity={d.isCurrent ? 1 : 0.8}
                />
              )}
              <text x={x + barW / 2} y={H + 14} textAnchor="middle"
                fontSize="8.5"
                fontWeight={d.isCurrent ? "700" : "400"}
                fill={d.isCurrent ? "var(--text-primary)" : "var(--text-muted)"}>
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "14px", marginTop: "6px" }}>
        {[["var(--salmon-primary)", "Anteriores"], ["var(--salmon-dark)", "Mês atual"]].map(([color, label]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: color }} />
            <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div
      style={{
        height: "6px",
        borderRadius: "99px",
        background: "var(--salmon-light)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          borderRadius: "99px",
          background: "var(--salmon-primary)",
          transition: "width 0.5s ease",
        }}
      />
    </div>
  );
}

function Badge({ tipo }: { tipo: string }) {
  const isDinheiro = tipo === "DINHEIRO";
  return (
    <span
      style={{
        fontSize: "11px",
        fontWeight: 600,
        padding: "3px 10px",
        borderRadius: "99px",
        background: isDinheiro ? "var(--green-light)" : "var(--salmon-light)",
        color: isDinheiro ? "var(--green-dark)" : "var(--salmon-dark)",
      }}
    >
      {isDinheiro ? "Dinheiro" : tipo.charAt(0) + tipo.slice(1).toLowerCase()}
    </span>
  );
}

/* ─── Confirmation Modal ──────────────────────────────────── */
function ConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
  isLoading = false,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(43,31,20,0.45)",
        backdropFilter: "blur(4px)",
        zIndex: 51,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        style={{
          background: "var(--bg-body)",
          borderRadius: "20px",
          padding: "32px",
          width: "100%",
          maxWidth: "380px",
          boxShadow: "0 20px 60px rgba(43,31,20,0.18)",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>{title}</h2>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "12px 0 24px 0", lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
          <Button variant="ghost" onClick={onCancel} disabled={isLoading}>Cancelar</Button>
          <Button variant="danger" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Deletando…" : "Deletar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Modal ─────────────────────────────────────────────────── */
function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(43,31,20,0.45)",
        backdropFilter: "blur(4px)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "var(--bg-body)",
          borderRadius: "20px",
          padding: "32px",
          width: "100%",
          maxWidth: "480px",
          boxShadow: "0 20px 60px rgba(43,31,20,0.18)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "var(--salmon-light)",
              color: "var(--salmon-dark)",
              width: "32px",
              height: "32px",
              borderRadius: "99px",
              cursor: "pointer",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid var(--border-card)",
  background: "#fff",
  color: "var(--text-primary)",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
};

/* ─── Main Page ─────────────────────────────────────────────── */
export default function Doacoes() {
  const [doacoes, setDoacoes] = useState<Doacao[]>([]);
  const [doadores, setDoadores] = useState<Doador[]>([]);
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("Todos");
  const [submitting, setSubmitting] = useState(false);
  const [editingCampanhaId, setEditingCampanhaId] = useState<string | null>(null);
  const [editingDoadorId, setEditingDoadorId] = useState<string | null>(null);

  // Estados para confirmação
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'doacao' | 'doador' | 'campanha', id: string, name?: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /* form states */
  const [formDoacao, setFormDoacao] = useState({
    doador_id: "",
    tipo: "DINHEIRO",
    valor: "",
    quantidade: "",
    data: hojeInputDate(),
    observacao: "",
    campanha_id: "",
  });
  const [formDoador, setFormDoador] = useState({ nome: "", tipo: "PESSOA_FISICA", telefone: "", email: "" });
  const [formCampanha, setFormCampanha] = useState({ nome: "", descricao: "", meta_valor: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r1, r2, r3] = await Promise.all([
        fetchAuth(`${API_URL}/doacoes`).then((r) => (r.ok ? r.json() : [])),
        fetchAuth(`${API_URL}/doadores`).then((r) => (r.ok ? r.json() : [])),
        fetchAuth(`${API_URL}/campanhas-doacoes`).then((r) => (r.ok ? r.json() : [])),
      ]);
      setDoacoes(r1);
      setDoadores(r2);
      setCampanhas(r3);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Stats ─────────────────────────────────────────────────── */
  const totalValor = doacoes.reduce((s, d) => {
    const valor = typeof d.valor === 'string' ? parseFloat(d.valor) : (d.valor ?? 0);
    return s + valor;
  }, 0);
  const now = new Date();
  const mesAtual = doacoes.filter((d) => {
    const dd = parseDataPura(d.data);
    return dd?.getMonth() === now.getMonth() && dd?.getFullYear() === now.getFullYear();
  });
  const valorMes = mesAtual.reduce((s, d) => {
    const valor = typeof d.valor === 'string' ? parseFloat(d.valor) : (d.valor ?? 0);
    return s + valor;
  }, 0);

  /* ── Filtered list ─────────────────────────────────────────── */
  const filtered = doacoes.filter((d) => {
    const matchSearch =
      !search ||
      d.doadores?.nome.toLowerCase().includes(search.toLowerCase()) ||
      d.tipo.toLowerCase().includes(search.toLowerCase());
    const matchTipo = filterTipo === "Todos" || d.tipo === filterTipo;
    return matchSearch && matchTipo;
  });

  /* ── Campanha totals ────────────────────────────────────────── */
  const campanhasWithTotal = campanhas.map((c) => ({
    ...c,
    total_arrecadado: doacoes
      .filter((d) => d.campanha_id === c.id)
      .reduce((s, d) => {
        const valor = typeof d.valor === 'string' ? parseFloat(d.valor) : (d.valor ?? 0);
        return s + valor;
      }, 0),
  }));

  /* ── Submit handlers ────────────────────────────────────────── */
  async function submitDoacao() {
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        tipo: formDoacao.tipo,
        data: formDoacao.data,
        doador_id: formDoacao.doador_id || undefined,
        observacao: formDoacao.observacao || undefined,
        campanha_id: formDoacao.campanha_id || undefined,
      };
      if (formDoacao.tipo === "DINHEIRO") body.valor = parseFloat(formDoacao.valor.replace(",", "."));
      else body.quantidade = formDoacao.quantidade;

      const r = await fetchAuth(`${API_URL}/doacoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (r.ok) { setActiveModal(null); load(); }
    } finally { setSubmitting(false); }
  }

  async function submitDoador() {
    setSubmitting(true);
    const errors: Record<string, string> = {};

    if (formDoador.telefone && !isValidPhone(formDoador.telefone)) {
      errors.telefone = 'Telefone inválido. Use formato: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX';
    }

    if (formDoador.email && !isValidEmail(formDoador.email)) {
      errors.email = 'E-mail inválido';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setSubmitting(false);
      return;
    }

    try {
      const r = await fetchAuth(`${API_URL}/doadores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formDoador),
      });
      if (r.ok) { setActiveModal(null); setFormErrors({}); load(); }
      else {
        const err = await r.json();
        if (err.message) setFormErrors({ form: err.message });
      }
    } finally { setSubmitting(false); }
  }

  async function submitCampanha() {
    setSubmitting(true);
    try {
      const body = {
        nome: formCampanha.nome,
        descricao: formCampanha.descricao || undefined,
        meta_valor: formCampanha.meta_valor ? parseFloat(formCampanha.meta_valor.replace(",", ".")) : undefined,
      };

      if (editingCampanhaId) {
        const r = await fetchAuth(`${API_URL}/campanhas-doacoes/${editingCampanhaId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (r.ok) { resetFormCampanha(); load(); }
      } else {
        const r = await fetchAuth(`${API_URL}/campanhas-doacoes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (r.ok) { resetFormCampanha(); load(); }
      }
    } finally { setSubmitting(false); }
  }

  function resetFormCampanha() {
    setFormCampanha({ nome: "", descricao: "", meta_valor: "" });
    setEditingCampanhaId(null);
    setActiveModal(null);
  }

  function openEditarCampanha(c: Campanha) {
    setEditingCampanhaId(c.id);
    setFormCampanha({
      nome: c.nome,
      descricao: c.descricao || "",
      meta_valor: c.meta_valor ? c.meta_valor.toString() : "",
    });
    setActiveModal("campanha");
  }

  async function deletarCampanha(id: string, nome: string) {
    setConfirmDelete({ type: 'campanha', id, name: nome });
  }

  function openEditarDoador(d: Doador) {
    setEditingDoadorId(d.id);
    setFormDoador({
      nome: d.nome,
      tipo: d.tipo || "PESSOA_FISICA",
      telefone: d.telefone || "",
      email: d.email || "",
    });
    setFormErrors({});
    setActiveModal("doador");
  }

  async function deletarDoador(id: string, nome: string) {
    setConfirmDelete({ type: 'doador', id, name: nome });
  }

  async function deletarDoacao(id: string) {
    setConfirmDelete({ type: 'doacao', id });
  }

  async function executarDelete() {
    if (!confirmDelete) return;
    setIsDeleting(true);
    try {
      let url = '';
      if (confirmDelete.type === 'campanha') url = `${API_URL}/campanhas-doacoes/${confirmDelete.id}`;
      else if (confirmDelete.type === 'doador') url = `${API_URL}/doadores/${confirmDelete.id}`;
      else if (confirmDelete.type === 'doacao') url = `${API_URL}/doacoes/${confirmDelete.id}`;

      const r = await fetchAuth(url, { method: "DELETE" });
      if (r.ok) {
        setConfirmDelete(null);
        load();
      }
    } catch (err) {
      console.error("Erro ao deletar", err);
    } finally {
      setIsDeleting(false);
    }
  }

  /* ─── Render ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "36px", height: "36px", border: "3px solid var(--salmon-light)", borderTopColor: "var(--salmon-primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Carregando doações…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: "36px 32px", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        {/* ── Header ─────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Doações</h1>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
              Gerencie doações, doadores e campanhas
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <Button variant="secondary" onClick={() => setActiveModal("campanha")}>+ Campanha</Button>
            <Button variant="secondary" onClick={() => setActiveModal("doador")}>+ Doador</Button>
            <Button onClick={() => setActiveModal("doacao")}>+ Nova Doação</Button>
          </div>
        </div>

        {/* ── Stats ──────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: "14px", marginBottom: "20px", flexWrap: "wrap" }}>
          <StatCard label="Total de Doações" value={String(doacoes.length)} icon={<IconGift />} accent />
          <StatCard label="Valor Total Arrecadado" value={fmtBRL(totalValor)} icon={<IconMoney />} />
          <StatCard
            label="Total de Doadores"
            value={String(doadores.length)}
            icon={<IconPeople />}
            action={<Button variant="secondary" size="sm" onClick={() => setActiveModal("gerenciar-doadores")} style={{ padding: "8px 14px", fontSize: "12px" }}>📋 Gerenciar</Button>}
          />
        </div>

        {/* ── Chart + Campanhas ───────────────────────────────── */}
        <div className="dash-main-grid" style={{ marginBottom: "20px" }}>

          {/* Chart */}
          <div style={{ ...card, padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                Arrecadação Mensal
              </p>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", background: "var(--salmon-light)", padding: "3px 10px", borderRadius: "99px" }}>
                Últimos 6 meses
              </span>
            </div>
            <BarChart doacoes={doacoes} />
          </div>

          {/* Campanhas */}
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Campanhas Ativas</p>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{campanhasWithTotal.filter(c => !c.encerrada_em).length} ativas</span>
            </div>
            {campanhasWithTotal.length === 0 && (
              <p style={{ fontSize: "13px", color: "var(--text-muted)", textAlign: "center", padding: "20px 0" }}>
                Nenhuma campanha cadastrada
              </p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {campanhasWithTotal.filter(c => !c.encerrada_em).slice(0, 4).map((c) => {
                const pct = c.meta_valor ? Math.min((c.total_arrecadado! / c.meta_valor) * 100, 100) : 0;
                return (
                  <div key={c.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{c.nome}</span>
                      </div>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, marginRight: "8px" }}>
                          {c.meta_valor ? `${Math.round(pct)}%` : fmtBRL(c.total_arrecadado!)}
                        </span>
                        <button onClick={() => openEditarCampanha(c)} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "16px", padding: 0 }}>✏️</button>
                        <button onClick={() => deletarCampanha(c.id, c.nome)} aria-label={`Excluir ${c.nome}`} style={{ padding: "5px 10px", border: "0.5px solid #fca5a5", borderRadius: "8px", color: "#DC2626", background: "#fef2f2", cursor: "pointer", display: "flex", alignItems: "center" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#fee2e2")} onMouseLeave={(e) => (e.currentTarget.style.background = "#fef2f2")}><IconTrash /></button>
                      </div>
                    </div>
                    {c.meta_valor && (
                      <>
                        <ProgressBar value={c.total_arrecadado!} max={c.meta_valor} />
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                          <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{fmtBRL(c.total_arrecadado!)}</span>
                          <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>meta: {fmtBRL(c.meta_valor)}</span>
                        </div>
                      </>
                    )}
                    {!c.meta_valor && <ProgressBar value={1} max={1} />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Donations table ─────────────────────────────────── */}
        <div style={card}>
          {/* Table header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              Registro de Doações
            </p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <input
                placeholder="Buscar doador ou tipo…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ ...inputStyle, width: "220px", fontSize: "13px" }}
              />
              <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)} style={{ ...inputStyle, width: "140px", fontSize: "13px" }}>
                <option value="Todos">Todos os tipos</option>
                <option value="DINHEIRO">Dinheiro</option>
                <option value="ALIMENTO">Alimento</option>
                <option value="ROUPA">Roupa</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Nenhuma doação encontrada</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-card)" }}>
                    {["Doador", "Tipo", "Valor / Qtd.", "Campanha", "Data", ""].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 50).map((d) => (
                    <tr
                      key={d.id}
                      className="dash-queue-row"
                      style={{ borderBottom: "0.5px solid rgba(220,200,190,0.3)" }}
                    >
                      <td style={{ padding: "12px 12px" }}>
                        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                          {d.doadores?.nome ?? "Anônimo"}
                        </span>
                        {d.observacao && (
                          <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{d.observacao}</p>
                        )}
                      </td>
                      <td style={{ padding: "12px 12px" }}><Badge tipo={d.tipo} /></td>
                      <td style={{ padding: "12px 12px", fontWeight: 600, color: "var(--text-primary)" }}>
                        {d.tipo === "DINHEIRO" ? fmtBRL(d.valor) : (d.quantidade ?? "—")}
                      </td>
                      <td style={{ padding: "12px 12px", color: "var(--text-secondary)", fontSize: "12px" }}>
                        {d.campanhas_doacoes?.nome ?? "—"}
                      </td>
                      <td style={{ padding: "12px 12px", color: "var(--text-secondary)" }}>
                        {formatarDataPura(d.data)}
                      </td>
                      <td style={{ padding: "12px 12px" }}>
                        <button onClick={() => deletarDoacao(d.id)} aria-label="Excluir doação" style={{ padding: "5px 10px", border: "0.5px solid #fca5a5", borderRadius: "8px", color: "#DC2626", background: "#fef2f2", cursor: "pointer", display: "flex", alignItems: "center" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#fee2e2")} onMouseLeave={(e) => (e.currentTarget.style.background = "#fef2f2")}><IconTrash /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length > 50 && (
                <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)", marginTop: "12px" }}>
                  Exibindo 50 de {filtered.length} registros
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal: Nova Doação ──────────────────────────────────── */}
      {activeModal === "doacao" && (
        <Modal title="Registrar Doação" onClose={() => setActiveModal(null)}>
          <Field label="Doador">
            <select style={inputStyle} value={formDoacao.doador_id} onChange={(e) => setFormDoacao({ ...formDoacao, doador_id: e.target.value })}>
              <option value="">Anônimo</option>
              {doadores.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
            </select>
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label="Tipo">
              <select style={inputStyle} value={formDoacao.tipo} onChange={(e) => setFormDoacao({ ...formDoacao, tipo: e.target.value })}>
                <option value="DINHEIRO">Dinheiro</option>
                <option value="ALIMENTO">Alimento</option>
                <option value="ROUPA">Roupa</option>
                <option value="OUTRO">Outro</option>
              </select>
            </Field>
            <Field label="Data">
              <input type="date" style={inputStyle} value={formDoacao.data} onChange={(e) => setFormDoacao({ ...formDoacao, data: e.target.value })} />
            </Field>
          </div>
          {formDoacao.tipo === "DINHEIRO" ? (
            <Field label="Valor (R$)">
              <input type="text" placeholder="0,00" style={inputStyle} value={formDoacao.valor} onChange={(e) => setFormDoacao({ ...formDoacao, valor: e.target.value })} />
            </Field>
          ) : (
            <Field label="Quantidade / Descrição">
              <input type="text" placeholder={getPlaceholder(formDoacao.tipo)} style={inputStyle} value={formDoacao.quantidade} onChange={(e) => setFormDoacao({ ...formDoacao, quantidade: e.target.value })} />
            </Field>
          )}
          <Field label="Campanha (opcional)">
            <select style={inputStyle} value={formDoacao.campanha_id} onChange={(e) => setFormDoacao({ ...formDoacao, campanha_id: e.target.value })}>
              <option value="">Sem campanha</option>
              {campanhas.filter(c => !c.encerrada_em).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </Field>
          <Field label="Observação (opcional)">
            <input type="text" style={inputStyle} value={formDoacao.observacao} onChange={(e) => setFormDoacao({ ...formDoacao, observacao: e.target.value })} />
          </Field>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
            <Button variant="ghost" onClick={() => setActiveModal(null)}>Cancelar</Button>
            <Button onClick={submitDoacao} disabled={submitting}>
              {submitting ? "Salvando…" : "Registrar"}
            </Button>
          </div>
        </Modal>
      )}

      {/* ── Modal: Novo Doador ──────────────────────────────────── */}
      {activeModal === "doador" && (
        <Modal title={editingDoadorId ? "Editar Doador" : "Cadastrar Doador"} onClose={() => { setActiveModal(null); setEditingDoadorId(null); }}>
          {formErrors.form && <div style={{ padding: "10px", background: "var(--salmon-light)", color: "var(--salmon-dark)", borderRadius: "8px", marginBottom: "16px", fontSize: "13px" }}>{formErrors.form}</div>}
          <Field label="Nome *">
            <input type="text" style={inputStyle} value={formDoador.nome} onChange={(e) => setFormDoador({ ...formDoador, nome: e.target.value })} />
          </Field>
          <Field label="Tipo">
            <select style={inputStyle} value={formDoador.tipo} onChange={(e) => setFormDoador({ ...formDoador, tipo: e.target.value })}>
              <option value="PESSOA_FISICA">Pessoa Física</option>
              <option value="PESSOA_JURIDICA">Pessoa Jurídica</option>
            </select>
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label="Telefone">
              <div>
                <input type="text" placeholder="(XX) XXXXX-XXXX" style={inputStyle} value={formDoador.telefone} onChange={(e) => setFormDoador({ ...formDoador, telefone: fmtPhone(e.target.value) })} />
                {formErrors.telefone && <p style={{ fontSize: "11px", color: "var(--salmon-primary)", marginTop: "4px" }}>{formErrors.telefone}</p>}
              </div>
            </Field>
            <Field label="E-mail">
              <div>
                <input type="text" placeholder="doador@example.com" style={inputStyle} value={formDoador.email} onChange={(e) => setFormDoador({ ...formDoador, email: e.target.value })} />
                {formErrors.email && <p style={{ fontSize: "11px", color: "var(--salmon-primary)", marginTop: "4px" }}>{formErrors.email}</p>}
              </div>
            </Field>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", marginTop: "16px" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              {editingDoadorId && <Button variant="danger" onClick={() => deletarDoador(editingDoadorId, formDoador.nome)}>Deletar</Button>}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <Button variant="ghost" onClick={() => { setActiveModal(null); setEditingDoadorId(null); }}>Cancelar</Button>
              <Button onClick={submitDoador} disabled={submitting || !formDoador.nome}>
                {submitting ? "Salvando…" : editingDoadorId ? "Salvar Alterações" : "Cadastrar"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Modal: Nova Campanha ────────────────────────────────── */}
      {activeModal === "campanha" && (
        <Modal title={editingCampanhaId ? "Editar Campanha" : "Nova Campanha"} onClose={() => { editingCampanhaId ? resetFormCampanha() : setActiveModal(null); }}>
          <Field label="Nome *">
            <input type="text" style={inputStyle} value={formCampanha.nome} onChange={(e) => setFormCampanha({ ...formCampanha, nome: e.target.value })} />
          </Field>
          <Field label="Descrição">
            <textarea rows={3} style={{ ...inputStyle, resize: "vertical" }} value={formCampanha.descricao} onChange={(e) => setFormCampanha({ ...formCampanha, descricao: e.target.value })} />
          </Field>
          <Field label="Meta de Arrecadação (R$)">
            <input type="text" placeholder="Deixe vazio para sem meta" style={inputStyle} value={formCampanha.meta_valor} onChange={(e) => setFormCampanha({ ...formCampanha, meta_valor: e.target.value })} />
          </Field>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
            <Button variant="ghost" onClick={() => { editingCampanhaId ? resetFormCampanha() : setActiveModal(null); }}>Cancelar</Button>
            <Button onClick={submitCampanha} disabled={submitting || !formCampanha.nome}>
              {submitting ? "Salvando…" : editingCampanhaId ? "Salvar Alterações" : "Criar Campanha"}
            </Button>
          </div>
        </Modal>
      )}

      {/* ── Modal: Gerenciar Doadores ────────────────────────────── */}
      {activeModal === "gerenciar-doadores" && (
        <Modal title="Gerenciar Doadores" onClose={() => setActiveModal(null)}>
          {doadores.length === 0 ? (
            <p style={{ fontSize: "13px", color: "var(--text-muted)", textAlign: "center", padding: "20px 0" }}>Nenhum doador cadastrado</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "400px", overflowY: "auto" }}>
              {doadores.map((d) => (
                <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "var(--salmon-light)", borderRadius: "8px" }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{d.nome}</p>
                    <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
                      {d.tipo === "PESSOA_FISICA" ? "PF" : "PJ"} {d.telefone && `• ${d.telefone}`} {d.email && `• ${d.email}`}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button onClick={() => openEditarDoador(d)} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "16px", padding: 0 }}>✏️</button>
                    <button onClick={() => deletarDoador(d.id, d.nome)} aria-label={`Excluir ${d.nome}`} style={{ padding: "5px 10px", border: "0.5px solid #fca5a5", borderRadius: "8px", color: "#DC2626", background: "#fef2f2", cursor: "pointer", display: "flex", alignItems: "center" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#fee2e2")} onMouseLeave={(e) => (e.currentTarget.style.background = "#fef2f2")}><IconTrash /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px" }}>
            <Button variant="ghost" onClick={() => setActiveModal(null)}>Fechar</Button>
            <Button variant="secondary" onClick={() => { setActiveModal("doador"); setEditingDoadorId(null); setFormDoador({ nome: "", tipo: "PESSOA_FISICA", telefone: "", email: "" }); setFormErrors({}); }}>+ Novo Doador</Button>
          </div>
        </Modal>
      )}

      {/* ── Modal de Confirmação ────────────────────────────────── */}
      {confirmDelete && (
        <ConfirmModal
          title="Confirmar Exclusão"
          message={
            confirmDelete.type === 'campanha'
              ? `Tem certeza que deseja excluir a campanha "${confirmDelete.name}"? Esta ação não pode ser desfeita.`
              : confirmDelete.type === 'doador'
              ? `Tem certeza que deseja excluir o doador "${confirmDelete.name}"? Esta ação não pode ser desfeita.`
              : `Tem certeza que deseja excluir esta doação? Esta ação não pode ser desfeita.`
          }
          onConfirm={executarDelete}
          onCancel={() => setConfirmDelete(null)}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}
