"use client";

import Button from "@/components/Button";
import { Field, Modal, inputStyle } from "./dialogos";
import { fmtPhone } from "../_lib/helpers";
import type { FormDoador, ModalType } from "../_lib/tipos";

interface ModalDoadorProps {
  formDoador: FormDoador;
  setFormDoador: (valor: FormDoador) => void;
  formErrors: Record<string, string>;
  editingDoadorId: string | null;
  setEditingDoadorId: (valor: string | null) => void;
  submitting: boolean;
  submitDoador: () => void;
  deletarDoador: (id: string, nome: string) => void;
  setActiveModal: (valor: ModalType) => void;
}

export default function ModalDoador({ formDoador, setFormDoador, formErrors, editingDoadorId, setEditingDoadorId, submitting, submitDoador, deletarDoador, setActiveModal }: ModalDoadorProps) {
  return (
    <Modal title={editingDoadorId ? "Editar Doador" : "Cadastrar Doador"} onClose={() => { setActiveModal(null); setEditingDoadorId(null); }}>
      {formErrors.form && <div style={{ padding: "10px", background: "var(--salmon-light)", color: "var(--salmon-dark)", borderRadius: "8px", marginBottom: "16px", fontSize: "13px" }}>{formErrors.form}</div>}
      <Field label="Nome *">
        <input type="text" style={inputStyle} value={formDoador.nome} onChange={(e) => setFormDoador({ ...formDoador, nome: e.target.value })} />
      </Field>
      <Field label="Tipo">
        <select style={inputStyle} value={formDoador.tipo} onChange={(e) => setFormDoador({ ...formDoador, tipo: e.target.value })}>
          <option value="PESSOA_FISICA">Pessoa Física</option>
          <option value="PESSOA_JURIDICA">Pessoa Jurídica</option>
        </select>
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Field label="Telefone">
          <div>
            <input type="text" placeholder="(XX) XXXXX-XXXX" style={inputStyle} value={formDoador.telefone} onChange={(e) => setFormDoador({ ...formDoador, telefone: fmtPhone(e.target.value) })} />
            {formErrors.telefone && <p style={{ fontSize: "11px", color: "var(--salmon-primary)", marginTop: "4px" }}>{formErrors.telefone}</p>}
          </div>
        </Field>
        <Field label="E-mail">
          <div>
            <input type="text" placeholder="doador@example.com" style={inputStyle} value={formDoador.email} onChange={(e) => setFormDoador({ ...formDoador, email: e.target.value })} />
            {formErrors.email && <p style={{ fontSize: "11px", color: "var(--salmon-primary)", marginTop: "4px" }}>{formErrors.email}</p>}
          </div>
        </Field>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", marginTop: "16px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          {editingDoadorId && <Button variant="danger" onClick={() => deletarDoador(editingDoadorId, formDoador.nome)}>Deletar</Button>}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Button variant="ghost" onClick={() => { setActiveModal(null); setEditingDoadorId(null); }}>Cancelar</Button>
          <Button onClick={submitDoador} disabled={submitting || !formDoador.nome}>
            {submitting ? "Salvando…" : editingDoadorId ? "Salvar Alterações" : "Cadastrar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
