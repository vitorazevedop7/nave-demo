"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchAuth } from "@/lib/auth";
import { API_URL, extrairMensagemErro, mensagemDeErro } from "@/lib/api";
import { useDialog } from "@/components/DialogProvider";
import { moedaParaNumero, numeroParaMoeda } from "@/lib/moeda";
import { hojeInputDate } from "@/lib/date";
import Button from "@/components/Button";
import CampanhasAtivas from "./_components/CampanhasAtivas";
import TabelaDoacoes from "./_components/TabelaDoacoes";
import ModalNovaDoacao from "./_components/ModalNovaDoacao";
import ModalDoador from "./_components/ModalDoador";
import ModalCampanha from "./_components/ModalCampanha";
import ModalGerenciarDoadores from "./_components/ModalGerenciarDoadores";
import { ConfirmModal } from "./_components/dialogos";
import { BarChart, IconGift, IconMoney, IconPeople, StatCard, card } from "./_components/indicadores";
import { fmtBRL, isValidEmail, isValidPhone } from "./_lib/helpers";
import { DOADOR_VAZIO, type Campanha, type Doacao, type Doador, type ExclusaoPendente, type FormCampanha, type FormDoacao, type FormDoador, type ModalType } from "./_lib/tipos";

/* ─── Main Page ─────────────────────────────────────────────── */
export default function Doacoes() {
  const { alert } = useDialog();
  const [doacoes, setDoacoes] = useState<Doacao[]>([]);
  const [doadores, setDoadores] = useState<Doador[]>([]);
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("Todos");
  const [submitting, setSubmitting] = useState(false);
  const [editingCampanhaId, setEditingCampanhaId] = useState<string | null>(null);
  const [editingDoadorId, setEditingDoadorId] = useState<string | null>(null);

  // Estados para confirmação
  const [confirmDelete, setConfirmDelete] = useState<ExclusaoPendente | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /* form states */
  const [formDoacao, setFormDoacao] = useState<FormDoacao>({
    doador_id: "",
    tipo: "DINHEIRO",
    valor: "",
    quantidade: "",
    data: hojeInputDate(),
    observacao: "",
    campanha_id: "",
  });
  const [formDoador, setFormDoador] = useState<FormDoador>(DOADOR_VAZIO);
  const [formCampanha, setFormCampanha] = useState<FormCampanha>({ nome: "", descricao: "", meta_valor: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  /* busca dentro do modal de registrar doacao */
  const [buscaDoador, setBuscaDoador] = useState("");
  const [buscaCampanha, setBuscaCampanha] = useState("");

  useEffect(() => {
    if (activeModal !== "doacao") {
      setBuscaDoador("");
      setBuscaCampanha("");
    }
  }, [activeModal]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r1, r2, r3] = await Promise.all([
        fetchAuth(`${API_URL}/doacoes`).then((r) => (r.ok ? r.json() : [])),
        fetchAuth(`${API_URL}/doadores`).then((r) => (r.ok ? r.json() : [])),
        fetchAuth(`${API_URL}/campanhas-doacoes`).then((r) => (r.ok ? r.json() : [])),
      ]);
      setDoacoes(r1);
      setDoadores(r2);
      setCampanhas(r3);
    } catch (err: unknown) {
      await alert({ message: mensagemDeErro(err, "Não foi possível carregar as doações."), tone: "error" });
    } finally {
      setLoading(false);
    }
  }, [alert]);

  useEffect(() => { load(); }, [load]);

  /* ── Stats ─────────────────────────────────────────────────── */
  const totalValor = doacoes.reduce((s, d) => {
    const valor = typeof d.valor === 'string' ? parseFloat(d.valor) : (d.valor ?? 0);
    return s + valor;
  }, 0);
  /* ── Filtered list ─────────────────────────────────────────── */
  const filtered = doacoes.filter((d) => {
    const matchSearch =
      !search ||
      d.doadores?.nome.toLowerCase().includes(search.toLowerCase()) ||
      d.tipo.toLowerCase().includes(search.toLowerCase());
    const matchTipo = filterTipo === "Todos" || d.tipo === filterTipo;
    return matchSearch && matchTipo;
  });

  /* ── Campanha totals ────────────────────────────────────────── */
  const campanhasWithTotal = campanhas.map((c) => ({
    ...c,
    total_arrecadado: doacoes
      .filter((d) => d.campanha_id === c.id)
      .reduce((s, d) => {
        const valor = typeof d.valor === 'string' ? parseFloat(d.valor) : (d.valor ?? 0);
        return s + valor;
      }, 0),
  }));

  /* ── Submit handlers ────────────────────────────────────────── */
  async function submitDoacao() {
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        tipo: formDoacao.tipo,
        data: formDoacao.data,
        doador_id: formDoacao.doador_id || undefined,
        observacao: formDoacao.observacao || undefined,
        campanha_id: formDoacao.campanha_id || undefined,
      };
      if (formDoacao.tipo === "DINHEIRO") body.valor = moedaParaNumero(formDoacao.valor) ?? undefined;
      else body.quantidade = formDoacao.quantidade;

      const r = await fetchAuth(`${API_URL}/doacoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(await extrairMensagemErro(r, "Não foi possível registrar a doação."));
      setActiveModal(null);
      load();
    } catch (err: unknown) {
      await alert({ message: mensagemDeErro(err), tone: "error" });
    } finally { setSubmitting(false); }
  }

  async function submitDoador() {
    setSubmitting(true);
    const errors: Record<string, string> = {};

    if (formDoador.telefone && !isValidPhone(formDoador.telefone)) {
      errors.telefone = 'Telefone inválido. Use formato: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX';
    }

    if (formDoador.email && !isValidEmail(formDoador.email)) {
      errors.email = 'E-mail inválido';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setSubmitting(false);
      return;
    }

    try {
      // Editar atualiza o doador existente; sem id, é um cadastro novo.
      const r = await fetchAuth(
        editingDoadorId ? `${API_URL}/doadores/${editingDoadorId}` : `${API_URL}/doadores`,
        {
          method: editingDoadorId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formDoador),
        },
      );
      if (r.ok) {
        setActiveModal(null);
        setEditingDoadorId(null);
        setFormDoador(DOADOR_VAZIO);
        setFormErrors({});
        load();
      } else {
        setFormErrors({
          form: await extrairMensagemErro(
            r,
            editingDoadorId ? "Não foi possível salvar o doador." : "Não foi possível cadastrar o doador.",
          ),
        });
      }
    } catch (err: unknown) {
      setFormErrors({ form: mensagemDeErro(err) });
    } finally { setSubmitting(false); }
  }

  async function submitCampanha() {
    setSubmitting(true);
    try {
      const body = {
        nome: formCampanha.nome,
        descricao: formCampanha.descricao || undefined,
        meta_valor: moedaParaNumero(formCampanha.meta_valor) ?? undefined,
      };

      if (editingCampanhaId) {
        const r = await fetchAuth(`${API_URL}/campanhas-doacoes/${editingCampanhaId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!r.ok) throw new Error(await extrairMensagemErro(r, "Não foi possível salvar a campanha."));
        resetFormCampanha();
        load();
      } else {
        const r = await fetchAuth(`${API_URL}/campanhas-doacoes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!r.ok) throw new Error(await extrairMensagemErro(r, "Não foi possível criar a campanha."));
        resetFormCampanha();
        load();
      }
    } catch (err: unknown) {
      await alert({ message: mensagemDeErro(err), tone: "error" });
    } finally { setSubmitting(false); }
  }

  function resetFormCampanha() {
    setFormCampanha({ nome: "", descricao: "", meta_valor: "" });
    setEditingCampanhaId(null);
    setActiveModal(null);
  }

  function openEditarCampanha(c: Campanha) {
    setEditingCampanhaId(c.id);
    setFormCampanha({
      nome: c.nome,
      descricao: c.descricao || "",
      meta_valor: numeroParaMoeda(c.meta_valor),
    });
    setActiveModal("campanha");
  }

  async function deletarCampanha(id: string, nome: string) {
    setConfirmDelete({ type: 'campanha', id, name: nome });
  }

  function abrirNovoDoador() {
    setEditingDoadorId(null);
    setFormDoador(DOADOR_VAZIO);
    setFormErrors({});
    setActiveModal("doador");
  }

  function openEditarDoador(d: Doador) {
    setEditingDoadorId(d.id);
    setFormDoador({
      nome: d.nome,
      tipo: d.tipo || "PESSOA_FISICA",
      telefone: d.telefone || "",
      email: d.email || "",
    });
    setFormErrors({});
    setActiveModal("doador");
  }

  async function deletarDoador(id: string, nome: string) {
    setConfirmDelete({ type: 'doador', id, name: nome });
  }

  async function deletarDoacao(id: string) {
    setConfirmDelete({ type: 'doacao', id });
  }

  async function executarDelete() {
    if (!confirmDelete) return;
    setIsDeleting(true);
    try {
      let url = '';
      if (confirmDelete.type === 'campanha') url = `${API_URL}/campanhas-doacoes/${confirmDelete.id}`;
      else if (confirmDelete.type === 'doador') url = `${API_URL}/doadores/${confirmDelete.id}`;
      else if (confirmDelete.type === 'doacao') url = `${API_URL}/doacoes/${confirmDelete.id}`;

      const r = await fetchAuth(url, { method: "DELETE" });
      if (!r.ok) throw new Error(await extrairMensagemErro(r, "Não foi possível excluir o registro."));
      setConfirmDelete(null);
      load();
    } catch (err: unknown) {
      setConfirmDelete(null);
      await alert({ message: mensagemDeErro(err), tone: "error" });
    } finally {
      setIsDeleting(false);
    }
  }

  /* ─── Render ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "36px", height: "36px", border: "3px solid var(--salmon-light)", borderTopColor: "var(--salmon-primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Carregando doações…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: "36px 32px", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        {/* ── Header ─────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Doações</h1>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
              Gerencie doações, doadores e campanhas
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <Button variant="secondary" onClick={() => setActiveModal("campanha")}>+ Campanha</Button>
            <Button variant="secondary" onClick={abrirNovoDoador}>+ Doador</Button>
            <Button onClick={() => setActiveModal("doacao")}>+ Nova Doação</Button>
          </div>
        </div>

        {/* ── Stats ──────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: "14px", marginBottom: "20px", flexWrap: "wrap" }}>
          <StatCard label="Total de Doações" value={String(doacoes.length)} icon={<IconGift />} accent />
          <StatCard label="Valor Total Arrecadado" value={fmtBRL(totalValor)} icon={<IconMoney />} />
          <StatCard
            label="Total de Doadores"
            value={String(doadores.length)}
            icon={<IconPeople />}
            action={<Button variant="secondary" size="sm" onClick={() => setActiveModal("gerenciar-doadores")} style={{ padding: "8px 14px", fontSize: "12px" }}>📋 Gerenciar</Button>}
          />
        </div>

        {/* ── Chart + Campanhas ───────────────────────────────── */}
        <div className="dash-main-grid" style={{ marginBottom: "20px" }}>

          {/* Chart */}
          <div style={{ ...card, padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                Arrecadação Mensal
              </p>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", background: "var(--salmon-light)", padding: "3px 10px", borderRadius: "99px" }}>
                Últimos 6 meses
              </span>
            </div>
            <BarChart doacoes={doacoes} />
          </div>

          {/* Campanhas */}
          <CampanhasAtivas campanhasWithTotal={campanhasWithTotal} openEditarCampanha={openEditarCampanha} deletarCampanha={deletarCampanha} />
        </div>

        {/* ── Donations table ─────────────────────────────────── */}
        <TabelaDoacoes filtered={filtered} search={search} setSearch={setSearch} filterTipo={filterTipo} setFilterTipo={setFilterTipo} deletarDoacao={deletarDoacao} />
      </div>

      {/* ── Modal: Nova Doação ──────────────────────────────────── */}
      {activeModal === "doacao" && (
        <ModalNovaDoacao formDoacao={formDoacao} setFormDoacao={setFormDoacao} doadores={doadores} campanhas={campanhas} buscaDoador={buscaDoador} setBuscaDoador={setBuscaDoador} buscaCampanha={buscaCampanha} setBuscaCampanha={setBuscaCampanha} submitting={submitting} submitDoacao={submitDoacao} setActiveModal={setActiveModal} />
      )}

      {/* ── Modal: Novo Doador ──────────────────────────────────── */}
      {activeModal === "doador" && (
        <ModalDoador formDoador={formDoador} setFormDoador={setFormDoador} formErrors={formErrors} editingDoadorId={editingDoadorId} setEditingDoadorId={setEditingDoadorId} submitting={submitting} submitDoador={submitDoador} deletarDoador={deletarDoador} setActiveModal={setActiveModal} />
      )}

      {/* ── Modal: Nova Campanha ────────────────────────────────── */}
      {activeModal === "campanha" && (
        <ModalCampanha formCampanha={formCampanha} setFormCampanha={setFormCampanha} editingCampanhaId={editingCampanhaId} submitting={submitting} submitCampanha={submitCampanha} resetFormCampanha={resetFormCampanha} />
      )}

      {/* ── Modal: Gerenciar Doadores ────────────────────────────── */}
      {activeModal === "gerenciar-doadores" && (
        <ModalGerenciarDoadores doadores={doadores} openEditarDoador={openEditarDoador} deletarDoador={deletarDoador} setActiveModal={setActiveModal} abrirNovoDoador={abrirNovoDoador} />
      )}

      {/* ── Modal de Confirmação ────────────────────────────────── */}
      {confirmDelete && (
        <ConfirmModal
          title="Confirmar Exclusão"
          message={
            confirmDelete.type === 'campanha'
              ? `Tem certeza que deseja excluir a campanha "${confirmDelete.name}"? Esta ação não pode ser desfeita.`
              : confirmDelete.type === 'doador'
              ? `Tem certeza que deseja excluir o doador "${confirmDelete.name}"? Esta ação não pode ser desfeita.`
              : `Tem certeza que deseja excluir esta doação? Esta ação não pode ser desfeita.`
          }
          onConfirm={executarDelete}
          onCancel={() => setConfirmDelete(null)}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}
