"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchAuth } from "@/lib/auth";
import { API_URL, extrairMensagemErro } from "@/lib/api";
import { useDialog } from "@/components/DialogProvider";
import CabecalhoUsuario from "./_components/CabecalhoUsuario";
import SecaoDadosPessoais from "./_components/SecaoDadosPessoais";
import CampoRedefinirSenha from "./_components/CampoRedefinirSenha";
import SecaoAcesso from "./_components/SecaoAcesso";
import RodapeFormulario from "./_components/RodapeFormulario";
import ZonaDePerigo from "./_components/ZonaDePerigo";
import { validateEmail } from "./_lib/helpers";
import type { FormSenha, FormUsuario, Usuario } from "./_lib/tipos";

// ─── Página ──────────────────────────────────────────────────────────────────

export default function EditarProfissional() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { confirm, alert } = useDialog();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [form, setForm] = useState<FormUsuario>({
    nome: "",
    email: "",
    especialidade: "",
    perfis: [],
  });

  const [senha, setSenha] = useState<FormSenha>({ nova: "", confirmar: "" });
  const [showSenhaFields, setShowSenhaFields] = useState(false);

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

  async function handleSubmit(e: FormEvent) {
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
        throw new Error(await extrairMensagemErro(res, "Erro ao salvar alterações."));
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
            <CabecalhoUsuario usuario={usuario} />
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
          <SecaoDadosPessoais form={form} setForm={setForm} errors={errors} validateField={validateField} />

          {/* Redefinir Senha */}
          <CampoRedefinirSenha showSenhaFields={showSenhaFields} setShowSenhaFields={setShowSenhaFields} senha={senha} setSenha={setSenha} errors={errors} setErrors={setErrors} validateField={validateField} />

          {/* ── Seção: Configurações de Acesso ── */}
          <SecaoAcesso form={form} setForm={setForm} errors={errors} togglePerfil={togglePerfil} />

          {/* ── Footer do card ── */}
          <RodapeFormulario usuario={usuario} deactivating={deactivating} handleToggleAtivo={handleToggleAtivo} saving={saving} />
        </div>
      </form>

      {/* ── Zona de Perigo ── */}
      <ZonaDePerigo deleting={deleting} handleDelete={handleDelete} />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
