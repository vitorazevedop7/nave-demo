"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { fetchAuth, getUsuario } from "@/lib/auth";
import { API_URL, extrairMensagemErro } from "@/lib/api";
import type { BeneficiariaOpcao } from "@/lib/beneficiarias";
import Button from "@/components/Button";
import BuscaBeneficiaria from "./_components/BuscaBeneficiaria";
import CamposNovaBeneficiaria from "./_components/CamposNovaBeneficiaria";
import CamposQueixa from "./_components/CamposQueixa";
import type { FormBeneficiaria, FormQueixa } from "./_lib/formulario";

export default function NovaTriagem() {
  const router = useRouter();
  const usuario = getUsuario();
  const [etapa, setEtapa] = useState(1);
  const [salvando, setSalvando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);

  const [responsavelSelecionada, setResponsavelSelecionada] = useState<BeneficiariaOpcao | null>(null);

  // Modo de origem da beneficiária: reaproveitar uma já cadastrada ou criar nova.
  const [modo, setModo] = useState<"nova" | "existente">("nova");
  const [beneficiariaSelecionada, setBeneficiariaSelecionada] = useState<BeneficiariaOpcao | null>(null);

  // Pré-seleção via query string (ex.: vindo do botão "Iniciar triagem" da lista).
  // Lê de window.location para evitar a exigência de <Suspense> do useSearchParams.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("beneficiaria_id");
    const nome = params.get("nome");
    if (id) {
      setModo("existente");
      setBeneficiariaSelecionada({ id, nome: nome ?? "Beneficiária selecionada" });
    }
  }, []);

  const [formB, setFormB] = useState<FormBeneficiaria>({
    nome: "",
    cpf: "",
    data_nascimento: "",
    telefone: "",
    endereco: "",
    tipo: "ADULTA",
    estado_civil: "",
    escolaridade: "",
    raca: "",
    ocupacao: "",
    empregada: "",
    status: "ATIVA",
  });

  const [formQ, setFormQ] = useState<FormQueixa>({
    queixa_principal: "",
    queixa_secundaria: "",
    sintomas: "",
    tipo_violencia: "",
    observacoes: "",
  });

  function changeB(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormB((prev) => ({ ...prev, [name]: value }));
  }

  function changeQ(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormQ((prev) => ({ ...prev, [name]: value }));
  }

  function avancar() {
    if (modo === "existente") {
      if (!beneficiariaSelecionada) { setErroEnvio("Selecione uma beneficiária cadastrada."); return; }
    } else if (!formB.nome.trim()) {
      setErroEnvio("Nome completo é obrigatório."); return;
    }
    setErroEnvio(null);
    setEtapa(2);
  }

  async function confirmar() {
    if (!usuario?.id) { setErroEnvio('Usuário não autenticado.'); return; }
    if (!formQ.queixa_principal.trim()) { setErroEnvio("Queixa principal é obrigatória."); return; }
    setErroEnvio(null);
    setSalvando(true);

    try {
      // 1. Resolver a beneficiária: usar uma já cadastrada ou criar uma nova.
      let beneficiaria_id: string;
      if (modo === "existente") {
        if (!beneficiariaSelecionada) { setErroEnvio("Selecione uma beneficiária cadastrada."); setSalvando(false); return; }
        beneficiaria_id = beneficiariaSelecionada.id;
      } else {
        const payloadB: Record<string, unknown> = { nome: formB.nome, status: formB.status, tipo: formB.tipo };
        if (formB.cpf.trim())             payloadB.cpf = formB.cpf.replace(/\D/g, '');
        if (formB.data_nascimento)        payloadB.data_nascimento = formB.data_nascimento;
        if (formB.telefone.trim())        payloadB.telefone = formB.telefone.replace(/\D/g, '');
        if (formB.endereco.trim())        payloadB.endereco = formB.endereco.trim();
        if (responsavelSelecionada?.id)   payloadB.responsavel_id = responsavelSelecionada.id;
        if (formB.estado_civil)           payloadB.estado_civil = formB.estado_civil;
        if (formB.escolaridade)           payloadB.escolaridade = formB.escolaridade;
        if (formB.raca)                   payloadB.raca = formB.raca;
        if (formB.ocupacao.trim())        payloadB.ocupacao = formB.ocupacao.trim();
        if (formB.empregada !== "")       payloadB.empregada = formB.empregada === "true";

        const resB = await fetchAuth(`${API_URL}/beneficiarias`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadB),
        });
        if (!resB.ok) {
          throw new Error(await extrairMensagemErro(resB, "Erro ao criar beneficiária."));
        }
        ({ id: beneficiaria_id } = await resB.json());
      }

      // 2. Criar triagem
      const resT = await fetchAuth(`${API_URL}/triagens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beneficiaria_id }),
      });
      if (!resT.ok) {
        throw new Error(await extrairMensagemErro(resT, "Erro ao criar triagem."));
      }
      const { id: triagem_id } = await resT.json();

      // 3. Criar queixa
      const payloadQ: Record<string, unknown> = {
        triagem_id,
        queixa_principal: formQ.queixa_principal.trim(),
      };
      if (formQ.queixa_secundaria.trim()) payloadQ.queixa_secundaria = formQ.queixa_secundaria.trim();
      if (formQ.sintomas.trim())          payloadQ.sintomas = formQ.sintomas.trim();
      if (formQ.tipo_violencia.trim())    payloadQ.tipo_violencia = formQ.tipo_violencia.trim();
      if (formQ.observacoes.trim())       payloadQ.observacoes = formQ.observacoes.trim();

      const resQ = await fetchAuth(`${API_URL}/queixas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadQ),
      });
      if (!resQ.ok) {
        throw new Error(await extrairMensagemErro(resQ, "Erro ao registrar queixa."));
      }

      router.push("/triagens");
    } catch (err: unknown) {
      setErroEnvio(err instanceof Error ? err.message : "Erro inesperado. Tente novamente.");
      setSalvando(false);
    }
  }

  const precisaResponsavel = formB.tipo === "CRIANCA" || formB.tipo === "ADOLESCENTE";

  return (
    <div style={{ padding: "36px 32px", minHeight: "100vh" }}>
      <div style={{ width: "100%" }}>

        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#2B1F14", margin: 0 }}>
            Nova Triagem
          </h1>
          <p style={{ fontSize: "13px", color: "#6B5E54", marginTop: "4px" }}>
            Cadastro de beneficiária e registro de queixa
          </p>
        </div>

        {/* Progress bar */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "28px" }}>
          {[1, 2].map((n) => (
            <div
              key={n}
              style={{
                flex: 1,
                height: "5px",
                borderRadius: "9999px",
                background: etapa >= n ? "#E07A6E" : "#e0dbd2",
                transition: "background 0.3s",
              }}
            />
          ))}
        </div>

        {/* Card */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.92)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "0.5px solid rgba(220, 200, 190, 0.45)",
            borderRadius: "16px",
            boxShadow: "0 2px 12px rgba(224, 122, 110, 0.05)",
            overflow: "visible",
          }}
        >
          {/* Card header */}
          <div style={{ padding: "16px 24px", borderBottom: "0.5px solid #e0dbd2" }}>
            <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#2B1F14", margin: 0 }}>
              {etapa === 1 ? "Etapa 1 — Dados da beneficiária" : "Etapa 2 — Registro da queixa"}
            </h2>
          </div>

          <div style={{ padding: "24px" }}>

            {/* ── Etapa 1 ── */}
            {etapa === 1 && (
              <div>

                {/* Alternador: beneficiária já cadastrada x nova */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
                  {([
                    { key: "existente", label: "Beneficiária já cadastrada" },
                    { key: "nova", label: "Nova beneficiária" },
                  ] as const).map((opt) => {
                    const ativo = modo === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => { setModo(opt.key); setErroEnvio(null); }}
                        style={{
                          flex: 1,
                          padding: "10px 14px",
                          borderRadius: "10px",
                          border: ativo ? "0.5px solid #E07A6E" : "0.5px solid #d6d0c4",
                          background: ativo ? "#FDE8E4" : "#faf9f6",
                          color: ativo ? "#C05A48" : "#7a7a70",
                          fontSize: "13px",
                          fontWeight: ativo ? 700 : 600,
                          cursor: "pointer",
                          fontFamily: "inherit",
                          transition: "background 0.15s, color 0.15s, border 0.15s",
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                {/* ── Modo: beneficiária existente ── */}
                {modo === "existente" && (
                  <BuscaBeneficiaria
                    label="Beneficiária *"
                    placeholder="Buscar por nome..."
                    selecionada={beneficiariaSelecionada}
                    onSelecionar={setBeneficiariaSelecionada}
                    style={{ maxWidth: "480px" }}
                    dica={
                      <p style={{ fontSize: "12px", color: "#9B8E84", marginTop: "8px" }}>
                        Selecione uma beneficiária já cadastrada para iniciar uma nova triagem.
                      </p>
                    }
                  />
                )}

                {/* ── Modo: nova beneficiária ── */}
                {modo === "nova" && (
                <CamposNovaBeneficiaria formB={formB} setFormB={setFormB} changeB={changeB} precisaResponsavel={precisaResponsavel} responsavelSelecionada={responsavelSelecionada} setResponsavelSelecionada={setResponsavelSelecionada} />
                )}

              </div>
            )}

            {/* ── Etapa 2 ── */}
            {etapa === 2 && (
              <CamposQueixa formQ={formQ} changeQ={changeQ} />
            )}

            {/* Erro */}
            {erroEnvio && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "12px 16px",
                  background: "#fef3ee",
                  border: "0.5px solid #e07a6e",
                  borderRadius: "10px",
                  fontSize: "13px",
                  color: "#c05a2a",
                  fontWeight: 600,
                }}
              >
                {erroEnvio}
              </div>
            )}

            {/* Botões */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
              {etapa === 1 ? (
                <>
                  <Button type="button" variant="ghost" size="sm" onClick={() => router.push("/triagens")}>
                    Cancelar
                  </Button>
                  <Button type="button" size="sm" onClick={avancar}>
                    Próximo →
                  </Button>
                </>
              ) : (
                <>
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setErroEnvio(null); setEtapa(1); }}>
                    Voltar
                  </Button>
                  <Button type="button" size="sm" onClick={confirmar} disabled={salvando}>
                    {salvando ? "Salvando..." : "Confirmar triagem"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
