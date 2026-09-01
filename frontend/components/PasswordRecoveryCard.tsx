import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

interface PasswordRecoveryCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function PasswordRecoveryCard({
  title,
  subtitle,
  children,
}: PasswordRecoveryCardProps) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 20px",
        background: "url('/imgs/fundo_referencia.png') center center / cover fixed",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "520px",
          padding: "48px",
          borderRadius: "28px",
          background: "rgba(255, 255, 255, 0.3)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          border: "1px solid rgba(255, 255, 255, 0.4)",
          boxShadow:
            "0 24px 80px rgba(80, 30, 20, 0.10), 0 4px 24px rgba(80, 30, 20, 0.06)",
        }}
      >
        <Link
          href="/login"
          aria-label="Voltar para o login"
          style={{ display: "inline-flex", marginBottom: "28px" }}
        >
          <Image
            src="/imgs/nave_iniciais_logo.png"
            alt="NAVE"
            width={103}
            height={32}
            style={{ height: "32px", width: "auto" }}
          />
        </Link>

        <h1
          style={{
            margin: 0,
            color: "#1a1915",
            fontSize: "1.7rem",
            fontWeight: 800,
            letterSpacing: "-0.025em",
          }}
        >
          {title}
        </h1>
        <p
          style={{
            margin: "8px 0 30px",
            color: "#6a6660",
            fontSize: "14px",
            lineHeight: 1.6,
          }}
        >
          {subtitle}
        </p>

        {children}
      </section>
    </main>
  );
}
