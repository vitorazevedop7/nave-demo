"use client";

import dynamic from "next/dynamic";
import { useState, FormEvent } from "react";
import { API_URL } from "@/lib/api";

const LoginLogo3D = dynamic(() => import("@/components/LoginLogo3D"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: "100%",
        height: "280px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    />
  ),
});

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let res: Response;

      try {
        res = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, senha: password }),
        });
      } catch {
        throw new Error("Não foi possível conectar ao servidor. Verifique sua conexão com a internet.");
      }

      let data: {
        access_token?: string;
        usuario?: unknown;
        message?: string | string[];
        statusCode?: number;
      };
      try {
        data = await res.json();
      } catch {
        throw new Error("O servidor retornou uma resposta inesperada. Tente novamente.");
      }

      if (res.status === 401) {
        throw new Error("E-mail ou senha incorretos. Verifique seus dados e tente novamente.");
      }

      if (res.status === 400) {
        const msgs = Array.isArray(data.message) ? data.message : [data.message];
        const traducoes: Record<string, string> = {
          "email must be an email": "Informe um e-mail válido.",
          "senha must be longer than or equal to 6 characters": "A senha deve ter pelo menos 6 caracteres.",
          "senha must be a string": "A senha é obrigatória.",
        };
        const legivel = msgs
          .map((m) => (m ? (traducoes[m] ?? m) : null))
          .filter(Boolean)
          .join(" ");
        throw new Error(legivel || "Preencha todos os campos corretamente.");
      }

      if (res.status === 403) {
        throw new Error("Seu acesso está desativado. Entre em contato com o administrador.");
      }

      if (!res.ok) {
        throw new Error("Algo deu errado no servidor. Tente novamente em alguns instantes.");
      }

      localStorage.setItem("access_token", data.access_token as string);
      localStorage.setItem("usuario", JSON.stringify(data.usuario));
      window.location.href = "/";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 6vw",
        gap: "48px",
        background: "url('/imgs/fundo_referencia.png') center center / cover fixed",
      }}
    >
      {/* ── Card de login ── */}
      <div
        style={{
          flex: 1,
          maxWidth: "580px",
          borderRadius: "28px",
          boxShadow: "0 24px 80px rgba(80, 30, 20, 0.10), 0 4px 24px rgba(80, 30, 20, 0.06)",
        }}
      >
        <div
          style={{
            background: "rgba(255, 255, 255, 0.18)",
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            borderRadius: "28px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "72px 64px",
          }}
        >
          <div style={{ marginBottom: "36px" }}>
            <h2
              style={{
                fontSize: "1.6rem",
                fontWeight: 800,
                color: "#1a1915",
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              Bem-vinda de volta
            </h2>
            <p
              style={{
                fontSize: "13px",
                color: "#6a6660",
                marginTop: "6px",
              }}
            >
              Acesse o sistema com suas credenciais
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Campo e-mail */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label
                htmlFor="email"
                style={{ fontSize: "12px", fontWeight: 700, color: "#4a4a42", letterSpacing: "0.04em" }}
              >
                E-MAIL
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@example.com"
                style={{
                  height: "46px",
                  padding: "0 16px",
                  borderRadius: "12px",
                  border: "1px solid rgba(210, 195, 178, 0.7)",
                  background: "rgba(248, 244, 238, 0.6)",
                  fontSize: "14px",
                  color: "#1a1915",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#e07a6e")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(210, 195, 178, 0.7)")}
              />
            </div>

            {/* Campo senha */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label
                htmlFor="password"
                style={{ fontSize: "12px", fontWeight: 700, color: "#4a4a42", letterSpacing: "0.04em" }}
              >
                SENHA
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  height: "46px",
                  padding: "0 16px",
                  borderRadius: "12px",
                  border: "1px solid rgba(210, 195, 178, 0.7)",
                  background: "rgba(248, 244, 238, 0.6)",
                  fontSize: "14px",
                  color: "#1a1915",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#e07a6e")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(210, 195, 178, 0.7)")}
              />
            </div>

            {/* Mensagem de erro */}
            {error && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "#fdf0ef",
                  border: "0.5px solid rgba(224, 122, 110, 0.3)",
                  fontSize: "13px",
                  color: "#c0504a",
                }}
              >
                {error}
              </div>
            )}

            {/* Botão entrar */}
            <button
              type="submit"
              disabled={loading}
              style={{
                height: "48px",
                borderRadius: "12px",
                border: "none",
                background: loading
                  ? "rgba(224, 122, 110, 0.5)"
                  : "linear-gradient(135deg, #e07a6e 0%, #c05a48 100%)",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                letterSpacing: "0.02em",
                transition: "opacity 0.2s, transform 0.1s",
                marginTop: "4px",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p
            style={{
              marginTop: "32px",
              fontSize: "12px",
              color: "#9a9690",
              textAlign: "center",
            }}
          >
            Sistema de Triagem e Encaminhamento © NAVE
          </p>
        </div>
      </div>

      {/* ── Modelo 3D flutuando sobre o fundo ── */}
      <div
        className="login-model-panel"
        style={{
          flex: 1,
          maxWidth: "580px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <LoginLogo3D width="100%" height="580px" />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", marginTop: "8px" }}>
          <img
            src="/imgs/nave_iniciais_logo.png"
            alt="nave"
            style={{ height: "32px", width: "auto" }}
          />
          <p
            style={{
              fontSize: "12px",
              color: "rgba(80, 60, 50, 0.7)",
              margin: 0,
              letterSpacing: "0.04em",
            }}
          >
            Núcleo Assistencial Veleiro da Esperança
          </p>
        </div>
      </div>

      {/* CSS responsivo para mobile */}
      <style>{`
        @media (max-width: 768px) {
          .login-model-panel {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
