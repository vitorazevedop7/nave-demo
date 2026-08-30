"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchAuth, getUsuario } from "@/lib/auth";
import { API_URL } from "@/lib/api";
import Button from "@/components/Button";

interface FormBeneficiaria {
  nome: string;
  cpf: string;
  data_nascimento: string;
  telefone: string;
  endereco: string;
  tipo: string;
  estado_civil: string;
  escolaridade: string;
  raca: string;
  ocupacao: string;
  empregada: string;
  status: string;
}

interface FormQueixa {
  queixa_principal: string;
  queixa_secundaria: string;
  sintomas: string;
  tipo_violencia: string;
  observacoes: string;
}

function maskCPF(value: string): string {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function maskTelefone(value: string): string {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontWeight: 700,
  color: "#7a7a70",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  border: "0.5px solid #d6d0c4",
  borderRadius: "10px",
  fontSize: "13px",
  color: "#3a3a35",
  background: "#faf9f6",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: "none",
};

export default function NovaTriagem() {
  const router = useRouter();
  const usuario = getUsuario();
  const [etapa, setEtapa] = useState(1);
  const [salvando, setSalvando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);

  const [buscaResponsavel, setBuscaResponsavel] = useState('');
  const [sugestoesResponsavel, setSugestoesResponsavel] = useState<{id: string, nome: string}[]>([]);
  const [responsavelSelecionada, setResponsavelSelecionada] = useState<{id: string, nome: string} | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modo de origem da beneficiária: reaproveitar uma já cadastrada ou criar nova.
  const [modo, setModo] = useState<"nova" | "existente">("nova");
  const [buscaBeneficiaria, setBuscaBeneficiaria] = useState('');
  const [sugestoesBeneficiaria, setSugestoesBeneficiaria] = useState<{id: string, nome: string}[]>([]);
  const [beneficiariaSelecionada, setBeneficiariaSelecionada] = useState<{id: string, nome: string} | null>(null);
  const debounceBenefRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  function buscarBeneficiaria(termo: string) {
    if (debounceBenefRef.current) clearTimeout(debounceBenefRef.current);
    if (termo.length < 2) { setSugestoesBeneficiaria([]); return; }
    debounceBenefRef.current = setTimeout(async () => {
      const res = await fetchAuth(`${API_URL}/beneficiarias?busca=${encodeURIComponent(termo)}`);
      const data = await res.json();
      setSugestoesBeneficiaria(data.map((b: any) => ({ id: b.id, nome: b.nome })));
    }, 300);
  }

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

  function changeB(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormB((prev) => ({ ...prev, [name]: value }));
  }

  function buscarResponsavel(termo: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (termo.length < 2) { setSugestoesResponsavel([]); return; }
    debounceRef.current = setTimeout(async () => {
      const res = await fetchAuth(`${API_URL}/beneficiarias?tipo=ADULTA&busca=${encodeURIComponent(termo)}`);
      const data = await res.json();
      setSugestoesResponsavel(data.map((b: any) => ({ id: b.id, nome: b.nome })));
    }, 300);
  }

  function changeQ(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
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
          const err = await resB.json().catch(() => ({}));
          throw new Error(err.message ?? `Erro ao criar beneficiária (${resB.status})`);
        }
        ({ id: beneficiaria_id } = await resB.json());
      }

      // 2. Criar triagem
      const resT = await fetchAuth(`${API_URL}/triagens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beneficiaria_id, triador_id: usuario?.id ?? '' }),
      });
      if (!resT.ok) {
        const err = await resT.json().catch(() => ({}));
        throw new Error(err.message ?? `Erro ao criar triagem (${resT.status})`);
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
        const err = await resQ.json().catch(() => ({}));
        throw new Error(err.message ?? `Erro ao registrar queixa (${resQ.status})`);
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
                  <div style={{ position: "relative", maxWidth: "480px" }}>
                    <label style={labelStyle}>Beneficiária *</label>
                    {beneficiariaSelecionada ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{
                          background: "#e8f5e9", color: "#2e7d32", border: "0.5px solid #a5d6a7",
                          borderRadius: "20px", padding: "6px 14px", fontSize: "13px", fontWeight: 600,
                        }}>
                          {beneficiariaSelecionada.nome}
                        </span>
                        <button
                          type="button"
                          onClick={() => { setBeneficiariaSelecionada(null); setBuscaBeneficiaria(''); }}
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            color: "#7a7a70", fontSize: "16px", lineHeight: 1, padding: "2px 6px",
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <>
                        <input
                          value={buscaBeneficiaria}
                          onChange={(e) => { setBuscaBeneficiaria(e.target.value); buscarBeneficiaria(e.target.value); }}
                          placeholder="Buscar por nome..."
                          style={inputStyle}
                          autoComplete="off"
                        />
                        {sugestoesBeneficiaria.length > 0 && (
                          <ul style={{
                            position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
                            background: "#ffffff", border: "0.5px solid #d6d0c4", borderRadius: "10px",
                            margin: "4px 0 0", padding: 0, listStyle: "none",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                            maxHeight: "200px", overflowY: "auto",
                          }}>
                            {sugestoesBeneficiaria.map((s) => (
                              <li
                                key={s.id}
                                onClick={() => { setBeneficiariaSelecionada(s); setBuscaBeneficiaria(s.nome); setSugestoesBeneficiaria([]); }}
                                style={{ padding: "10px 14px", fontSize: "13px", color: "#3a3a35", cursor: "pointer" }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "#faf9f6")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                              >
                                {s.nome}
                              </li>
                            ))}
                          </ul>
                        )}
                        <p style={{ fontSize: "12px", color: "#9B8E84", marginTop: "8px" }}>
                          Selecione uma beneficiária já cadastrada para iniciar uma nova triagem.
                        </p>
                      </>
                    )}
                  </div>
                )}

                {/* ── Modo: nova beneficiária ── */}
                {modo === "nova" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

                {/* Nome */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Nome completo *</label>
                  <input name="nome" value={formB.nome} onChange={changeB} placeholder="Nome completo" style={inputStyle} />
                </div>

                {/* CPF */}
                <div>
                  <label style={labelStyle}>CPF</label>
                  <input name="cpf" value={formB.cpf} onChange={(e) => setFormB(prev => ({ ...prev, cpf: maskCPF(e.target.value) }))} placeholder="000.000.000-00" style={inputStyle} />
                </div>

                {/* Data nascimento */}
                <div>
                  <label style={labelStyle}>Data de nascimento</label>
                  <input type="date" name="data_nascimento" value={formB.data_nascimento} onChange={changeB} style={inputStyle} />
                </div>

                {/* Telefone */}
                <div>
                  <label style={labelStyle}>Telefone</label>
                  <input name="telefone" value={formB.telefone} onChange={(e) => setFormB(prev => ({ ...prev, telefone: maskTelefone(e.target.value) }))} placeholder="(00) 00000-0000" style={inputStyle} />
                </div>

                {/* Endereço */}
                <div>
                  <label style={labelStyle}>Endereço</label>
                  <input name="endereco" value={formB.endereco} onChange={changeB} placeholder="Rua, número, bairro" style={inputStyle} />
                </div>

                {/* Tipo */}
                <div>
                  <label style={labelStyle}>Tipo</label>
                  <select name="tipo" value={formB.tipo} onChange={changeB} style={inputStyle}>
                    <option value="ADULTA">Adulta</option>
                    <option value="ADOLESCENTE">Adolescente</option>
                    <option value="CRIANCA">Criança</option>
                  </select>
                </div>

                {/* Responsável — só aparece para CRIANCA / ADOLESCENTE */}
                {precisaResponsavel && (
                  <div style={{ position: "relative" }}>
                    <label style={labelStyle}>Responsável</label>
                    {responsavelSelecionada ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{
                          background: "#e8f5e9", color: "#2e7d32", border: "0.5px solid #a5d6a7",
                          borderRadius: "20px", padding: "6px 14px", fontSize: "13px", fontWeight: 600,
                        }}>
                          {responsavelSelecionada.nome}
                        </span>
                        <button
                          type="button"
                          onClick={() => { setResponsavelSelecionada(null); setBuscaResponsavel(''); }}
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            color: "#7a7a70", fontSize: "16px", lineHeight: 1, padding: "2px 6px",
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <>
                        <input
                          value={buscaResponsavel}
                          onChange={(e) => { setBuscaResponsavel(e.target.value); buscarResponsavel(e.target.value); }}
                          placeholder="Buscar beneficiária adulta..."
                          style={inputStyle}
                          autoComplete="off"
                        />
                        {sugestoesResponsavel.length > 0 && (
                          <ul style={{
                            position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
                            background: "#ffffff", border: "0.5px solid #d6d0c4", borderRadius: "10px",
                            margin: "4px 0 0", padding: 0, listStyle: "none",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                            maxHeight: "200px", overflowY: "auto",
                          }}>
                            {sugestoesResponsavel.map((s) => (
                              <li
                                key={s.id}
                                onClick={() => { setResponsavelSelecionada(s); setBuscaResponsavel(s.nome); setSugestoesResponsavel([]); }}
                                style={{ padding: "10px 14px", fontSize: "13px", color: "#3a3a35", cursor: "pointer" }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "#faf9f6")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                              >
                                {s.nome}
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Estado civil */}
                <div>
                  <label style={labelStyle}>Estado civil</label>
                  <select name="estado_civil" value={formB.estado_civil} onChange={changeB} style={inputStyle}>
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
                  <label style={labelStyle}>Escolaridade</label>
                  <select name="escolaridade" value={formB.escolaridade} onChange={changeB} style={inputStyle}>
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
                  <label style={labelStyle}>Raça / Cor</label>
                  <select name="raca" value={formB.raca} onChange={changeB} style={inputStyle}>
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
                  <label style={labelStyle}>Ocupação</label>
                  <input name="ocupacao" value={formB.ocupacao} onChange={changeB} placeholder="Ex: Doméstica, Vendedora..." style={inputStyle} />
                </div>

                {/* Empregada */}
                <div>
                  <label style={labelStyle}>Situação de emprego</label>
                  <select name="empregada" value={formB.empregada} onChange={changeB} style={inputStyle}>
                    <option value="">— Selecione —</option>
                    <option value="true">Empregada</option>
                    <option value="false">Desempregada</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label style={labelStyle}>Status</label>
                  <select name="status" value={formB.status} onChange={changeB} style={inputStyle}>
                    <option value="ATIVA">Ativa</option>
                    <option value="EM_ESPERA">Em espera</option>
                    <option value="ENCERRADA">Encerrada</option>
                    <option value="DESISTENTE">Desistente</option>
                  </select>
                </div>

                </div>
                )}

              </div>
            )}

            {/* ── Etapa 2 ── */}
            {etapa === 2 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

                {/* Queixa principal */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Queixa principal *</label>
                  <textarea name="queixa_principal" value={formQ.queixa_principal} onChange={changeQ} rows={4} placeholder="Descreva a principal queixa" style={textareaStyle} />
                </div>

                {/* Queixa secundária */}
                <div>
                  <label style={labelStyle}>Queixa secundária</label>
                  <textarea name="queixa_secundaria" value={formQ.queixa_secundaria} onChange={changeQ} rows={4} placeholder="Queixa complementar" style={textareaStyle} />
                </div>

                {/* Sintomas */}
                <div>
                  <label style={labelStyle}>Sintomas</label>
                  <textarea name="sintomas" value={formQ.sintomas} onChange={changeQ} rows={4} placeholder="Sintomas apresentados" style={textareaStyle} />
                </div>

                {/* Tipo de violência */}
                <div>
                  <label style={labelStyle}>Tipo de violência</label>
                  <input name="tipo_violencia" value={formQ.tipo_violencia} onChange={changeQ} placeholder="Ex: física, psicológica..." style={inputStyle} />
                </div>

                {/* Observações */}
                <div>
                  <label style={labelStyle}>Observações</label>
                  <textarea name="observacoes" value={formQ.observacoes} onChange={changeQ} rows={4} placeholder="Observações adicionais" style={textareaStyle} />
                </div>
              </div>
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
