"use client";

import Button from "@/components/Button";
import { Modal } from "./dialogos";
import { IconTrash } from "./indicadores";
import type { Doador, FormDoador, ModalType } from "../_lib/tipos";

interface ModalGerenciarDoadoresProps {
  doadores: Doador[];
  openEditarDoador: (d: Doador) => void;
  deletarDoador: (id: string, nome: string) => void;
  setActiveModal: (valor: ModalType) => void;
  setEditingDoadorId: (valor: string | null) => void;
  setFormDoador: (valor: FormDoador) => void;
  setFormErrors: (valor: Record<string, string>) => void;
}

export default function ModalGerenciarDoadores({ doadores, openEditarDoador, deletarDoador, setActiveModal, setEditingDoadorId, setFormDoador, setFormErrors }: ModalGerenciarDoadoresProps) {
  return (
    <Modal title="Gerenciar Doadores" onClose={() => setActiveModal(null)}>
      {doadores.length === 0 ? (
        <p style={{ fontSize: "13px", color: "var(--text-muted)", textAlign: "center", padding: "20px 0" }}>Nenhum doador cadastrado</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "400px", overflowY: "auto" }}>
          {doadores.map((d) => (
            <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "var(--salmon-light)", borderRadius: "8px" }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{d.nome}</p>
                <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
                  {d.tipo === "PESSOA_FISICA" ? "PF" : "PJ"} {d.telefone && `• ${d.telefone}`} {d.email && `• ${d.email}`}
                </p>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <button type="button" onClick={() => openEditarDoador(d)} aria-label={`Editar ${d.nome}`} title="Editar" style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "16px", padding: 0 }}>✏️</button>
                <button type="button" onClick={() => deletarDoador(d.id, d.nome)} aria-label={`Excluir ${d.nome}`} style={{ padding: "5px 10px", border: "0.5px solid #fca5a5", borderRadius: "8px", color: "#DC2626", background: "#fef2f2", cursor: "pointer", display: "flex", alignItems: "center" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#fee2e2")} onMouseLeave={(e) => (e.currentTarget.style.background = "#fef2f2")}><IconTrash /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px" }}>
        <Button variant="ghost" onClick={() => setActiveModal(null)}>Fechar</Button>
        <Button variant="secondary" onClick={() => { setActiveModal("doador"); setEditingDoadorId(null); setFormDoador({ nome: "", tipo: "PESSOA_FISICA", telefone: "", email: "" }); setFormErrors({}); }}>+ Novo Doador</Button>
      </div>
    </Modal>
  );
}
