"use client";

import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import type { BeneficiariaOpcao } from "@/lib/beneficiarias";
import BuscaBeneficiaria from "./BuscaBeneficiaria";
import { inputStyle, labelStyle } from "./estilos";
import { maskCPF, maskTelefone, type FormBeneficiaria } from "../_lib/formulario";

interface CamposNovaBeneficiariaProps {
  formB: FormBeneficiaria;
  setFormB: Dispatch<SetStateAction<FormBeneficiaria>>;
  changeB: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  precisaResponsavel: boolean;
  responsavelSelecionada: BeneficiariaOpcao | null;
  setResponsavelSelecionada: (b: BeneficiariaOpcao | null) => void;
}

export default function CamposNovaBeneficiaria({ formB, setFormB, changeB, precisaResponsavel, responsavelSelecionada, setResponsavelSelecionada }: CamposNovaBeneficiariaProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

    {/* Nome */}
    <div style={{ gridColumn: "1 / -1" }}>
      <label htmlFor="triagem-campo-1" style={labelStyle}>Nome completo *</label>
      <input id="triagem-campo-1" name="nome" value={formB.nome} onChange={changeB} placeholder="Nome completo" style={inputStyle} />
    </div>

    {/* CPF */}
    <div>
      <label htmlFor="triagem-campo-2" style={labelStyle}>CPF</label>
      <input id="triagem-campo-2" name="cpf" value={formB.cpf} onChange={(e) => setFormB(prev => ({ ...prev, cpf: maskCPF(e.target.value) }))} placeholder="000.000.000-00" style={inputStyle} />
    </div>

    {/* Data nascimento */}
    <div>
      <label htmlFor="triagem-campo-3" style={labelStyle}>Data de nascimento</label>
      <input id="triagem-campo-3" type="date" name="data_nascimento" value={formB.data_nascimento} onChange={changeB} style={inputStyle} />
    </div>

    {/* Telefone */}
    <div>
      <label htmlFor="triagem-campo-4" style={labelStyle}>Telefone</label>
      <input id="triagem-campo-4" name="telefone" value={formB.telefone} onChange={(e) => setFormB(prev => ({ ...prev, telefone: maskTelefone(e.target.value) }))} placeholder="(00) 00000-0000" style={inputStyle} />
    </div>

    {/* Endereço */}
    <div>
      <label htmlFor="triagem-campo-5" style={labelStyle}>Endereço</label>
      <input id="triagem-campo-5" name="endereco" value={formB.endereco} onChange={changeB} placeholder="Rua, número, bairro" style={inputStyle} />
    </div>

    {/* Tipo */}
    <div>
      <label htmlFor="triagem-campo-6" style={labelStyle}>Tipo</label>
      <select id="triagem-campo-6" name="tipo" value={formB.tipo} onChange={changeB} style={inputStyle}>
        <option value="ADULTA">Adulta</option>
        <option value="ADOLESCENTE">Adolescente</option>
        <option value="CRIANCA">Criança</option>
      </select>
    </div>

    {precisaResponsavel && (
      <BuscaBeneficiaria
        label="Responsável"
        placeholder="Buscar beneficiária adulta..."
        tipo="ADULTA"
        selecionada={responsavelSelecionada}
        onSelecionar={setResponsavelSelecionada}
      />
    )}

    {/* Estado civil */}
    <div>
      <label htmlFor="triagem-campo-7" style={labelStyle}>Estado civil</label>
      <select id="triagem-campo-7" name="estado_civil" value={formB.estado_civil} onChange={changeB} style={inputStyle}>
        <option value="">— Selecione —</option>
        <option value="SOLTEIRA">Solteira</option>
        <option value="CASADA">Casada</option>
        <option value="DIVORCIADA">Divorciada</option>
        <option value="VIUVA">Viúva</option>
        <option value="UNIAO_ESTAVEL">União estável</option>
      </select>
    </div>

    {/* Escolaridade */}
    <div>
      <label htmlFor="triagem-campo-8" style={labelStyle}>Escolaridade</label>
      <select id="triagem-campo-8" name="escolaridade" value={formB.escolaridade} onChange={changeB} style={inputStyle}>
        <option value="">— Selecione —</option>
        <option value="SEM_ESCOLARIDADE">Sem escolaridade</option>
        <option value="FUNDAMENTAL">Fundamental</option>
        <option value="MEDIO">Médio</option>
        <option value="SUPERIOR">Superior</option>
        <option value="POS_GRADUACAO">Pós-graduação</option>
      </select>
    </div>

    {/* Raça */}
    <div>
      <label htmlFor="triagem-campo-9" style={labelStyle}>Raça / Cor</label>
      <select id="triagem-campo-9" name="raca" value={formB.raca} onChange={changeB} style={inputStyle}>
        <option value="">— Selecione —</option>
        <option value="BRANCA">Branca</option>
        <option value="PRETA">Preta</option>
        <option value="PARDA">Parda</option>
        <option value="AMARELA">Amarela</option>
        <option value="INDIGENA">Indígena</option>
      </select>
    </div>

    {/* Ocupação */}
    <div>
      <label htmlFor="triagem-campo-10" style={labelStyle}>Ocupação</label>
      <input id="triagem-campo-10" name="ocupacao" value={formB.ocupacao} onChange={changeB} placeholder="Ex: Doméstica, Vendedora..." style={inputStyle} />
    </div>

    {/* Empregada */}
    <div>
      <label htmlFor="triagem-campo-11" style={labelStyle}>Situação de emprego</label>
      <select id="triagem-campo-11" name="empregada" value={formB.empregada} onChange={changeB} style={inputStyle}>
        <option value="">— Selecione —</option>
        <option value="true">Empregada</option>
        <option value="false">Desempregada</option>
      </select>
    </div>

    {/* Status */}
    <div>
      <label htmlFor="triagem-campo-12" style={labelStyle}>Status</label>
      <select id="triagem-campo-12" name="status" value={formB.status} onChange={changeB} style={inputStyle}>
        <option value="ATIVA">Ativa</option>
        <option value="EM_ESPERA">Em espera</option>
        <option value="ENCERRADA">Encerrada</option>
        <option value="DESISTENTE">Desistente</option>
      </select>
    </div>

    </div>
  );
}
