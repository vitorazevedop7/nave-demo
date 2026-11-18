"use client";

import type { FormEvent } from "react";
import { createPortal } from "react-dom";
import Button from "@/components/Button";
import { formatarMoedaInput } from "@/lib/moeda";
import type { BazarUsuario as Usuario } from "@/lib/types/bazares";
import type { FormBazar } from "../_lib/tipos";

interface FormularioBazarProps {
  editingId: string | null;
  formData: FormBazar;
  setFormData: (valor: FormBazar) => void;
  handleSubmit: (e: FormEvent) => void;
  resetForm: () => void;
  profissionais: Usuario[];
  submitLoading: boolean;
}

export default function FormularioBazar({ editingId, formData, setFormData, handleSubmit, resetForm, profissionais, submitLoading }: FormularioBazarProps) {
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={editingId ? "Editar Bazar" : "Novo Bazar"}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          padding: "28px",
          maxWidth: "600px",
          width: "90%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(150, 65, 45, 0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0 0 20px" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#2B1F14", margin: 0 }}>
          {editingId ? "Editar Bazar" : "Novo Bazar"}
        </h2>
          <button type="button" onClick={() => resetForm()} aria-label="Fechar" title="Fechar" style={{ background: "none", border: "none", fontSize: "24px", lineHeight: 1, cursor: "pointer", color: "#9B8E84", padding: 0 }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label htmlFor="bazar-campo-1" style={{ fontSize: "12px", fontWeight: 600, color: "#4a4a42" }}>
              Nome do Bazar *
            </label>
            <input id="bazar-campo-1"
              type="text"
              required
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Bazar de Primavera"
              style={{
                width: "100%",
                padding: "10px 12px",
                marginTop: "6px",
                border: "0.5px solid #d6d0c4",
                borderRadius: "10px",
                fontSize: "13px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label htmlFor="bazar-campo-2" style={{ fontSize: "12px", fontWeight: 600, color: "#4a4a42" }}>
                Data *
              </label>
              <input id="bazar-campo-2"
                type="date"
                required
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  marginTop: "6px",
                  border: "0.5px solid #d6d0c4",
                  borderRadius: "10px",
                  fontSize: "13px",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label htmlFor="bazar-campo-3" style={{ fontSize: "12px", fontWeight: 600, color: "#4a4a42" }}>Local</label>
              <input id="bazar-campo-3"
                type="text"
                value={formData.local}
                onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                placeholder="Ex: Museu da Cidade"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  marginTop: "6px",
                  border: "0.5px solid #d6d0c4",
                  borderRadius: "10px",
                  fontSize: "13px",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label htmlFor="bazar-campo-4" style={{ fontSize: "12px", fontWeight: 600, color: "#4a4a42" }}>
                Horário Início
              </label>
              <input id="bazar-campo-4"
                type="time"
                value={formData.horario_inicio}
                onChange={(e) =>
                  setFormData({ ...formData, horario_inicio: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  marginTop: "6px",
                  border: "0.5px solid #d6d0c4",
                  borderRadius: "10px",
                  fontSize: "13px",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label htmlFor="bazar-campo-5" style={{ fontSize: "12px", fontWeight: 600, color: "#4a4a42" }}>
                Horário Fim
              </label>
              <input id="bazar-campo-5"
                type="time"
                value={formData.horario_fim}
                onChange={(e) => setFormData({ ...formData, horario_fim: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  marginTop: "6px",
                  border: "0.5px solid #d6d0c4",
                  borderRadius: "10px",
                  fontSize: "13px",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="bazar-campo-6" style={{ fontSize: "12px", fontWeight: 600, color: "#4a4a42" }}>
              Descrição
            </label>
            <textarea id="bazar-campo-6"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descrição do evento"
              style={{
                width: "100%",
                padding: "10px 12px",
                marginTop: "6px",
                border: "0.5px solid #d6d0c4",
                borderRadius: "10px",
                fontSize: "13px",
                boxSizing: "border-box",
                minHeight: "80px",
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
          </div>

          {editingId && (
            <div>
              <label htmlFor="bazar-campo-7" style={{ fontSize: "12px", fontWeight: 600, color: "#4a4a42" }}>
                Total Arrecadado
              </label>
              <input id="bazar-campo-7"
                type="text"
                inputMode="numeric"
                value={formData.total_arrecadado}
                onChange={(e) =>
                  setFormData({ ...formData, total_arrecadado: formatarMoedaInput(e.target.value) })
                }
                placeholder="0,00"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  marginTop: "6px",
                  border: "0.5px solid #d6d0c4",
                  borderRadius: "10px",
                  fontSize: "13px",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#4a4a42" }}>
              Profissionais *
            </label>
            <div
              style={{
                marginTop: "8px",
                border: "0.5px solid #d6d0c4",
                borderRadius: "10px",
                maxHeight: "200px",
                overflowY: "auto",
                padding: "8px",
              }}
            >
              {profissionais.map((prof) => (
                <label
                  key={prof.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "6px 8px",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.profissional_ids.includes(prof.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          profissional_ids: [...formData.profissional_ids, prof.id],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          profissional_ids: formData.profissional_ids.filter(
                            (id) => id !== prof.id
                          ),
                        });
                      }
                    }}
                    style={{ marginRight: "8px", cursor: "pointer" }}
                  />
                  {prof.nome}
                  {prof.especialidade && (
                    <span style={{ color: "#9B8E84", marginLeft: "4px" }}>
                      ({prof.especialidade})
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="bazar-campo-8" style={{ fontSize: "12px", fontWeight: 600, color: "#4a4a42" }}>
              Observações
            </label>
            <textarea id="bazar-campo-8"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Observações adicionais"
              style={{
                width: "100%",
                padding: "10px 12px",
                marginTop: "6px",
                border: "0.5px solid #d6d0c4",
                borderRadius: "10px",
                fontSize: "13px",
                boxSizing: "border-box",
                minHeight: "60px",
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
            <Button type="button" variant="ghost" size="sm" onClick={() => resetForm()} style={{ flex: 1 }}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={submitLoading} style={{ flex: 1 }}>
              {submitLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
