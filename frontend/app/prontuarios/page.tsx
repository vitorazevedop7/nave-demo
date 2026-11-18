"use client";

import { useState, useEffect } from "react";
import { fetchAuth, getUsuario } from "@/lib/auth";
import { API_URL, extrairMensagemErro, mensagemDeErro } from "@/lib/api";
import { CarimboRestrito } from "@/components/AcessoProntuario";
import ProntuarioSomenteLeitura from "@/components/ProntuarioSomenteLeitura";
import VisibilidadeSelector from "@/components/VisibilidadeSelector";
import { PDF_SECTIONS, abrirImpressao, gerarHtmlProntuario } from "@/lib/prontuario-pdf";
import type { FormAcupuntura, FormAnamnese, FormCrianca, FormFisioterapia, ModalType, Morador } from "@/lib/types/prontuario";
import { VISIBILIDADE_PADRAO, type UsuarioCompartilhavel, type Visibilidade } from "@/lib/visibilidade";
import AcupunturaForm from "./_components/AcupunturaForm";
import AnamneseAdultoForm from "./_components/AnamneseAdultoForm";
import AnamneseCriancaForm from "./_components/AnamneseCriancaForm";
import FisioterapiaForm from "./_components/FisioterapiaForm";
import ListaAtendimentos from "./_components/ListaAtendimentos";
import ListaOutrosProntuarios from "./_components/ListaOutrosProntuarios";
import PdfSelectorModal, { type SecaoPdf } from "./_components/PdfSelectorModal";
import { Modal, ModalBody, ModalFooter, ProgressBar } from "./_components/ui";
import {
  initialAcupuntura, initialAnamnese, initialCrianca, initialFisio,
  stepsAnamnese, stepsCrianca, stepsFisio,
} from "./_lib/formularios";
import { ehCrianca, normalizarSelecionavel, normalizarTexto } from "./_lib/helpers";
import {
  montarFormAcupuntura, montarFormAnamnese, montarFormCrianca,
  montarFormFisioterapia, montarPayloadFicha,
} from "./_lib/montar-formularios";
import type {
  Agendamento, CheckboxFieldKey, OutroProntuarioResumo, ProntuarioView,
  ResultadoBuscaAgendamento, UsuarioLogado,
} from "./_lib/tipos";

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Prontuarios() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [usuarioLogado, setUsuarioLogado] = useState<UsuarioLogado | null>(null);
  const [aba, setAba] = useState<"meus" | "outros">("meus");
  const [outrosProntuarios, setOutrosProntuarios] = useState<OutroProntuarioResumo[]>([]);
  const [loadingOutrosProntuarios, setLoadingOutrosProntuarios] = useState(true);
  const [erroOutrosProntuarios, setErroOutrosProntuarios] = useState("");
  const [detalheOutroProntuario, setDetalheOutroProntuario] = useState<ProntuarioView | null>(null);
  const [loadingOutroProntuarioId, setLoadingOutroProntuarioId] = useState<string | null>(null);
  const [erroConsultaAgendamento, setErroConsultaAgendamento] = useState("");

  const [modalType, setModalType] = useState<ModalType | null>(null);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<Agendamento | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [existingProntuarioId, setExistingProntuarioId] = useState<string | null>(null);

  // Visibilidade
  const [visibilidade, setVisibilidade] = useState<Visibilidade>(VISIBILIDADE_PADRAO);
  const [compartilhamentos, setCompartilhamentos] = useState<string[]>([]);
  const [especialidadeProntuario, setEspecialidadeProntuario] = useState<string | null>(null);
  const [usuariosCompartilhaveis, setUsuariosCompartilhaveis] = useState<UsuarioCompartilhavel[]>([]);
  // Existe registro desta beneficiária/especialidade que este usuário não pode ler.
  const [temRegistroRestrito, setTemRegistroRestrito] = useState(false);
  const [loadingAgId, setLoadingAgId] = useState<string | null>(null);
  const [resultadoAgendamento, setResultadoAgendamento] = useState<ResultadoBuscaAgendamento | null>(null);

  // Anamnese adulto
  const [currentStep, setCurrentStep] = useState(1);
  const [formAnamnese, setFormAnamnese] = useState<FormAnamnese>(initialAnamnese);

  // Anamnese criança
  const [formCrianca, setFormCrianca] = useState<FormCrianca>(initialCrianca);
  const [criancaStep, setCriancaStep] = useState(1);
  const [moradores, setMoradores] = useState<Morador[]>([]);

  // Acupuntura / Psicologia
  const [formAcupuntura, setFormAcupuntura] = useState<FormAcupuntura>(initialAcupuntura);

  // Fisioterapia
  const [formFisio, setFormFisio] = useState<FormFisioterapia>(initialFisio);
  const [fisioStep, setFisioStep] = useState(1);

  // Seletor PDF
  const [showPdfSelector, setShowPdfSelector] = useState(false);
  // Atalho de PDF direto da listagem: guarda o agendamento ate o prontuario carregar
  const [pdfDiretoAgId, setPdfDiretoAgId] = useState<string | null>(null);
  const [pdfSectionsData, setPdfSectionsData] = useState<SecaoPdf[]>([]);

  useEffect(() => {
    const usuario = getUsuario();
    if (usuario) {
      setUsuarioLogado(usuario);
      carregarAgendamentos();
      carregarOutrosProntuarios();
      carregarUsuariosCompartilhaveis();
    }
  }, []);

  // Draft para anamnese adulto
  useEffect(() => {
    if (modalType === "anamnese_adulto" && agendamentoSelecionado) {
      const draft = sessionStorage.getItem(`anamnese_draft_${agendamentoSelecionado.id}`);
      if (draft) {
        try {
          const draftData = JSON.parse(draft) as Partial<FormAnamnese>;
          setFormAnamnese((prev) => {
            const merged = { ...prev };
            (Object.keys(draftData) as Array<keyof FormAnamnese>).forEach((key) => {
              const value = draftData[key];
              if (typeof value === "string") {
                if (value.trim() !== "") merged[key] = normalizarSelecionavel(key, value) as never;
              } else if (typeof value === "boolean") {
                merged[key] = value as never;
              }
            });
            return merged;
          });
        } catch {
          // Rascunho corrompido: descarta para não reaparecer a cada abertura.
          sessionStorage.removeItem(`anamnese_draft_${agendamentoSelecionado.id}`);
        }
      }
    }
  }, [modalType, agendamentoSelecionado]);

  const carregarUsuariosCompartilhaveis = async () => {
    try {
      const res = await fetchAuth(`${API_URL}/usuarios/compartilhaveis`);
      if (!res.ok) return;
      const data = await res.json();
      setUsuariosCompartilhaveis(Array.isArray(data) ? data : []);
    } catch {
      setUsuariosCompartilhaveis([]);
    }
  };

  const carregarAgendamentos = async () => {
    try {
      const res = await fetchAuth(
        `${API_URL}/agendamentos/meus?apenas_com_beneficiaria=true`,
      );
      if (!res.ok) throw new Error(await extrairMensagemErro(res, "Não foi possível carregar os agendamentos."));
      const data = await res.json();
      if (Array.isArray(data)) setAgendamentos(data);
    } catch (err: unknown) {
      setErroConsultaAgendamento(mensagemDeErro(err, "Não foi possível carregar os agendamentos."));
    } finally {
      setLoading(false);
    }
  };

  const carregarOutrosProntuarios = async () => {
    try {
      setErroOutrosProntuarios("");
      const res = await fetchAuth(`${API_URL}/prontuarios/outros`);
      if (!res.ok) throw new Error("Erro ao buscar prontuários de outros profissionais");
      const data = await res.json();
      setOutrosProntuarios(Array.isArray(data) ? data : []);
    } catch {
      setErroOutrosProntuarios("Não foi possível carregar os prontuários de outros profissionais.");
      setOutrosProntuarios([]);
    } finally {
      setLoadingOutrosProntuarios(false);
    }
  };

  const abrirOutroProntuario = async (resumo: OutroProntuarioResumo) => {
    try {
      setErroOutrosProntuarios("");
      setLoadingOutroProntuarioId(resumo.id);
      const res = await fetchAuth(`${API_URL}/prontuarios/${resumo.id}`);
      if (!res.ok) throw new Error("Erro ao abrir prontuário de outro profissional");
      setDetalheOutroProntuario((await res.json()) as ProntuarioView);
    } catch {
      setErroOutrosProntuarios("Não foi possível abrir o prontuário de outro profissional.");
    } finally {
      setLoadingOutroProntuarioId(null);
    }
  };

  const fecharModal = () => {
    setModalType(null);
    setAgendamentoSelecionado(null);
    setCurrentStep(1);
    setFisioStep(1);
    setCriancaStep(1);
    setMoradores([]);
    setErrors({});
    setExistingProntuarioId(null);
    setVisibilidade(VISIBILIDADE_PADRAO);
    setCompartilhamentos([]);
    setEspecialidadeProntuario(null);
    setTemRegistroRestrito(false);
    setResultadoAgendamento(null);
    setFormAnamnese(initialAnamnese);
    setFormCrianca(initialCrianca);
    setFormAcupuntura(initialAcupuntura);
    setFormFisio(initialFisio);
  };

  const buscarProntuarioDoAgendamento = async (
    agendamento_id: string,
  ): Promise<ResultadoBuscaAgendamento> => {
    const res = await fetchAuth(
      `${API_URL}/prontuarios/agendamento/${agendamento_id}`,
    );
    if (!res.ok) throw new Error("Erro ao buscar prontuário do agendamento");
    return (await res.json()) as ResultadoBuscaAgendamento;
  };

  // Só entra no formulário o prontuário que este usuário pode ler E editar.
  // `conteudo_restrito` chega sem os campos de ficha: carregá-lo encheria o
  // formulário de vazios e um PATCH morreria no guard de autoria do backend.
  // Prontuário legível de outro profissional também fica de fora — leitura não
  // é edição.
  const ehEditavelPeloUsuario = (p: ProntuarioView) =>
    !p.conteudo_restrito && p.profissional_id === usuarioLogado?.id;

  // Carrega no estado a visibilidade do registro aberto (ou o padrão fechado).
  const aplicarVisibilidade = (
    existing: ProntuarioView | null,
    especialidadeNovoProntuario: string | null,
  ) => {
    setVisibilidade(existing?.visibilidade ?? VISIBILIDADE_PADRAO);
    setCompartilhamentos(existing?.compartilhamentos ?? []);
    setEspecialidadeProntuario(
      existing?.especialidade ?? especialidadeNovoProntuario,
    );
  };

  const abrirModalEspecialidade = async (ag: Agendamento) => {
    const esp = ag.usuarios?.especialidade ?? "";
    const espNorm = normalizarTexto(esp);
    setLoadingAgId(ag.id);
    setErrors({});
    setErroConsultaAgendamento("");

    let busca: ResultadoBuscaAgendamento;
    try {
      busca = await buscarProntuarioDoAgendamento(ag.id);
    } catch {
      setErroConsultaAgendamento("Não foi possível consultar o prontuário deste atendimento.");
      setLoadingAgId(null);
      return;
    }

    setResultadoAgendamento(busca);
    setAgendamentoSelecionado(ag);
    if (busca.estado === "RESTRITO") {
      setTemRegistroRestrito(true);
      setLoadingAgId(null);
      return;
    }

    const encontrado = busca.estado === "DISPONIVEL" ? busca.prontuario : null;
    const existing =
      encontrado && ehEditavelPeloUsuario(encontrado) ? encontrado : null;
    setTemRegistroRestrito(false);

    setExistingProntuarioId(existing?.id ?? null);
    aplicarVisibilidade(existing, ag.usuarios?.especialidade ?? null);
    const nomeProfissional = usuarioLogado?.nome || "";

    if (espNorm.includes("fisio")) {
      setFormFisio(montarFormFisioterapia(ag, existing, nomeProfissional));
      setFisioStep(1);
      setModalType("fisioterapia");
    } else if (espNorm.includes("acupun")) {
      setFormAcupuntura(montarFormAcupuntura(ag, existing));
      setModalType("acupuntura");
    } else if (ehCrianca(ag)) {
      const { form, moradores: moradoresSalvos } = montarFormCrianca(ag, existing, nomeProfissional);
      setFormCrianca(form);
      setMoradores(moradoresSalvos);
      setCriancaStep(1);
      setModalType("anamnese_crianca");
    } else {
      setFormAnamnese(montarFormAnamnese(ag, existing, nomeProfissional));
      setCurrentStep(1);
      setModalType("anamnese_adulto");
    }

    setLoadingAgId(null);
  };

  const saveDraft = (form: FormAnamnese) => {
    if (agendamentoSelecionado)
      sessionStorage.setItem(`anamnese_draft_${agendamentoSelecionado.id}`, JSON.stringify(form));
  };

  const handleAnamnese = (field: keyof FormAnamnese, value: string | boolean) => {
    setFormAnamnese((prev) => {
      const updated = { ...prev, [field]: value };
      saveDraft(updated);
      return updated;
    });
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleCheckbox = (field: CheckboxFieldKey, checked: boolean) => handleAnamnese(field, checked);

  const handleCrianca = (field: keyof FormCrianca, value: string) =>
    setFormCrianca((prev) => ({ ...prev, [field]: value }));

  const handleMoradores = (next: Morador[]) => {
    setMoradores(next);
    setFormCrianca((prev) => ({ ...prev, familia_moradores: JSON.stringify(next) }));
  };

  const handleAcupuntura = (field: keyof FormAcupuntura, value: string) =>
    setFormAcupuntura((prev) => ({ ...prev, [field]: value }));

  const handleFisio = (field: keyof FormFisioterapia, value: string) =>
    setFormFisio((prev) => ({ ...prev, [field]: value }));

  const validarStepAnamnese = (step: number): boolean => {
    const errs: Record<string, string> = {};
    if (step === 1) {
      if (!formAnamnese.data_atendimento?.trim()) errs.data_atendimento = "Data obrigatória";
      if (!formAnamnese.nome?.trim()) errs.nome = "Nome obrigatório";
    } else if (step === 2) {
      if (!formAnamnese.queixa_principal?.trim()) errs.queixa_principal = "Queixa principal obrigatória";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const salvarProntuario = async () => {
    if (!usuarioLogado || !agendamentoSelecionado) return;
    setSubmitting(true);
    try {
      const { tipoData, descricao } = montarPayloadFicha(
        modalType,
        {
          anamneseAdulto: formAnamnese,
          anamneseCrianca: formCrianca,
          fisioterapia: formFisio,
          acupuntura: formAcupuntura,
        },
        usuarioLogado.nome,
      );

      let res: Response;
      if (existingProntuarioId) {
        res = await fetchAuth(`${API_URL}/prontuarios/${existingProntuarioId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...(descricao ? { descricao } : {}), visibilidade, compartilhamentos, ...tipoData }),
        });
      } else {
        res = await fetchAuth(`${API_URL}/prontuarios`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            beneficiaria_id: agendamentoSelecionado.beneficiaria_id,
            agendamento_id: agendamentoSelecionado.id,
            descricao,
            visibilidade,
            compartilhamentos,
            ...tipoData,
          }),
        });
      }

      if (res.ok) {
        if (modalType === "anamnese_adulto")
          sessionStorage.removeItem(`anamnese_draft_${agendamentoSelecionado.id}`);
        fecharModal();
        carregarAgendamentos();
      } else {
        setErrors({ submit: await extrairMensagemErro(res, "Erro ao salvar prontuário.") });
      }
    } catch {
      setErrors({ submit: "Erro ao conectar com o servidor." });
    } finally {
      setSubmitting(false);
    }
  };

  // Nunca gerar PDF a partir de um payload que veio reduzido: pdfCampo e
  // pdfSecao descartam campo vazio em silêncio, então um laudo incompleto sai
  // com cara de documento completo.
  const podeGerarPdf = !temRegistroRestrito;

  const dadosPdf = {
    anamneseAdulto: formAnamnese,
    anamneseCrianca: formCrianca,
    moradores,
    fisioterapia: formFisio,
    acupuntura: formAcupuntura,
  };

  const abrirSeletorPdf = () => {
    if (!modalType || !agendamentoSelecionado || !podeGerarPdf) return;
    const nome = agendamentoSelecionado.beneficiarias?.nome || "Paciente";

    const html = gerarHtmlProntuario(modalType, dadosPdf, nome, usuarioLogado?.nome || "");

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const sections: SecaoPdf[] = [];
    doc.querySelectorAll("[data-key]").forEach((sEl) => {
      const sKey = sEl.getAttribute("data-key") || "";
      const sLabel = PDF_SECTIONS[modalType].find((s) => s.key === sKey)?.label || sKey;
      const fields: Array<{key: string; label: string}> = [];
      sEl.querySelectorAll("[data-field]").forEach((fEl) => {
        const fKey = fEl.getAttribute("data-field") || "";
        const labelEl = fEl.querySelector("label");
        const fLabel = labelEl?.textContent?.trim() || fKey;
        if (fKey) fields.push({ key: fKey, label: fLabel });
      });
      if (sKey) sections.push({ key: sKey, label: sLabel, fields });
    });

    setPdfSectionsData(sections);
    setShowPdfSelector(true);
  };

  // Atalho de PDF a partir da coluna de acoes: abrirModalEspecialidade carrega o
  // prontuario de forma assincrona, entao o seletor so pode abrir depois que o
  // modalType e os formularios ja estiverem preenchidos.
  useEffect(() => {
    if (!pdfDiretoAgId) return;
    if (!agendamentoSelecionado || agendamentoSelecionado.id !== pdfDiretoAgId) return;
    if (!modalType) {
      if (temRegistroRestrito || erroConsultaAgendamento) setPdfDiretoAgId(null);
      return;
    }
    if (podeGerarPdf) abrirSeletorPdf();
    setPdfDiretoAgId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfDiretoAgId, modalType, agendamentoSelecionado, podeGerarPdf, temRegistroRestrito, erroConsultaAgendamento]);

  const imprimirDaListagem = (ag: Agendamento) => {
    setPdfDiretoAgId(ag.id);
    void abrirModalEspecialidade(ag);
  };

  const imprimirProntuario = (selectedSections: Set<string>, selectedFields: Record<string, Set<string>>) => {
    if (!agendamentoSelecionado) return;
    const nome = agendamentoSelecionado.beneficiarias?.nome || "Paciente";
    const sel = [...selectedSections];
    const flds: Record<string, string[]> = {};
    Object.entries(selectedFields).forEach(([k, v]) => { flds[k] = [...v]; });

    if (!modalType) return;
    const html = gerarHtmlProntuario(modalType, dadosPdf, nome, usuarioLogado?.nome || "", sel, flds);
    if (!html) return;
    abrirImpressao(html);
  };

  // Só o autor gerencia visibilidade. Aqui ou o prontuário é novo (o autor é
  // quem está preenchendo), ou é um dos que ehEditavelPeloUsuario deixou passar.
  const blocoVisibilidade = (
    <div style={{ marginTop: "24px", display: "grid", gap: "12px" }}>
      {temRegistroRestrito && (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: "16px",
            background: "#FDE8E4",
            border: "0.5px solid #F4CFC9",
            fontSize: "12px",
            color: "#C05A48",
            lineHeight: 1.5,
          }}
        >
          Esta beneficiária tem registro clínico que você não pode ler. A geração
          de PDF fica indisponível aqui — um documento montado sem esse conteúdo
          sairia incompleto sem avisar.
        </div>
      )}
      <VisibilidadeSelector
        visibilidade={visibilidade}
        onVisibilidadeChange={setVisibilidade}
        compartilhamentos={compartilhamentos}
        onCompartilhamentosChange={setCompartilhamentos}
        especialidade={especialidadeProntuario}
        usuarios={usuariosCompartilhaveis}
        autorId={usuarioLogado?.id}
      />
    </div>
  );

  const stepAnamnese = stepsAnamnese[currentStep - 1];
  const stepFisio = stepsFisio[fisioStep - 1];
  const stepCrianca = stepsCrianca[criancaStep - 1];
  const avisoProntuarioAusente = resultadoAgendamento?.estado === "AUSENTE" ? (
    <div style={{ margin: "16px 24px 0", padding: "10px 14px", borderRadius: "10px", background: "#F4F1EC", color: "#6B5E54", fontSize: "12px", fontWeight: 600 }}>
      Nenhum prontuário registrado.
    </div>
  ) : null;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: "36px 32px", minHeight: "100vh", backgroundColor: "#faf9f6" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#2B1F14", margin: 0 }}>
            Meus Prontuários
          </h1>
          <p style={{ fontSize: "13px", color: "#6B5E54", marginTop: "4px" }}>
            Visualize seus agendamentos e crie prontuários
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          {([
            ["meus", "Meus atendimentos"],
            ["outros", "Outros prontuários"],
          ] as const).map(([valor, rotulo]) => (
            <button
              key={valor}
              type="button"
              onClick={() => setAba(valor)}
              style={{
                padding: "9px 14px",
                borderRadius: "8px",
                border: aba === valor ? "1px solid #E07A6E" : "1px solid #D8CFC5",
                background: aba === valor ? "#FDF0EE" : "#FFF",
                color: aba === valor ? "#A9473C" : "#6B5E54",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {rotulo}
            </button>
          ))}
        </div>

        {aba === "meus" ? (
          <ListaAtendimentos agendamentos={agendamentos} loading={loading} erroConsultaAgendamento={erroConsultaAgendamento} loadingAgId={loadingAgId} abrirModalEspecialidade={abrirModalEspecialidade} imprimirDaListagem={imprimirDaListagem} />
        ) : (
          <ListaOutrosProntuarios outrosProntuarios={outrosProntuarios} loadingOutrosProntuarios={loadingOutrosProntuarios} erroOutrosProntuarios={erroOutrosProntuarios} loadingOutroProntuarioId={loadingOutroProntuarioId} abrirOutroProntuario={abrirOutroProntuario} />
        )}
      </div>

      {detalheOutroProntuario && (
        <Modal
          titulo={`Prontuário — ${detalheOutroProntuario.beneficiarias?.nome || "Beneficiária"}`}
          subtitulo="Somente leitura"
          onClose={() => setDetalheOutroProntuario(null)}
        >
          <ProntuarioSomenteLeitura prontuario={detalheOutroProntuario} />
        </Modal>
      )}

      {resultadoAgendamento?.estado === "RESTRITO" && agendamentoSelecionado && (
        <Modal
          titulo={`Prontuário — ${agendamentoSelecionado.beneficiarias?.nome || "Beneficiária"}`}
          subtitulo="Registro existente — conteúdo restrito"
          onClose={fecharModal}
        >
          <div style={{ padding: "24px" }}>
            <CarimboRestrito
              profissional={resultadoAgendamento.prontuario.profissional}
              especialidade={resultadoAgendamento.prontuario.especialidade}
            />
          </div>
        </Modal>
      )}

      {/* ── Modal Anamnese Adulto ─────────────────────────────────────────────── */}
      {modalType === "anamnese_adulto" && agendamentoSelecionado && (
        <Modal titulo={agendamentoSelecionado.beneficiarias?.nome ? `Anamnese Adulto — ${agendamentoSelecionado.beneficiarias.nome}` : "Anamnese Adulto"} subtitulo={stepAnamnese.title} onClose={fecharModal}>
          {avisoProntuarioAusente}
          <ProgressBar total={6} current={currentStep} descricao={stepAnamnese.description} />
          <ModalBody errors={errors}>

            <AnamneseAdultoForm formAnamnese={formAnamnese} errors={errors} currentStep={currentStep} handleAnamnese={handleAnamnese} handleCheckbox={handleCheckbox} blocoVisibilidade={blocoVisibilidade} />
          </ModalBody>
          <ModalFooter
            onBack={currentStep > 1 ? () => setCurrentStep((s) => s - 1) : undefined}
            onNext={currentStep < 6 ? () => { if (validarStepAnamnese(currentStep)) setCurrentStep((s) => s + 1); } : undefined}
            onSave={currentStep === 6 ? salvarProntuario : undefined}
            onPrint={currentStep === 6 && podeGerarPdf ? abrirSeletorPdf : undefined}
            submitting={submitting}
            isUpdate={!!existingProntuarioId}
          />
        </Modal>
      )}

      {/* ── Modal Anamnese Criança ────────────────────────────────────────────── */}
      {modalType === "anamnese_crianca" && agendamentoSelecionado && (
        <Modal titulo={`Anamnese Criança — ${agendamentoSelecionado.beneficiarias?.nome}`} subtitulo={stepCrianca.title} onClose={fecharModal}>
          {avisoProntuarioAusente}
          <ProgressBar total={11} current={criancaStep} descricao={stepCrianca.description} />
          <ModalBody errors={errors}>

            <AnamneseCriancaForm formCrianca={formCrianca} criancaStep={criancaStep} handleCrianca={handleCrianca} moradores={moradores} handleMoradores={handleMoradores} blocoVisibilidade={blocoVisibilidade} />

          </ModalBody>
          <ModalFooter
            onBack={criancaStep > 1 ? () => setCriancaStep((s) => s - 1) : undefined}
            onNext={criancaStep < 11 ? () => setCriancaStep((s) => s + 1) : undefined}
            onSave={criancaStep === 11 ? salvarProntuario : undefined}
            onPrint={criancaStep === 11 && podeGerarPdf ? abrirSeletorPdf : undefined}
            submitting={submitting}
            isUpdate={!!existingProntuarioId}
          />
        </Modal>
      )}

      {/* ── Modal Fisioterapia ────────────────────────────────────────────────── */}
      {modalType === "fisioterapia" && agendamentoSelecionado && (
        <Modal titulo={`Ficha Fisioterapia — ${agendamentoSelecionado.beneficiarias?.nome}`} subtitulo={stepFisio.title} onClose={fecharModal}>
          {avisoProntuarioAusente}
          <ProgressBar total={2} current={fisioStep} descricao={stepFisio.description} />
          <ModalBody errors={errors}>

            <FisioterapiaForm formFisio={formFisio} fisioStep={fisioStep} handleFisio={handleFisio} blocoVisibilidade={blocoVisibilidade} />
          </ModalBody>
          <ModalFooter
            onBack={fisioStep > 1 ? () => setFisioStep((s) => s - 1) : undefined}
            onNext={fisioStep < 2 ? () => setFisioStep((s) => s + 1) : undefined}
            onSave={fisioStep === 2 ? salvarProntuario : undefined}
            onPrint={fisioStep === 2 && podeGerarPdf ? abrirSeletorPdf : undefined}
            submitting={submitting}
            isUpdate={!!existingProntuarioId}
          />
        </Modal>
      )}

      {/* ── Modal Acupuntura ──────────────────────────────────────────────────── */}
      {modalType === "acupuntura" && agendamentoSelecionado && (
        <Modal titulo={`Ficha Acupuntura — ${agendamentoSelecionado.beneficiarias?.nome}`} subtitulo="Atendimento clínico" onClose={fecharModal}>
          {avisoProntuarioAusente}
          <ModalBody errors={errors}>
            <AcupunturaForm formAcupuntura={formAcupuntura} handleAcupuntura={handleAcupuntura} blocoVisibilidade={blocoVisibilidade} />
          </ModalBody>
          <ModalFooter onSave={salvarProntuario} onPrint={podeGerarPdf ? abrirSeletorPdf : undefined} submitting={submitting} isUpdate={!!existingProntuarioId} />
        </Modal>
      )}

      {/* ── Seletor de seções para PDF ────────────────────────────────────────── */}
      {showPdfSelector && modalType && (
        <PdfSelectorModal
          sections={pdfSectionsData}
          onConfirm={(secoes, campos) => {
            setShowPdfSelector(false);
            imprimirProntuario(secoes, campos);
          }}
          onCancel={() => setShowPdfSelector(false)}
        />
      )}
    </div>
  );
}
