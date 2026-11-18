"use client";

import { cloneElement, isValidElement, useEffect, useId, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Button from "@/components/Button";

/** Fecha o diálogo ao pressionar Esc. */
export function useFecharComEsc(onClose: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
}

/* ─── Confirmation Modal ──────────────────────────────────── */
export function ConfirmModal({
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
  useFecharComEsc(onCancel);
  return createPortal(
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
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
    </div>,
    document.body
  );
}

/* ─── Modal ─────────────────────────────────────────────────── */
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useFecharComEsc(onClose);
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
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
            type="button"
            aria-label="Fechar"
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
    </div>,
    document.body
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const id = useId();
  const campo = isValidElement<{ id?: string }>(children) ? cloneElement(children, { id: children.props.id ?? id }) : children;
  const campoId = isValidElement<{ id?: string }>(children) ? (children.props.id ?? id) : undefined;
  return (
    <div style={{ marginBottom: "16px" }}>
      <label htmlFor={campoId} style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </label>
      {campo}
    </div>
  );
}

export const inputStyle: CSSProperties = {
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
