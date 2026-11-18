"use client";

import Button from "@/components/Button";
import { formatarMoedaInput } from "@/lib/moeda";
import { Field, Modal, inputStyle } from "./dialogos";
import type { FormCampanha } from "../_lib/tipos";

interface ModalCampanhaProps {
  formCampanha: FormCampanha;
  setFormCampanha: (valor: FormCampanha) => void;
  editingCampanhaId: string | null;
  submitting: boolean;
  submitCampanha: () => void;
  resetFormCampanha: () => void;
}

export default function ModalCampanha({ formCampanha, setFormCampanha, editingCampanhaId, submitting, submitCampanha, resetFormCampanha }: ModalCampanhaProps) {
  return (
    <Modal title={editingCampanhaId ? "Editar Campanha" : "Nova Campanha"} onClose={resetFormCampanha}>
      <Field label="Nome *">
        <input type="text" style={inputStyle} value={formCampanha.nome} onChange={(e) => setFormCampanha({ ...formCampanha, nome: e.target.value })} />
      </Field>
      <Field label="Descrição">
        <textarea rows={3} style={{ ...inputStyle, resize: "vertical" }} value={formCampanha.descricao} onChange={(e) => setFormCampanha({ ...formCampanha, descricao: e.target.value })} />
      </Field>
      <Field label="Meta de Arrecadação (R$)">
        <input type="text" inputMode="numeric" placeholder="Deixe vazio para sem meta" style={inputStyle} value={formCampanha.meta_valor} onChange={(e) => setFormCampanha({ ...formCampanha, meta_valor: formatarMoedaInput(e.target.value) })} />
      </Field>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
        <Button variant="ghost" onClick={resetFormCampanha}>Cancelar</Button>
        <Button onClick={submitCampanha} disabled={submitting || !formCampanha.nome}>
          {submitting ? "Salvando…" : editingCampanhaId ? "Salvar Alterações" : "Criar Campanha"}
        </Button>
      </div>
    </Modal>
  );
}
