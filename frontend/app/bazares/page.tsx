"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import { fetchAuth } from "@/lib/auth";
import { API_URL, extrairMensagemErro, mensagemDeErro } from "@/lib/api";
import { paraInputDate, parseDataPura } from "@/lib/date";
import { useDialog } from "@/components/DialogProvider";
import Button from "@/components/Button";
import type { Bazar, BazarUsuario as Usuario } from "@/lib/types/bazares";
import { moedaParaNumero, numeroParaMoeda } from "@/lib/moeda";
import ResumoBazares from "./_components/ResumoBazares";
import FiltrosBazares from "./_components/FiltrosBazares";
import CartaoBazar from "./_components/CartaoBazar";
import FormularioBazar from "./_components/FormularioBazar";
import { extrairHora, somarArrecadado } from "./_lib/formatacao";
import { FORM_BAZAR_VAZIO, type FormBazar, type UserInfo } from "./_lib/tipos";

export default function Bazares() {
  const { confirm, alert } = useDialog();
  const [bazares, setBazares] = useState<Bazar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [search, setSearch] = useState("");
  const [filterLocal, setFilterLocal] = useState("Todos");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormBazar>(FORM_BAZAR_VAZIO);
  const [profissionais, setProfissionais] = useState<Usuario[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);

  const isGestora = userInfo?.perfis?.includes("GESTORA");
  const canEdit = isGestora === true;

  async function loadUserInfo() {
    try {
      const res = await fetchAuth(`${API_URL}/auth/me`);
      if (res.ok) {
        const data = await res.json();
        setUserInfo(data);
      }
    } catch {
      // Sem /auth/me o usuário apenas não vê ações de edição.
      setUserInfo(null);
    }
  }

  async function loadBazares() {
    try {
      const res = await fetchAuth(`${API_URL}/bazares`);
      if (!res.ok) throw new Error(await extrairMensagemErro(res, "Não foi possível carregar os bazares."));
      const data = await res.json();
      setBazares(data);
      setLoading(false);
    } catch (err: unknown) {
      setError(mensagemDeErro(err, "Não foi possível carregar os bazares."));
      setLoading(false);
    }
  }

  const loadProfissionais = useCallback(async () => {
    try {
      const res = await fetchAuth(`${API_URL}/usuarios`);
      if (!res.ok) throw new Error(await extrairMensagemErro(res, "Não foi possível carregar os profissionais."));
      const data = await res.json();
      setProfissionais(data);
    } catch (err: unknown) {
      await alert({ message: mensagemDeErro(err, "Não foi possível carregar os profissionais."), tone: "error" });
    }
  }, [alert]);

  useEffect(() => {
    loadUserInfo();
    loadBazares();
    loadProfissionais();
  }, [loadProfissionais]);

  const resetForm = useCallback(() => {
    setFormData(FORM_BAZAR_VAZIO);
    setEditingId(null);
    setShowForm(false);
  }, []);

  useEffect(() => {
    if (!showForm) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") resetForm();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showForm, resetForm]);

  function openNewBazar() {
    resetForm();
    setShowForm(true);
  }

  async function openEditBazar(bazar: Bazar) {
    setEditingId(bazar.id);
    setFormData({
      nome: bazar.nome,
      data: paraInputDate(bazar.data),
      horario_inicio: extrairHora(bazar.horario_inicio),
      horario_fim: extrairHora(bazar.horario_fim),
      local: bazar.local || "",
      descricao: bazar.descricao || "",
      observacoes: bazar.observacoes || "",
      total_arrecadado: numeroParaMoeda(bazar.total_arrecadado),
      profissional_ids: bazar.bazar_profissionais.map((bp) => bp.usuarios.id),
    });
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      const payload = {
        nome: formData.nome,
        data: formData.data,
        horario_inicio: formData.horario_inicio || undefined,
        horario_fim: formData.horario_fim || undefined,
        local: formData.local || undefined,
        descricao: formData.descricao || undefined,
        observacoes: formData.observacoes || undefined,
        total_arrecadado: moedaParaNumero(formData.total_arrecadado) ?? undefined,
        profissional_ids: formData.profissional_ids,
      };

      if (editingId) {
        const res = await fetchAuth(`${API_URL}/bazares/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error(await extrairMensagemErro(res, "Erro ao atualizar bazar."));
        await alert({ message: "Bazar atualizado com sucesso!", tone: "success" });
      } else {
        const res = await fetchAuth(`${API_URL}/bazares`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error(await extrairMensagemErro(res, "Erro ao criar bazar."));
        await alert({ message: "Bazar criado com sucesso!", tone: "success" });
      }

      resetForm();
      loadBazares();
    } catch (err: unknown) {
      await alert({ message: mensagemDeErro(err), tone: "error" });
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleDelete(id: string, nome: string) {
    const ok = await confirm({
      title: "Excluir bazar",
      message: `Excluir permanentemente "${nome}"? Esta ação não pode ser desfeita.`,
      confirmLabel: "Excluir",
      variant: "danger",
    });
    if (!ok) return;

    try {
      const res = await fetchAuth(`${API_URL}/bazares/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await extrairMensagemErro(res, "Erro ao excluir bazar."));
      await alert({ message: "Bazar deletado com sucesso!", tone: "success" });
      loadBazares();
    } catch (err: unknown) {
      await alert({ message: mensagemDeErro(err), tone: "error" });
    }
  }

  const locais = Array.from(new Set(bazares.map((b) => b.local).filter(Boolean))) as string[];
  const totalBazares = bazares.length;

  // Lógica para encontrar o nome do PRÓXIMO BAZAR
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const bazaresFuturos = bazares
    .filter((b) => (parseDataPura(b.data) ?? hoje) >= hoje)
    .sort(
      (a, b) =>
        (parseDataPura(a.data)?.getTime() ?? 0) - (parseDataPura(b.data)?.getTime() ?? 0),
    );

  const proximoBazarNome = bazaresFuturos.length > 0 ? bazaresFuturos[0].nome : "Nenhum bazar agendado";

  const totalArrecadado = somarArrecadado(bazares);

  const filtered = bazares.filter((b) => {
    const matchSearch =
      b.nome.toLowerCase().includes(search.toLowerCase()) ||
      (b.local?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (b.descricao?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchLocal = filterLocal === "Todos" || b.local === filterLocal;
    return matchSearch && matchLocal;
  });

  return (
    <div style={{ padding: "36px 32px", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "28px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#2B1F14", margin: 0 }}>
              Bazares
            </h1>
            <p style={{ fontSize: "13px", color: "#6B5E54", marginTop: "4px" }}>
              Gerencie os bazares da ONG
            </p>
          </div>
          {canEdit && (
            <Button onClick={openNewBazar}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Novo Bazar
            </Button>
          )}
        </div>

        {/* Summary Cards */}
        <ResumoBazares totalBazares={totalBazares} proximoBazarNome={proximoBazarNome} totalArrecadado={totalArrecadado} loading={loading} />

        {/* CONTAINER PRINCIPAL COM EFEITO DE VIDRO */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.92)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "0.5px solid rgba(220, 200, 190, 0.45)",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 2px 12px rgba(224, 122, 110, 0.05)",
          }}
        >
          {/* Filters */}
          {!loading && bazares.length > 0 && (
            <FiltrosBazares search={search} setSearch={setSearch} filterLocal={filterLocal} setFilterLocal={setFilterLocal} locais={locais} />
          )}

          {/* Cards Grid ou Mensagens Vázias */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <p style={{ color: "#6a6660" }}>Carregando bazares...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#d32f2f" }}>
              <p>{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <p style={{ color: "#6a6660" }}>Nenhum bazar encontrado</p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "20px",
              }}
            >
              {filtered.map((bazar) => (
                <CartaoBazar key={bazar.id} bazar={bazar} canEdit={canEdit} openEditBazar={openEditBazar} handleDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>

        {/* Form Modal */}
        {showForm && canEdit && (
          <FormularioBazar editingId={editingId} formData={formData} setFormData={setFormData} handleSubmit={handleSubmit} resetForm={resetForm} profissionais={profissionais} submitLoading={submitLoading} />
        )}
      </div>
    </div>
  );
}
