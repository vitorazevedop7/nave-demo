"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import Button from "@/components/Button";
import type { FormAnamnese } from "@/lib/types/prontuario";
import type { CheckboxFieldKey } from "../_lib/tipos";

export const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "11px", fontWeight: 700, color: "#2B1F14", marginBottom: "8px",
};

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#2B1F14", gridColumn: "1 / -1" }}>{children}</h3>;
}

export function Modal({ titulo, subtitulo, onClose, children }: {
  titulo: string; subtitulo: string; onClose: () => void; children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={titulo} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
      <div style={{ background: "#fff", borderRadius: "16px", width: "95%", maxWidth: "700px", maxHeight: "90vh", overflow: "auto", boxShadow: "0 10px 40px rgba(0,0,0,0.2)", position: "relative" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "24px", borderBottom: "0.5px solid #e0dbd2", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#2B1F14" }}>{titulo}</h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#9B8E84" }}>{subtitulo}</p>
          </div>
          <button type="button" aria-label="Fechar" onClick={onClose} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#9B8E84", lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

export function ProgressBar({ total, current, descricao }: { total: number; current: number; descricao: string }) {
  return (
    <div style={{ padding: "16px 24px", borderBottom: "0.5px solid #e0dbd2" }}>
      <div style={{ display: "flex", gap: "8px" }}>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} style={{ flex: 1, height: "6px", background: current >= i + 1 ? "#E07A6E" : "#e0dbd2", borderRadius: "3px", transition: "background 0.2s" }} />
        ))}
      </div>
      <p style={{ fontSize: "11px", color: "#9B8E84", margin: "8px 0 0 0", fontWeight: 600 }}>
        Etapa {current} de {total} — {descricao}
      </p>
    </div>
  );
}

export function ModalBody({ errors, children }: { errors: Record<string, string>; children: React.ReactNode }) {
  return (
    <div style={{ padding: "24px" }}>
      {errors.submit && (
        <div style={{ background: "#fee", color: "#c33", padding: "12px", borderRadius: "8px", fontSize: "12px", marginBottom: "16px" }}>
          {errors.submit}
        </div>
      )}
      {children}
    </div>
  );
}

export function ModalFooter({ onBack, onNext, onSave, onPrint, submitting, isUpdate }: {
  onBack?: () => void;
  onNext?: () => void;
  onSave?: () => void;
  onPrint?: () => void;
  submitting: boolean;
  isUpdate?: boolean;
}) {
  return (
    <div style={{ padding: "16px 24px", borderTop: "0.5px solid #e0dbd2", display: "flex", gap: "12px", justifyContent: "flex-end", position: "sticky", bottom: 0, background: "#fff" }}>
      {onBack && (
        <Button variant="ghost" size="sm" onClick={onBack} style={{ padding: "8px 16px", fontSize: "12px" }}>
          Anterior
        </Button>
      )}
      {onPrint && (
        <Button variant="ghost" size="sm" onClick={onPrint} style={{ padding: "8px 16px", fontSize: "12px" }}>
          Imprimir PDF
        </Button>
      )}
      {onNext && (
        <Button size="sm" onClick={onNext} style={{ padding: "8px 16px", fontSize: "12px" }}>
          Próximo
        </Button>
      )}
      {onSave && (
        <Button size="sm" onClick={onSave} disabled={submitting} style={{ padding: "8px 16px", fontSize: "12px" }}>
          {submitting ? "Salvando..." : isUpdate ? "Atualizar Prontuário" : "Salvar Prontuário"}
        </Button>
      )}
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

type FieldProps = {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; error?: string; disabled?: boolean;
  textarea?: boolean; gridSpan?: number;
  options?: { value: string; label: string }[];
};

export function Field({ label, value, onChange, type = "text", error, disabled = false, textarea = false, gridSpan = 1, options }: FieldProps) {
  const border = error ? "1px solid #c33" : "0.5px solid #d6d0c4";
  const base: React.CSSProperties = { width: "100%", padding: "10px 12px", border, borderRadius: "8px", fontSize: "12px", fontFamily: "inherit", opacity: disabled ? 0.6 : 1 };
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const campoId = useId();
  const erroId = `${campoId}-erro`;
  const ariaCampo = { id: campoId, "aria-invalid": error ? true : undefined, "aria-describedby": error ? erroId : undefined };

  useEffect(() => {
    if (!textarea || !textareaRef.current) return;
    const el = textareaRef.current;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [textarea, value]);

  const handleTextareaInput = () => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  return (
    <div style={{ gridColumn: gridSpan > 1 ? "1 / -1" : undefined }}>
      <label htmlFor={campoId} style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#2B1F14", marginBottom: "6px" }}>{label}</label>
      {textarea ? (
        <textarea
          {...ariaCampo}
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onInput={handleTextareaInput}
          disabled={disabled}
          style={{ ...base, minHeight: "60px", resize: "none", overflow: "hidden" }}
        />
      ) : options ? (
        <select {...ariaCampo} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} style={{ ...base, background: disabled ? "#f7f7f7" : "#fff" }}>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input {...ariaCampo} type={type} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} style={base} />
      )}
      {error && <p id={erroId} role="alert" style={{ fontSize: "11px", color: "#c33", margin: "4px 0 0 0" }}>{error}</p>}
    </div>
  );
}

// ─── CheckboxGroup ────────────────────────────────────────────────────────────

type CheckboxGroupProps = {
  items: { key: CheckboxFieldKey; label: string }[];
  form: FormAnamnese;
  onChange: (field: CheckboxFieldKey, checked: boolean) => void;
};

export function CheckboxGroup({ items, form, onChange }: CheckboxGroupProps) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
      {items.map((item) => (
        <label key={item.key} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", cursor: "pointer" }}>
          <input type="checkbox" checked={Boolean(form[item.key])} onChange={(e) => onChange(item.key, e.target.checked)} style={{ cursor: "pointer" }} />
          {item.label}
        </label>
      ))}
    </div>
  );
}

// ─── MultiSelectGroup ─────────────────────────────────────────────────────────

export function MultiSelectGroup({ value, options, onChange }: { value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  const selected = value ? value.split(" | ").map((s) => s.trim()).filter(Boolean) : [];
  const toggle = (label: string) => {
    const next = selected.includes(label) ? selected.filter((s) => s !== label) : [...selected, label];
    onChange(next.join(" | "));
  };
  return (
    <div style={{ display: "grid", gap: "8px" }}>
      {options.map((o) => (
        <label key={o.value} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12px", cursor: "pointer", lineHeight: 1.35 }}>
          <input type="checkbox" checked={selected.includes(o.label)} onChange={() => toggle(o.label)} style={{ cursor: "pointer", marginTop: "2px" }} />
          <span>{o.label}</span>
        </label>
      ))}
    </div>
  );
}
