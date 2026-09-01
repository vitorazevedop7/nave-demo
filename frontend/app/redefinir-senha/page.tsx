"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import PasswordRecoveryCard from "@/components/PasswordRecoveryCard";
import { API_URL } from "@/lib/api";

export default function ResetPasswordPage() {
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tokenFromFragment = new URLSearchParams(
      window.location.hash.slice(1),
    ).get("token") ?? "";

    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }

    queueMicrotask(() => setToken(tokenFromFragment));
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (password !== confirmation) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError("Use pelo menos 8 caracteres, com uma letra e um número.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/redefinir-senha`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, novaSenha: password }),
      });

      if (response.status === 400) {
        throw new Error("Este link é inválido, expirou ou já foi utilizado.");
      }
      if (!response.ok) {
        throw new Error("Não foi possível redefinir a senha agora. Tente novamente.");
      }

      setSuccess(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível redefinir a senha agora. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <PasswordRecoveryCard
      title="Criar nova senha"
      subtitle="Escolha uma senha exclusiva para o sistema NAVE. O link só pode ser usado uma vez."
    >
      {token === null ? null : !token ? (
        <>
          <StatusMessage tone="error">
            Este link de redefinição é inválido ou está incompleto.
          </StatusMessage>
          <Link href="/esqueci-minha-senha" style={secondaryLinkStyle}>
            Solicitar um novo link
          </Link>
        </>
      ) : success ? (
        <>
          <StatusMessage tone="success">
            Sua senha foi redefinida com sucesso.
          </StatusMessage>
          <Link href="/login" style={primaryLinkStyle}>
            Entrar com a nova senha
          </Link>
        </>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "18px" }}>
          <label style={labelStyle}>
            NOVA SENHA
            <input
              type="password"
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              style={inputStyle}
            />
          </label>
          <p style={{ margin: "-10px 0 0", color: "#777068", fontSize: "12px" }}>
            Pelo menos 8 caracteres, com uma letra e um número.
          </p>
          <label style={labelStyle}>
            CONFIRMAR NOVA SENHA
            <input
              type="password"
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              style={inputStyle}
            />
          </label>

          {error && <StatusMessage tone="error">{error}</StatusMessage>}

          <button type="submit" disabled={loading} style={buttonStyle(loading)}>
            {loading ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>
      )}
    </PasswordRecoveryCard>
  );
}

function StatusMessage({
  children,
  tone,
}: {
  children: string;
  tone: "success" | "error";
}) {
  const success = tone === "success";
  return (
    <div
      role={success ? "status" : "alert"}
      style={{
        padding: "13px 15px",
        marginBottom: "20px",
        borderRadius: "11px",
        background: success ? "#edf7ee" : "#fdf0ef",
        border: `1px solid ${success ? "#b9d9bc" : "rgba(224, 122, 110, 0.3)"}`,
        color: success ? "#35683b" : "#a94740",
        fontSize: "13px",
        lineHeight: 1.5,
      }}
    >
      {children}
    </div>
  );
}

const labelStyle = {
  display: "grid",
  gap: "7px",
  color: "#4a4a42",
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.04em",
} as const;

const inputStyle = {
  height: "48px",
  padding: "0 16px",
  borderRadius: "12px",
  border: "1px solid rgba(210, 195, 178, 0.7)",
  background: "rgba(248, 244, 238, 0.72)",
  color: "#1a1915",
  fontSize: "14px",
  outlineColor: "#e07a6e",
} as const;

const secondaryLinkStyle = {
  display: "block",
  color: "#9a4c41",
  fontSize: "13px",
  fontWeight: 700,
  textAlign: "center",
  textDecoration: "none",
} as const;

const primaryLinkStyle = {
  ...secondaryLinkStyle,
  padding: "14px 18px",
  borderRadius: "12px",
  background: "linear-gradient(135deg, #e07a6e 0%, #c05a48 100%)",
  color: "white",
} as const;

const buttonStyle = (loading: boolean) =>
  ({
    height: "48px",
    border: 0,
    borderRadius: "12px",
    background: loading
      ? "rgba(224, 122, 110, 0.5)"
      : "linear-gradient(135deg, #e07a6e 0%, #c05a48 100%)",
    color: "white",
    cursor: loading ? "not-allowed" : "pointer",
    fontFamily: "inherit",
    fontSize: "14px",
    fontWeight: 700,
  }) as const;
