"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { fetchAuth } from "@/lib/auth";
import { API_URL } from "@/lib/api";
import { paraInputDate } from "@/lib/date";
import Button from "@/components/Button";

// ─── Estilos reutilizáveis ───────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  border: "0.5px solid #d6d0c4",
  borderRadius: "10px",
  fontSize: "13px",
  color: "#2B1F14",
  background: "#faf9f6",
  outline: "none",
  transition: "border-color 0.15s, background 0.15s",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontWeight: 700,
  color: "#6B5E54",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: "6px",
};

const sectionDivider: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  color: "#9B8E84",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  paddingBottom: "10px",
  borderBottom: "0.5px solid #e0dbd2",
  marginBottom: "20px",
};

function Required() {
  return <span style={{ color: "#e07a6e" }}> *</span>;
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p role="alert" style={{ fontSize: "11px", color: "#e07a6e", marginTop: "5px" }}>{msg}</p>;
}

function focusGreen(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = "#E07A6E";
  e.currentTarget.style.background = "#ffffff";
}

function blurReset(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = "#d6d0c4";
  e.currentTarget.style.background = "#faf9f6";
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

// ─── Página ──────────────────────────────────────────────────────────────────

export default function EditarBeneficiaria() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [form, setForm] = useState({
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

  const [buscaResponsavel, setBuscaResponsavel] = useState('');
  const [sugestoesResponsavel, setSugestoesResponsavel] = useState<{id: string, nome: string}[]>([]);
  const [responsavelSelecionada, setResponsavelSelecionada] = useState<{id: string, nome: string} | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dependentes, setDependentes] = useState<{id: string, nome: string, tipo: string}[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingData, setLoadingData] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Carregar dados ───────────────────────────────────────────────────────

  useEffect(() => {
    fetchAuth(`${API_URL}/beneficiarias/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Erro ${res.status}`);
        return res.json();
      })
      .then(async (data) => {
        setForm({
          nome:           data.nome ?? "",
          cpf:            maskCPF(data.cpf ?? ""),
          data_nascimento: paraInputDate(data.data_nascimento),
          telefone:       maskTelefone(data.telefone ?? ""),
          endereco:       data.endereco ?? "",
          tipo:           data.tipo ?? "ADULTA",
          estado_civil:   data.estado_civil ?? "",
          escolaridade:   data.escolaridade ?? "",
          raca:           data.raca ?? "",
          ocupacao:       data.ocupacao ?? "",
          empregada:      data.empregada === true ? "true" : data.empregada === false ? "false" : "",
          status:         data.status ?? "ATIVA",
        });
        if (data.responsavel_id) {
          const resResp = await fetchAuth(`${API_URL}/beneficiarias/${data.responsavel_id}`);
          const resp = await resResp.json();
          setResponsavelSelecionada({ id: resp.id, nome: resp.nome });
          setBuscaResponsavel(resp.nome);
        }
        if (data.tipo === 'ADULTA') {
          const resDep = await fetchAuth(`${API_URL}/beneficiarias?responsavel_id=${id}`);
          const deps = await resDep.json();
          setDependentes(Array.isArray(deps) ? deps.map((d: any) => ({ id: d.id, nome: d.nome, tipo: d.tipo ?? 'ADULTA' })) : []);
        }
        setLoadingData(false);
      })
      .catch((err: Error) => {
        setSubmitError(err.message);
        setLoadingData(false);
      });
  }, [id]);

  function buscarResponsavel(termo: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (termo.length < 2) { setSugestoesResponsavel([]); return; }
    debounceRef.current = setTimeout(async () => {
      const res = await fetchAuth(`${API_URL}/beneficiarias?tipo=ADULTA&busca=${encodeURIComponent(termo)}`);
      const data = await res.json();
      setSugestoesResponsavel(data.map((b: any) => ({ id: b.id, nome: b.nome })));
    }, 300);
  }

  function handleChange(name: string, value: string) {
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errs: Record<string, string> = {};
    if (!form.nome.trim()) errs.nome = "Nome é obrigatório.";
    if (Object.values(errs).some(Boolean)) { setErrors(errs); return; }

    setLoadingSubmit(true);
    setSubmitError(null);

    try {
      const body: Record<string, unknown> = {
        nome: form.nome.trim(),
        tipo: form.tipo,
        status: form.status,
      };
      if (form.cpf.trim())            body.cpf = form.cpf.replace(/\D/g, '');
      if (form.data_nascimento)       body.data_nascimento = form.data_nascimento;
      if (form.telefone.trim())       body.telefone = form.telefone.replace(/\D/g, '');
      if (form.endereco.trim())       body.endereco = form.endereco.trim();
      body.responsavel_id = responsavelSelecionada?.id ?? null;
      if (form.estado_civil)          body.estado_civil = form.estado_civil;
      if (form.escolaridade)          body.escolaridade = form.escolaridade;
      if (form.raca)                  body.raca = form.raca;
      if (form.ocupacao.trim())       body.ocupacao = form.ocupacao.trim();
      if (form.empregada !== "")      body.empregada = form.empregada === "true";

      const res = await fetchAuth(`${API_URL}/beneficiarias/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? `Erro ${res.status}`);
      }

      router.push("/beneficiarios");
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Erro ao salvar alterações.");
      setLoadingSubmit(false);
    }
  }

  const precisaResponsavel = form.tipo === "CRIANCA" || form.tipo === "ADOLESCENTE";

  // ── Loading inicial ──────────────────────────────────────────────────────
  if (loadingData) {
    return (
      <div style={{ padding: "36px 32px", minHeight: "100vh" }}>
        <div style={{ padding: "80px 20px", textAlign: "center" }}>
          <div
            style={{
              width: "28px", height: "28px", borderRadius: "50%",
              border: "2.5px solid #e0dbd2", borderTopColor: "#E07A6E",
              animation: "spin 0.8s linear infinite", margin: "0 auto 12px",
            }}
          />
          <p style={{ fontSize: "13px", color: "#9B8E84" }}>Carregando dados...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "36px 32px", minHeight: "100vh" }}>
      {/* Botão Voltar */}
      <Link
        href="/beneficiarios"
        style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          fontSize: "13px", fontWeight: 600, color: "#6B5E54",
          textDecoration: "none", marginBottom: "20px",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Voltar para Beneficiárias
      </Link>

      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#2B1F14", margin: 0 }}>
          Editar Beneficiária
        </h1>
        <p style={{ fontSize: "13px", color: "#6B5E54", marginTop: "4px" }}>
          Atualize os dados da beneficiária.
        </p>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} noValidate>
        <div
          style={{
            background: "rgba(255, 255, 255, 0.92)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            borderRadius: "16px",
            border: "0.5px solid rgba(220, 200, 190, 0.45)",
            padding: "32px",
            width: "100%",
            boxShadow: "0 2px 12px rgba(224, 122, 110, 0.05)",
          }}
        >
          {/* Erro geral */}
          {submitError && (
            <div
              role="alert"
              style={{
                background: "#fdf0ef", border: "0.5px solid #e07a6e", borderRadius: "10px",
                padding: "12px 16px", fontSize: "13px", color: "#c05a2a", marginBottom: "24px",
              }}
            >
              {submitError}
            </div>
          )}

          {/* ── Seção: Identificação ── */}
          <div style={sectionDivider}>Identificação</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
            {/* Nome — full width */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="nome" style={labelStyle}>Nome completo<Required /></label>
              <input
                id="nome" type="text" value={form.nome} placeholder="Ex: Maria da Silva"
                onChange={(e) => handleChange("nome", e.target.value)}
                onFocus={focusGreen} onBlur={blurReset}
                style={{ ...inputBase, borderColor: errors.nome ? "#e07a6e" : "#d6d0c4" }}
              />
              <FieldError msg={errors.nome} />
            </div>

            {/* CPF */}
            <div>
              <label htmlFor="cpf" style={labelStyle}>CPF</label>
              <input
                id="cpf" type="text" value={form.cpf} placeholder="000.000.000-00"
                onChange={(e) => handleChange("cpf", maskCPF(e.target.value))}
                onFocus={focusGreen} onBlur={blurReset}
                style={inputBase}
              />
            </div>

            {/* Data de nascimento */}
            <div>
              <label htmlFor="data_nascimento" style={labelStyle}>Data de nascimento</label>
              <input
                id="data_nascimento" type="date" value={form.data_nascimento}
                onChange={(e) => handleChange("data_nascimento", e.target.value)}
                onFocus={focusGreen} onBlur={blurReset}
                style={inputBase}
              />
            </div>

            {/* Telefone */}
            <div>
              <label htmlFor="telefone" style={labelStyle}>Telefone</label>
              <input
                id="telefone" type="text" value={form.telefone} placeholder="(00) 00000-0000"
                onChange={(e) => handleChange("telefone", maskTelefone(e.target.value))}
                onFocus={focusGreen} onBlur={blurReset}
                style={inputBase}
              />
            </div>

            {/* Endereço — full width */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="endereco" style={labelStyle}>Endereço</label>
              <input
                id="endereco" type="text" value={form.endereco} placeholder="Rua, número, bairro, cidade"
                onChange={(e) => handleChange("endereco", e.target.value)}
                onFocus={focusGreen} onBlur={blurReset}
                style={inputBase}
              />
            </div>
          </div>

          {/* ── Seção: Perfil Social ── */}
          <div style={{ ...sectionDivider, marginTop: "12px" }}>Perfil Social</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
            {/* Tipo */}
            <div>
              <label htmlFor="tipo" style={labelStyle}>Tipo</label>
              <select
                id="tipo" value={form.tipo}
                onChange={(e) => handleChange("tipo", e.target.value)}
                onFocus={focusGreen} onBlur={blurReset}
                style={{ ...inputBase, cursor: "pointer" }}
              >
                <option value="ADULTA">Adulta</option>
                <option value="ADOLESCENTE">Adolescente</option>
                <option value="CRIANCA">Criança</option>
              </select>
            </div>

            {/* Vínculo familiar: autocomplete para CRIANCA/ADOLESCENTE, lista somente leitura para ADULTA */}
            {precisaResponsavel ? (
              <div style={{ position: "relative" }}>
                <label style={labelStyle}>Responsável (mãe)</label>
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
                      onFocus={focusGreen} onBlur={blurReset}
                      placeholder="Buscar beneficiária adulta..."
                      style={inputBase}
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
            ) : dependentes.length > 0 ? (
              <div>
                <label style={labelStyle}>Dependentes</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "2px" }}>
                  {dependentes.map((d) => {
                    const tipoCores: Record<string, { background: string; color: string }> = {
                      ADULTA:      { background: "#FDE8E4", color: "#C05A48" },
                      CRIANCA:     { background: "#D4EDD4", color: "#3D7845" },
                      ADOLESCENTE: { background: "#D4EDD4", color: "#3D7845" },
                    };
                    const cor = tipoCores[d.tipo] ?? tipoCores.ADULTA;
                    return (
                      <div key={d.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "13px", color: "#2B1F14", fontWeight: 500 }}>{d.nome}</span>
                        <span style={{ padding: "2px 8px", borderRadius: "9999px", fontSize: "10px", fontWeight: 700, ...cor }}>
                          {d.tipo.charAt(0) + d.tipo.slice(1).toLowerCase()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : <div />}

            {/* Estado civil */}
            <div>
              <label htmlFor="estado_civil" style={labelStyle}>Estado civil</label>
              <select
                id="estado_civil" value={form.estado_civil}
                onChange={(e) => handleChange("estado_civil", e.target.value)}
                onFocus={focusGreen} onBlur={blurReset}
                style={{ ...inputBase, cursor: "pointer" }}
              >
                <option value="">Selecione</option>
                <option value="SOLTEIRA">Solteira</option>
                <option value="CASADA">Casada</option>
                <option value="DIVORCIADA">Divorciada</option>
                <option value="VIUVA">Viúva</option>
                <option value="UNIAO_ESTAVEL">União estável</option>
              </select>
            </div>

            {/* Escolaridade */}
            <div>
              <label htmlFor="escolaridade" style={labelStyle}>Escolaridade</label>
              <select
                id="escolaridade" value={form.escolaridade}
                onChange={(e) => handleChange("escolaridade", e.target.value)}
                onFocus={focusGreen} onBlur={blurReset}
                style={{ ...inputBase, cursor: "pointer" }}
              >
                <option value="">Selecione</option>
                <option value="SEM_ESCOLARIDADE">Sem escolaridade</option>
                <option value="FUNDAMENTAL">Fundamental</option>
                <option value="MEDIO">Médio</option>
                <option value="SUPERIOR">Superior</option>
                <option value="POS_GRADUACAO">Pós-graduação</option>
              </select>
            </div>

            {/* Raça/Cor */}
            <div>
              <label htmlFor="raca" style={labelStyle}>Raça / Cor</label>
              <select
                id="raca" value={form.raca}
                onChange={(e) => handleChange("raca", e.target.value)}
                onFocus={focusGreen} onBlur={blurReset}
                style={{ ...inputBase, cursor: "pointer" }}
              >
                <option value="">Selecione</option>
                <option value="BRANCA">Branca</option>
                <option value="PRETA">Preta</option>
                <option value="PARDA">Parda</option>
                <option value="AMARELA">Amarela</option>
                <option value="INDIGENA">Indígena</option>
              </select>
            </div>

            {/* Ocupação */}
            <div>
              <label htmlFor="ocupacao" style={labelStyle}>Ocupação</label>
              <input
                id="ocupacao" type="text" value={form.ocupacao}
                placeholder="Ex: Doméstica, Vendedora..."
                onChange={(e) => handleChange("ocupacao", e.target.value)}
                onFocus={focusGreen} onBlur={blurReset}
                style={inputBase}
              />
            </div>

            {/* Situação de emprego */}
            <div>
              <label htmlFor="empregada" style={labelStyle}>Situação de emprego</label>
              <select
                id="empregada" value={form.empregada}
                onChange={(e) => handleChange("empregada", e.target.value)}
                onFocus={focusGreen} onBlur={blurReset}
                style={{ ...inputBase, cursor: "pointer" }}
              >
                <option value="">Selecione</option>
                <option value="true">Empregada</option>
                <option value="false">Desempregada</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" style={labelStyle}>Status</label>
              <select
                id="status" value={form.status}
                onChange={(e) => handleChange("status", e.target.value)}
                onFocus={focusGreen} onBlur={blurReset}
                style={{ ...inputBase, cursor: "pointer" }}
              >
                <option value="ATIVA">Ativa</option>
                <option value="EM_ESPERA">Em espera</option>
                <option value="ENCERRADA">Encerrada</option>
                <option value="DESISTENTE">Desistente</option>
              </select>
            </div>
          </div>

          {/* ── Footer ── */}
          <div
            style={{
              display: "flex", justifyContent: "flex-end", gap: "12px",
              marginTop: "32px", paddingTop: "24px", borderTop: "0.5px solid #e0dbd2",
            }}
          >
            <Link
              href="/beneficiarios"
              style={{
                padding: "10px 20px", border: "0.5px solid #d6d0c4", borderRadius: "10px",
                fontSize: "13px", fontWeight: 600, color: "#6B5E54", background: "#f5f2eb",
                textDecoration: "none", display: "inline-flex", alignItems: "center",
              }}
            >
              Cancelar
            </Link>
            <Button type="submit" size="sm" disabled={loadingSubmit}>
              {loadingSubmit && (
                <svg style={{ animation: "spin 0.8s linear infinite" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              )}
              {loadingSubmit ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </div>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
