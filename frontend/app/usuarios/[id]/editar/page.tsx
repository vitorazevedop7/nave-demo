"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchAuth } from "@/lib/auth";
import { API_URL } from "@/lib/api";
import { formatarTimestamp } from "@/lib/date";
import { useDialog } from "@/components/DialogProvider";
import Button from "@/components/Button";

// ─── Constantes ─────────────────────────────────────────────────────────────

const ESPECIALIDADES: { value: string; label: string }[] = [
  { value: "PSICOLOGIA", label: "Psicologia" },
  { value: "ASSISTENCIA_SOCIAL", label: "Assistência Social" },
  { value: "ACUPUNTURA", label: "Acupuntura" },
  { value: "FISIOTERAPIA", label: "Fisioterapia" },
  { value: "FEPAD", label: "FEPAD" },
];

const PERFIS = [
  {
    value: "GESTORA",
    label: "Gestora",
    desc: "Acesso total ao sistema e gerenciamento de equipe",
  },
  {
    value: "TRIADORA",
    label: "Triadora",
    desc: "Realiza triagens e encaminhamentos iniciais",
  },
  {
    value: "PROFISSIONAL",
    label: "Profissional",
    desc: "Atende beneficiários e registra prontuários",
  },
];

// ─── Tipos ───────────────────────────────────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getIniciais(nome: string): string {
  return nome.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0].toUpperCase()).join("");
}

// `criado_em` é um timestamp real — a conversão para o fuso local é correta.
function formatarData(iso: string): string {
  return formatarTimestamp(iso, { day: "2-digit", month: "long", year: "numeric" });
}

function validateEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  border: "0.5px solid #d6d0c4",
  borderRadius: "10px",
  fontSize: "13px",
  color: "#2B1F14",
  background: "#faf9f6",
  outline: "none",
  transition: "border-color 0.15s, background 0.15s",
  fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontWeight: 700,
  color: "#6B5E54",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: "6px",
};

const sectionDivider: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  color: "#9B8E84",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  paddingBottom: "10px",
  borderBottom: "0.5px solid #e0dbd2",
  marginBottom: "20px",
};

// ─── Componentes auxiliares ──────────────────────────────────────────────────

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p role="alert" style={{ fontSize: "11px", color: "#e07a6e", marginTop: "5px" }}>
      {msg}
    </p>
  );
}

function Required() {
  return <span style={{ color: "#e07a6e" }}> *</span>;
}

// ─── Página ──────────────────────────────────────────────────────────────────

export default function EditarProfissional() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { confirm, alert } = useDialog();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [form, setForm] = useState({
    nome: "",
    email: "",
    especialidade: "",
    perfis: [] as string[],
  });

  const [senha, setSenha] = useState({ nova: "", confirmar: "" });
  const [showSenhaFields, setShowSenhaFields] = useState(false);
  const [showNova, setShowNova] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch inicial ────────────────────────────────────────────────────────

  useEffect(() => {
    fetchAuth(`${API_URL}/usuarios/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Usuário não encontrado (${res.status})`);
        return res.json();
      })
      .then((data: Usuario) => {
        setUsuario(data);
        setForm({
          nome: data.nome,
          email: data.email,
          especialidade: data.especialidade ?? "",
          perfis: data.perfis_usuario.map((p) => p.perfil),
        });
        setFetchLoading(false);
      })
      .catch((err: Error) => {
        setFetchError(err.message);
        setFetchLoading(false);
      });
  }, [id]);

  // ── Validação ────────────────────────────────────────────────────────────

  function validateField(name: string, value: string) {
    const errs = { ...errors };
    if (name === "nome") {
      errs.nome = value.trim().length < 2 ? "Nome é obrigatório." : "";
    }
    if (name === "email") {
      errs.email = !value.trim()
        ? "E-mail é obrigatório."
        : !validateEmail(value)
        ? "Informe um e-mail válido."
        : "";
    }
    if (name === "novaSenha") {
      errs.novaSenha = value.length < 6 ? "Mínimo de 6 caracteres." : "";
      if (senha.confirmar && value !== senha.confirmar) {
        errs.confirmarSenha = "As senhas não coincidem.";
      } else if (senha.confirmar) {
        errs.confirmarSenha = "";
      }
    }
    if (name === "confirmarSenha") {
      errs.confirmarSenha = value !== senha.nova ? "As senhas não coincidem." : "";
    }
    setErrors(errs);
  }

  function togglePerfil(value: string) {
    setForm((f) => {
      const perfis = f.perfis.includes(value)
        ? f.perfis.filter((p) => p !== value)
        : [...f.perfis, value];
      if (errors.perfis && perfis.length > 0) {
        setErrors((e) => ({ ...e, perfis: "" }));
      }
      return { ...f, perfis };
    });
  }

  // ── Submit ───────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errs: Record<string, string> = {};
    if (form.nome.trim().length < 2) errs.nome = "Nome é obrigatório.";
    if (!form.email.trim()) errs.email = "E-mail é obrigatório.";
    else if (!validateEmail(form.email)) errs.email = "Informe um e-mail válido.";
    if (form.perfis.length === 0) errs.perfis = "Selecione ao menos um perfil.";
    if (showSenhaFields) {
      if (senha.nova.length < 6) errs.novaSenha = "Mínimo de 6 caracteres.";
      if (senha.confirmar !== senha.nova) errs.confirmarSenha = "As senhas não coincidem.";
    }

    if (Object.values(errs).some(Boolean)) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    setSubmitError(null);

    try {
      const body: Record<string, unknown> = {
        nome: form.nome.trim(),
        email: form.email.trim(),
        especialidade: form.especialidade || null,
        perfis: form.perfis,
      };
      if (showSenhaFields && senha.nova) {
        body.senha = senha.nova;
      }

      const res = await fetchAuth(`${API_URL}/usuarios/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? `Erro ${res.status}`);
      }

      router.push("/profissionais");
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Erro ao salvar alterações.");
      setSaving(false);
    }
  }

  // ── Excluir ──────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!usuario) return;
    const ok = await confirm({
      title: "Excluir profissional",
      message: `Excluir permanentemente "${usuario.nome}"? Esta ação não pode ser desfeita.`,
      confirmLabel: "Excluir",
      variant: "danger",
    });
    if (!ok) return;

    setDeleting(true);
    try {
      const res = await fetchAuth(`${API_URL}/usuarios/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao excluir.");
      router.push("/profissionais");
    } catch {
      await alert({ message: "Não foi possível excluir o profissional.", tone: "error" });
      setDeleting(false);
    }
  }

  // ── Desativar / Reativar ─────────────────────────────────────────────────

  async function handleToggleAtivo() {
    if (!usuario) return;
    const acao = usuario.ativo ? "desativar" : "reativar";
    const ok = await confirm({
      title: usuario.ativo ? "Desativar profissional" : "Reativar profissional",
      message: `Deseja ${acao} este profissional?`,
      confirmLabel: acao.charAt(0).toUpperCase() + acao.slice(1),
    });
    if (!ok) return;

    setDeactivating(true);
    try {
      const res = await fetchAuth(`${API_URL}/usuarios/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !usuario.ativo }),
      });
      if (!res.ok) throw new Error("Falha na operação.");
      router.push("/profissionais");
    } catch {
      await alert({ message: "Não foi possível realizar a operação.", tone: "error" });
      setDeactivating(false);
    }
  }

  // ── Estados de carregamento / erro de fetch ──────────────────────────────

  if (fetchLoading) {
    return (
      <div style={{ paddingTop: "80px", paddingBottom: "36px", paddingLeft: "32px", paddingRight: "32px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            border: "2.5px solid #e0dbd2",
            borderTopColor: "#E07A6E",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <p style={{ fontSize: "13px", color: "#9B8E84", marginTop: "16px" }}>Carregando dados do profissional...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div style={{ padding: "36px 32px" }}>
        <Link href="/profissionais" style={{ fontSize: "13px", color: "#6B5E54", textDecoration: "none" }}>
          ← Voltar
        </Link>
        <div style={{ marginTop: "24px", background: "#fdf0ef", border: "0.5px solid #e07a6e", borderRadius: "12px", padding: "20px", maxWidth: "480px" }}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#c05a2a" }}>Erro ao carregar profissional</p>
          <p style={{ fontSize: "12px", color: "#6B5E54", marginTop: "4px" }}>{fetchError}</p>
        </div>
      </div>
    );
  }

  // ── Render principal ─────────────────────────────────────────────────────

  return (
    <div style={{ padding: "36px 32px", minHeight: "100vh" }}>
      {/* Botão Voltar */}
      <Link
        href="/profissionais"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "13px",
          fontWeight: 600,
          color: "#6B5E54",
          textDecoration: "none",
          marginBottom: "20px",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Voltar para Profissionais
      </Link>

      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#2B1F14", margin: 0 }}>
          Editar Profissional
        </h1>
        <p style={{ fontSize: "13px", color: "#6B5E54", marginTop: "4px" }}>
          Atualize os dados e configurações de acesso do profissional.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div
          style={{
            background: "rgba(255, 255, 255, 0.92)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            borderRadius: "16px",
            border: "0.5px solid rgba(220, 200, 190, 0.45)",
            padding: "32px",
            width: "100%",
            boxShadow: "0 2px 12px rgba(224, 122, 110, 0.05)",
          }}
        >
          {/* ── Profile Banner ── */}
          {usuario && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                background: "#FDE8E4",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "28px",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "#E07A6E",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#ffffff",
                  flexShrink: 0,
                }}
              >
                {getIniciais(usuario.nome)}
              </div>
              <div>
                <p style={{ fontSize: "15px", fontWeight: 700, color: "#2B1F14", margin: 0 }}>
                  {usuario.nome}
                </p>
                <p style={{ fontSize: "12px", color: "#6B5E54", marginTop: "2px" }}>
                  Cadastrado em {formatarData(usuario.criado_em)}
                </p>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "3px 12px",
                    borderRadius: "9999px",
                    fontSize: "11px",
                    fontWeight: 700,
                    background: usuario.ativo ? "#D4EDD4" : "#f5f2eb",
                    color: usuario.ativo ? "#3D7845" : "#5a5a50",
                    border: `0.5px solid ${usuario.ativo ? "#b4d4b4" : "#e0dbd2"}`,
                  }}
                >
                  {usuario.ativo ? "Ativo" : "Inativo"}
                </span>
              </div>
            </div>
          )}

          {/* Erro geral */}
          {submitError && (
            <div
              role="alert"
              style={{
                background: "#fdf0ef",
                border: "0.5px solid #e07a6e",
                borderRadius: "10px",
                padding: "12px 16px",
                fontSize: "13px",
                color: "#c05a2a",
                marginBottom: "24px",
              }}
            >
              {submitError}
            </div>
          )}

          {/* ── Seção: Dados Pessoais ── */}
          <div style={sectionDivider}>Dados Pessoais</div>

          {/* Nome */}
          <div style={{ marginBottom: "20px" }}>
            <label htmlFor="nome" style={labelStyle}>
              Nome completo<Required />
            </label>
            <input
              id="nome"
              type="text"
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              onBlur={(e) => validateField("nome", e.target.value)}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#E07A6E";
                e.currentTarget.style.background = "#ffffff";
              }}
              onBlurCapture={(e) => {
                e.currentTarget.style.borderColor = errors.nome ? "#e07a6e" : "#d6d0c4";
                e.currentTarget.style.background = "#faf9f6";
              }}
              style={{ ...inputBase, borderColor: errors.nome ? "#e07a6e" : "#d6d0c4" }}
            />
            <FieldError msg={errors.nome} />
          </div>

          {/* Email */}
          <div style={{ marginBottom: "20px" }}>
            <label htmlFor="email" style={labelStyle}>
              E-mail<Required />
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              onBlur={(e) => validateField("email", e.target.value)}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#E07A6E";
                e.currentTarget.style.background = "#ffffff";
              }}
              onBlurCapture={(e) => {
                e.currentTarget.style.borderColor = errors.email ? "#e07a6e" : "#d6d0c4";
                e.currentTarget.style.background = "#faf9f6";
              }}
              style={{ ...inputBase, borderColor: errors.email ? "#e07a6e" : "#d6d0c4" }}
            />
            <FieldError msg={errors.email} />
          </div>

          {/* Redefinir Senha */}
          <div style={{ marginBottom: "20px" }}>
            {!showSenhaFields ? (
              <div>
                <p style={labelStyle}>Senha</p>
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowSenhaFields(true)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Redefinir senha
                </Button>
                <p style={{ fontSize: "11px", color: "#9B8E84", marginTop: "6px" }}>
                  Clique para definir uma nova senha para este profissional.
                </p>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <p style={{ ...labelStyle, margin: 0 }}>Nova senha</p>
                  <button
                    type="button"
                    onClick={() => { setShowSenhaFields(false); setSenha({ nova: "", confirmar: "" }); setErrors((e) => ({ ...e, novaSenha: "", confirmarSenha: "" })); }}
                    style={{ fontSize: "11px", color: "#9B8E84", background: "none", border: "none", cursor: "pointer" }}
                  >
                    Cancelar redefinição
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  {/* Nova senha */}
                  <div>
                    <label htmlFor="novaSenha" style={{ ...labelStyle, marginBottom: "6px" }}>
                      Nova senha<Required />
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        id="novaSenha"
                        type={showNova ? "text" : "password"}
                        value={senha.nova}
                        placeholder="Mín. 6 caracteres"
                        onChange={(e) => setSenha((s) => ({ ...s, nova: e.target.value }))}
                        onBlur={(e) => validateField("novaSenha", e.target.value)}
                        onFocus={(e) => { e.currentTarget.style.borderColor = "#E07A6E"; e.currentTarget.style.background = "#ffffff"; }}
                        onBlurCapture={(e) => { e.currentTarget.style.borderColor = errors.novaSenha ? "#e07a6e" : "#d6d0c4"; e.currentTarget.style.background = "#faf9f6"; }}
                        style={{ ...inputBase, paddingRight: "40px", borderColor: errors.novaSenha ? "#e07a6e" : "#d6d0c4" }}
                      />
                      <button type="button" aria-label="Alternar visibilidade" onClick={() => setShowNova((v) => !v)}
                        style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9B8E84", padding: 0, display: "flex" }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          {showNova ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
                        </svg>
                      </button>
                    </div>
                    <FieldError msg={errors.novaSenha} />
                  </div>

                  {/* Confirmar nova senha */}
                  <div>
                    <label htmlFor="confirmarSenha" style={{ ...labelStyle, marginBottom: "6px" }}>
                      Confirmar nova senha<Required />
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        id="confirmarSenha"
                        type={showConfirmar ? "text" : "password"}
                        value={senha.confirmar}
                        placeholder="Repita a senha"
                        onChange={(e) => setSenha((s) => ({ ...s, confirmar: e.target.value }))}
                        onBlur={(e) => validateField("confirmarSenha", e.target.value)}
                        onFocus={(e) => { e.currentTarget.style.borderColor = "#E07A6E"; e.currentTarget.style.background = "#ffffff"; }}
                        onBlurCapture={(e) => { e.currentTarget.style.borderColor = errors.confirmarSenha ? "#e07a6e" : "#d6d0c4"; e.currentTarget.style.background = "#faf9f6"; }}
                        style={{ ...inputBase, paddingRight: "40px", borderColor: errors.confirmarSenha ? "#e07a6e" : "#d6d0c4" }}
                      />
                      <button type="button" aria-label="Alternar visibilidade" onClick={() => setShowConfirmar((v) => !v)}
                        style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9B8E84", padding: 0, display: "flex" }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          {showConfirmar ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
                        </svg>
                      </button>
                    </div>
                    <FieldError msg={errors.confirmarSenha} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Seção: Configurações de Acesso ── */}
          <div style={{ ...sectionDivider, marginTop: "12px" }}>Configurações de Acesso</div>

          {/* Especialidade */}
          <div style={{ marginBottom: "20px" }}>
            <label htmlFor="especialidade" style={labelStyle}>
              Especialidade
              <span style={{ color: "#9B8E84", fontWeight: 400, textTransform: "none", letterSpacing: 0, marginLeft: "6px", fontSize: "10px" }}>
                (opcional)
              </span>
            </label>
            <select
              id="especialidade"
              value={form.especialidade}
              onChange={(e) => setForm((f) => ({ ...f, especialidade: e.target.value }))}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#E07A6E"; e.currentTarget.style.background = "#ffffff"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#d6d0c4"; e.currentTarget.style.background = "#faf9f6"; }}
              style={{ ...inputBase, cursor: "pointer" }}
            >
              <option value="">Sem especialidade definida</option>
              {ESPECIALIDADES.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
          </div>

          {/* Perfis */}
          <div style={{ marginBottom: "8px" }}>
            <p style={{ ...labelStyle, marginBottom: "10px" }}>
              Perfis de acesso<Required />
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {PERFIS.map((p) => {
                const checked = form.perfis.includes(p.value);
                return (
                  <div
                    key={p.value}
                    role="checkbox"
                    aria-checked={checked}
                    tabIndex={0}
                    onClick={() => togglePerfil(p.value)}
                    onKeyDown={(e) => e.key === " " && togglePerfil(p.value)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 14px",
                      border: `0.5px solid ${checked ? "#E07A6E" : errors.perfis ? "#e07a6e" : "#d6d0c4"}`,
                      borderRadius: "10px",
                      cursor: "pointer",
                      background: checked ? "#FDE8E4" : "#faf9f6",
                      transition: "border-color 0.15s, background 0.15s",
                      userSelect: "none",
                    }}
                  >
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "4px",
                        border: `0.5px solid ${checked ? "#E07A6E" : "#d6d0c4"}`,
                        background: checked ? "#E07A6E" : "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transition: "background 0.15s",
                      }}
                    >
                      {checked && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "#2B1F14", margin: 0 }}>{p.label}</p>
                      <p style={{ fontSize: "11px", color: "#5a5a50", marginTop: "1px" }}>{p.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <FieldError msg={errors.perfis} />
          </div>

          {/* ── Footer do card ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "32px",
              paddingTop: "24px",
              borderTop: "0.5px solid #e0dbd2",
            }}
          >
            {/* Ação destrutiva à esquerda */}
            <button
              type="button"
              onClick={handleToggleAtivo}
              disabled={deactivating}
              style={{
                padding: "9px 16px",
                background: "#fef3ee",
                border: "0.5px solid #e07a6e",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 600,
                color: "#c05a2a",
                cursor: deactivating ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                opacity: deactivating ? 0.6 : 1,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { if (!deactivating) e.currentTarget.style.background = "#fce8e0"; }}
              onMouseLeave={(e) => { if (!deactivating) e.currentTarget.style.background = "#fef3ee"; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {usuario?.ativo ? (
                  <><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></>
                ) : (
                  <><polyline points="20 6 9 17 4 12" /></>
                )}
              </svg>
              {usuario?.ativo ? "Desativar profissional" : "Reativar profissional"}
            </button>

            {/* Ações à direita */}
            <div style={{ display: "flex", gap: "12px" }}>
              <Link
                href="/profissionais"
                style={{
                  padding: "10px 20px",
                  border: "0.5px solid #d6d0c4",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#6B5E54",
                  background: "#f5f2eb",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                Cancelar
              </Link>

              <Button type="submit" size="sm" disabled={saving}>
                {saving && (
                  <svg style={{ animation: "spin 0.8s linear infinite" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                )}
                {saving ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* ── Zona de Perigo ── */}
      <div
        style={{
          width: "100%",
          marginTop: "16px",
          border: "0.5px solid #e07a6e",
          borderRadius: "16px",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          background: "#fef3ee",
        }}
      >
        <div>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#2B1F14", margin: 0 }}>
            Excluir profissional
          </p>
          <p style={{ fontSize: "12px", color: "#5a5a50", marginTop: "3px" }}>
            Remove permanentemente o profissional do sistema. Esta ação não pode ser desfeita.
          </p>
        </div>
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
          style={{ flexShrink: 0 }}
        >
          {deleting ? (
            <svg style={{ animation: "spin 0.8s linear infinite" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          )}
          {deleting ? "Excluindo..." : "Excluir profissional"}
        </Button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
