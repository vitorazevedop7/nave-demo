"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import Button from "@/components/Button";
import { FieldError, Required } from "./campos";
import { inputBase, labelStyle } from "./estilos";
import type { FormSenha } from "../_lib/tipos";

interface CampoRedefinirSenhaProps {
  showSenhaFields: boolean;
  setShowSenhaFields: (valor: boolean) => void;
  senha: FormSenha;
  setSenha: Dispatch<SetStateAction<FormSenha>>;
  errors: Record<string, string>;
  setErrors: Dispatch<SetStateAction<Record<string, string>>>;
  validateField: (name: string, value: string) => void;
}

export default function CampoRedefinirSenha({ showSenhaFields, setShowSenhaFields, senha, setSenha, errors, setErrors, validateField }: CampoRedefinirSenhaProps) {
  const [showNova, setShowNova] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);

  return (
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
  );
}
