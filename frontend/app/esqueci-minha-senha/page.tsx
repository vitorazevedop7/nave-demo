"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import PasswordRecoveryCard from "@/components/PasswordRecoveryCard";
import { API_URL } from "@/lib/api";

const genericMessage =
  "Se o e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha.";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/esqueci-minha-senha`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.status === 429) {
        throw new Error("Muitas solicitações. Aguarde alguns minutos e tente novamente.");
      }
      if (response.status === 400) {
        throw new Error("Informe um e-mail válido.");
      }
      if (!response.ok) {
        throw new Error("Não foi possível processar a solicitação agora. Tente novamente.");
      }

      setSubmitted(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível processar a solicitação agora. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <PasswordRecoveryCard
      title="Recuperar acesso"
      subtitle="Informe seu e-mail. Se houver uma conta correspondente, enviaremos um link temporário para criar uma nova senha."
    >
      {submitted ? (
        <div>
          <StatusMessage tone="success">{genericMessage}</StatusMessage>
          <Link href="/login" style={secondaryLinkStyle}>
            Voltar para o login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "18px" }}>
          <label style={labelStyle}>
            E-MAIL
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seu@email.com"
              style={inputStyle}
            />
          </label>

          {error && <StatusMessage tone="error">{error}</StatusMessage>}

          <button type="submit" disabled={loading} style={buttonStyle(loading)}>
            {loading ? "Enviando..." : "Enviar instruções"}
          </button>
          <Link href="/login" style={secondaryLinkStyle}>
            Voltar para o login
          </Link>
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
        marginBottom: success ? "22px" : 0,
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
  color: "#9a4c41",
  fontSize: "13px",
  fontWeight: 700,
  textAlign: "center",
  textDecoration: "none",
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
