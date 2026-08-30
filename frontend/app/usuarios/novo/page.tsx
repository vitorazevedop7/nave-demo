"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchAuth } from "@/lib/auth";
import { API_URL } from "@/lib/api";
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

// ─── Estilos reutilizáveis ───────────────────────────────────────────────────

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

// ─── Validação ───────────────────────────────────────────────────────────────

function validateEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

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

export default function NovoProfissional() {
  const router = useRouter();

  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
    especialidade: "",
    perfis: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);

  // ── Validação por campo no blur ──────────────────────────────────────────

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
    if (name === "senha") {
      errs.senha = value.length < 6 ? "Mínimo de 6 caracteres." : "";
      if (form.confirmarSenha && value !== form.confirmarSenha) {
        errs.confirmarSenha = "As senhas não coincidem.";
      } else if (form.confirmarSenha) {
        errs.confirmarSenha = "";
      }
    }
    if (name === "confirmarSenha") {
      errs.confirmarSenha = value !== form.senha ? "As senhas não coincidem." : "";
    }
    setErrors(errs);
  }

  function handleChange(name: string, value: string) {
    setForm((f) => ({ ...f, [name]: value }));
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
    if (form.senha.length < 6) errs.senha = "Mínimo de 6 caracteres.";
    if (form.confirmarSenha !== form.senha) errs.confirmarSenha = "As senhas não coincidem.";
    if (form.perfis.length === 0) errs.perfis = "Selecione ao menos um perfil.";

    if (Object.values(errs).some(Boolean)) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setSubmitError(null);

    try {
      const body: Record<string, unknown> = {
        nome: form.nome.trim(),
        email: form.email.trim(),
        senha: form.senha,
        perfis: form.perfis,
      };
      if (form.especialidade) body.especialidade = form.especialidade;

      const res = await fetchAuth(`${API_URL}/usuarios`, {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? `Erro ${res.status}`);
      }

      router.push("/profissionais");
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Erro ao cadastrar profissional.");
      setLoading(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

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
          Novo Profissional
        </h1>
        <p style={{ fontSize: "13px", color: "#6B5E54", marginTop: "4px" }}>
          Preencha os dados para cadastrar um novo profissional na plataforma.
        </p>
      </div>

      {/* Card do formulário */}
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
          {/* Erro geral de submit */}
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
              placeholder="Ex: Ana Silva"
              onChange={(e) => handleChange("nome", e.target.value)}
              onBlur={(e) => validateField("nome", e.target.value)}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#E07A6E";
                e.currentTarget.style.background = "#ffffff";
              }}
              onMouseOut={(e) => {
                if (document.activeElement !== e.currentTarget) {
                  e.currentTarget.style.borderColor = errors.nome ? "#e07a6e" : "#d6d0c4";
                  e.currentTarget.style.background = "#faf9f6";
                }
              }}
              style={{
                ...inputBase,
                borderColor: errors.nome ? "#e07a6e" : "#d6d0c4",
              }}
              aria-describedby="nome-error"
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
              placeholder="Ex: profissional@example.com"
              onChange={(e) => handleChange("email", e.target.value)}
              onBlur={(e) => validateField("email", e.target.value)}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#E07A6E";
                e.currentTarget.style.background = "#ffffff";
              }}
              onBlurCapture={(e) => {
                e.currentTarget.style.borderColor = errors.email ? "#e07a6e" : "#d6d0c4";
                e.currentTarget.style.background = "#faf9f6";
              }}
              style={{
                ...inputBase,
                borderColor: errors.email ? "#e07a6e" : "#d6d0c4",
              }}
            />
            <FieldError msg={errors.email} />
          </div>

          {/* Senha + Confirmar Senha (lado a lado) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
            {/* Senha */}
            <div>
              <label htmlFor="senha" style={labelStyle}>
                Senha<Required />
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="senha"
                  type={showSenha ? "text" : "password"}
                  value={form.senha}
                  placeholder="Mín. 6 caracteres"
                  onChange={(e) => handleChange("senha", e.target.value)}
                  onBlur={(e) => validateField("senha", e.target.value)}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#E07A6E";
                    e.currentTarget.style.background = "#ffffff";
                  }}
                  onBlurCapture={(e) => {
                    e.currentTarget.style.borderColor = errors.senha ? "#e07a6e" : "#d6d0c4";
                    e.currentTarget.style.background = "#faf9f6";
                  }}
                  style={{
                    ...inputBase,
                    paddingRight: "40px",
                    borderColor: errors.senha ? "#e07a6e" : "#d6d0c4",
                  }}
                />
                <button
                  type="button"
                  aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"}
                  onClick={() => setShowSenha((v) => !v)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#9B8E84",
                    padding: 0,
                    display: "flex",
                  }}
                >
                  {showSenha ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              <FieldError msg={errors.senha} />
            </div>

            {/* Confirmar Senha */}
            <div>
              <label htmlFor="confirmarSenha" style={labelStyle}>
                Confirmar senha<Required />
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="confirmarSenha"
                  type={showConfirmar ? "text" : "password"}
                  value={form.confirmarSenha}
                  placeholder="Repita a senha"
                  onChange={(e) => handleChange("confirmarSenha", e.target.value)}
                  onBlur={(e) => validateField("confirmarSenha", e.target.value)}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#E07A6E";
                    e.currentTarget.style.background = "#ffffff";
                  }}
                  onBlurCapture={(e) => {
                    e.currentTarget.style.borderColor = errors.confirmarSenha ? "#e07a6e" : "#d6d0c4";
                    e.currentTarget.style.background = "#faf9f6";
                  }}
                  style={{
                    ...inputBase,
                    paddingRight: "40px",
                    borderColor: errors.confirmarSenha ? "#e07a6e" : "#d6d0c4",
                  }}
                />
                <button
                  type="button"
                  aria-label={showConfirmar ? "Ocultar senha" : "Mostrar senha"}
                  onClick={() => setShowConfirmar((v) => !v)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#9B8E84",
                    padding: 0,
                    display: "flex",
                  }}
                >
                  {showConfirmar ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              <FieldError msg={errors.confirmarSenha} />
            </div>
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
              onChange={(e) => handleChange("especialidade", e.target.value)}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#E07A6E";
                e.currentTarget.style.background = "#ffffff";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#d6d0c4";
                e.currentTarget.style.background = "#faf9f6";
              }}
              style={{
                ...inputBase,
                cursor: "pointer",
              }}
            >
              <option value="">Selecione uma especialidade</option>
              {ESPECIALIDADES.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
            <p style={{ fontSize: "11px", color: "#9B8E84", marginTop: "5px" }}>
              Deixe em branco caso o profissional não tenha especialidade definida.
            </p>
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
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "#2B1F14", margin: 0 }}>
                        {p.label}
                      </p>
                      <p style={{ fontSize: "11px", color: "#5a5a50", marginTop: "1px" }}>
                        {p.desc}
                      </p>
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
              justifyContent: "flex-end",
              gap: "12px",
              marginTop: "32px",
              paddingTop: "24px",
              borderTop: "0.5px solid #e0dbd2",
            }}
          >
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

            <Button type="submit" size="sm" disabled={loading}>
              {loading && (
                <svg
                  style={{ animation: "spin 0.8s linear infinite" }}
                  width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              )}
              {loading ? "Cadastrando..." : "Cadastrar Profissional"}
            </Button>
          </div>
        </div>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
