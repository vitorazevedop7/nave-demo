"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle, AlertTriangle, Info, XCircle } from "lucide-react";
import Modal from "./Modal";
import Button, { ButtonVariant } from "./Button";

type Tone = "success" | "error" | "info" | "warning";

interface ConfirmOptions {
  title?: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "danger";
}

interface AlertOptions {
  title?: string;
  message: React.ReactNode;
  okLabel?: string;
  tone?: Tone;
}

interface DialogContextValue {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  alert: (opts: AlertOptions) => Promise<void>;
}

const DialogContext = createContext<DialogContextValue | null>(null);

type ConfirmState = ConfirmOptions & {
  kind: "confirm";
  resolve: (v: boolean) => void;
};
type AlertState = AlertOptions & {
  kind: "alert";
  resolve: () => void;
};
type DialogState = ConfirmState | AlertState | null;

const toneConfig: Record<
  Tone,
  { color: string; Icon: typeof Info }
> = {
  success: { color: "var(--green-dark)", Icon: CheckCircle },
  error: { color: "#DC2626", Icon: XCircle },
  warning: { color: "#C05A48", Icon: AlertTriangle },
  info: { color: "var(--salmon-primary)", Icon: Info },
};

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogState>(null);

  const confirm = useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setDialog({ kind: "confirm", ...opts, resolve });
      }),
    []
  );

  const alert = useCallback(
    (opts: AlertOptions) =>
      new Promise<void>((resolve) => {
        setDialog({ kind: "alert", ...opts, resolve });
      }),
    []
  );

  const close = useCallback(() => setDialog(null), []);

  const handleConfirm = () => {
    if (dialog?.kind === "confirm") dialog.resolve(true);
    close();
  };
  const handleCancel = () => {
    if (dialog?.kind === "confirm") dialog.resolve(false);
    else if (dialog?.kind === "alert") dialog.resolve();
    close();
  };

  const messageStyle: React.CSSProperties = {
    color: "var(--text-secondary)",
    fontSize: "14px",
    lineHeight: 1.5,
  };

  let title: React.ReactNode = null;
  let body: React.ReactNode = null;
  let footer: React.ReactNode = null;

  if (dialog?.kind === "confirm") {
    const danger = dialog.variant === "danger";
    const tone = toneConfig[danger ? "warning" : "info"];
    title = (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
        <tone.Icon size={20} color={tone.color} />
        {dialog.title ?? "Confirmação"}
      </span>
    );
    body = <div style={messageStyle}>{dialog.message}</div>;
    footer = (
      <>
        <Button variant="ghost" onClick={handleCancel}>
          {dialog.cancelLabel ?? "Cancelar"}
        </Button>
        <Button
          variant={(dialog.variant ?? "primary") as ButtonVariant}
          onClick={handleConfirm}
          autoFocus
        >
          {dialog.confirmLabel ?? "Confirmar"}
        </Button>
      </>
    );
  } else if (dialog?.kind === "alert") {
    const tone = toneConfig[dialog.tone ?? "info"];
    title = (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
        <tone.Icon size={20} color={tone.color} />
        {dialog.title ?? "Aviso"}
      </span>
    );
    body = <div style={messageStyle}>{dialog.message}</div>;
    footer = (
      <Button variant="primary" onClick={handleCancel} autoFocus>
        {dialog.okLabel ?? "OK"}
      </Button>
    );
  }

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}
      <Modal
        open={dialog !== null}
        onClose={handleCancel}
        title={title}
        footer={footer}
      >
        {body}
      </Modal>
    </DialogContext.Provider>
  );
}

export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error("useDialog deve ser usado dentro de <DialogProvider>");
  }
  return ctx;
}
