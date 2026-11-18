"use client";

import type { ReactNode } from "react";
import type { FormAcupuntura } from "@/lib/types/prontuario";
import { Field } from "./ui";
import { estadoCivilOptions } from "../_lib/opcoes";

interface AcupunturaFormProps {
  formAcupuntura: FormAcupuntura;
  handleAcupuntura: (field: keyof FormAcupuntura, value: string) => void;
  blocoVisibilidade: ReactNode;
}

export default function AcupunturaForm({ formAcupuntura, handleAcupuntura, blocoVisibilidade }: AcupunturaFormProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
      <Field label="Nome" value={formAcupuntura.nome} onChange={(v) => handleAcupuntura("nome", v)} gridSpan={2} />
      <Field label="Endereço" value={formAcupuntura.endereco} onChange={(v) => handleAcupuntura("endereco", v)} gridSpan={2} />
      <Field label="Idade" value={formAcupuntura.idade} onChange={(v) => handleAcupuntura("idade", v)} />
      <Field label="Data nasc." type="date" value={formAcupuntura.data_nascimento} onChange={(v) => handleAcupuntura("data_nascimento", v)} />
      <Field label="Telefone" value={formAcupuntura.telefone} onChange={(v) => handleAcupuntura("telefone", v)} />
      <Field label="Profissão" value={formAcupuntura.profissao} onChange={(v) => handleAcupuntura("profissao", v)} />
      <Field label="Estado civil" value={formAcupuntura.estado_civil} onChange={(v) => handleAcupuntura("estado_civil", v)} options={estadoCivilOptions} />
      <Field label="Filho" value={formAcupuntura.filho} onChange={(v) => handleAcupuntura("filho", v)} />
      <Field label="Pacote" value={formAcupuntura.pacote} onChange={(v) => handleAcupuntura("pacote", v)} />
      <Field label="História" value={formAcupuntura.historia} onChange={(v) => handleAcupuntura("historia", v)} textarea gridSpan={2} />
      <Field label="IG" value={formAcupuntura.ig} onChange={(v) => handleAcupuntura("ig", v)} />
      <Field label="Sono" value={formAcupuntura.sono} onChange={(v) => handleAcupuntura("sono", v)} />
      <Field label="Alimentação" value={formAcupuntura.alimentacao} onChange={(v) => handleAcupuntura("alimentacao", v)} />
      <Field label="Língua" value={formAcupuntura.lingua} onChange={(v) => handleAcupuntura("lingua", v)} />
      <Field label="Data da consulta" type="date" value={formAcupuntura.data_consulta} onChange={(v) => handleAcupuntura("data_consulta", v)} />
      <Field label="Técnicas utilizadas" value={formAcupuntura.tecnicas_utilizadas} onChange={(v) => handleAcupuntura("tecnicas_utilizadas", v)} textarea gridSpan={2} />
      <div style={{ gridColumn: "1 / -1" }}>{blocoVisibilidade}</div>
    </div>
  );
}
