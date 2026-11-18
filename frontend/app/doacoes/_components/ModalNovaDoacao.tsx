"use client";

import Button from "@/components/Button";
import { formatarMoedaInput } from "@/lib/moeda";
import { Field, Modal, inputStyle } from "./dialogos";
import { contemBusca, getPlaceholder } from "../_lib/helpers";
import type { Campanha, Doador, FormDoacao, ModalType } from "../_lib/tipos";

interface ModalNovaDoacaoProps {
  formDoacao: FormDoacao;
  setFormDoacao: (valor: FormDoacao) => void;
  doadores: Doador[];
  campanhas: Campanha[];
  buscaDoador: string;
  setBuscaDoador: (valor: string) => void;
  buscaCampanha: string;
  setBuscaCampanha: (valor: string) => void;
  submitting: boolean;
  submitDoacao: () => void;
  setActiveModal: (valor: ModalType) => void;
}

export default function ModalNovaDoacao({ formDoacao, setFormDoacao, doadores, campanhas, buscaDoador, setBuscaDoador, buscaCampanha, setBuscaCampanha, submitting, submitDoacao, setActiveModal }: ModalNovaDoacaoProps) {
  return (
    <Modal title="Registrar Doação" onClose={() => setActiveModal(null)}>
      <Field label="Doador">
        <input
          type="text"
          placeholder="Buscar doador pelo nome…"
          aria-label="Buscar doador pelo nome"
          style={{ ...inputStyle, marginBottom: "6px" }}
          value={buscaDoador}
          onChange={(e) => setBuscaDoador(e.target.value)}
        />
        <select aria-label="Doador" style={inputStyle} value={formDoacao.doador_id} onChange={(e) => setFormDoacao({ ...formDoacao, doador_id: e.target.value })}>
          <option value="">Anônimo</option>
          {doadores
            .filter((d) => d.id === formDoacao.doador_id || contemBusca(d.nome, buscaDoador))
            .map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
        </select>
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Field label="Tipo">
          <select style={inputStyle} value={formDoacao.tipo} onChange={(e) => setFormDoacao({ ...formDoacao, tipo: e.target.value })}>
            <option value="DINHEIRO">Dinheiro</option>
            <option value="ALIMENTO">Alimento</option>
            <option value="ROUPA">Roupa</option>
            <option value="OUTRO">Outro</option>
          </select>
        </Field>
        <Field label="Data">
          <input type="date" style={inputStyle} value={formDoacao.data} onChange={(e) => setFormDoacao({ ...formDoacao, data: e.target.value })} />
        </Field>
      </div>
      {formDoacao.tipo === "DINHEIRO" ? (
        <Field label="Valor (R$)">
          <input type="text" inputMode="numeric" placeholder="0,00" style={inputStyle} value={formDoacao.valor} onChange={(e) => setFormDoacao({ ...formDoacao, valor: formatarMoedaInput(e.target.value) })} />
        </Field>
      ) : (
        <Field label="Quantidade / Descrição">
          <input type="text" placeholder={getPlaceholder(formDoacao.tipo)} style={inputStyle} value={formDoacao.quantidade} onChange={(e) => setFormDoacao({ ...formDoacao, quantidade: e.target.value })} />
        </Field>
      )}
      <Field label="Campanha (opcional)">
        <input
          type="text"
          placeholder="Buscar campanha pelo nome…"
          aria-label="Buscar campanha pelo nome"
          style={{ ...inputStyle, marginBottom: "6px" }}
          value={buscaCampanha}
          onChange={(e) => setBuscaCampanha(e.target.value)}
        />
        <select aria-label="Campanha" style={inputStyle} value={formDoacao.campanha_id} onChange={(e) => setFormDoacao({ ...formDoacao, campanha_id: e.target.value })}>
          <option value="">Sem campanha</option>
          {campanhas
            .filter((c) => !c.encerrada_em)
            .filter((c) => c.id === formDoacao.campanha_id || contemBusca(c.nome, buscaCampanha))
            .map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </Field>
      <Field label="Observação (opcional)">
        <input type="text" style={inputStyle} value={formDoacao.observacao} onChange={(e) => setFormDoacao({ ...formDoacao, observacao: e.target.value })} />
      </Field>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
        <Button variant="ghost" onClick={() => setActiveModal(null)}>Cancelar</Button>
        <Button onClick={submitDoacao} disabled={submitting}>
          {submitting ? "Salvando…" : "Registrar"}
        </Button>
      </div>
    </Modal>
  );
}
