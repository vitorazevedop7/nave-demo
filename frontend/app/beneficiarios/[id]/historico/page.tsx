"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, FileText, ClipboardList } from "lucide-react";
import { fetchAuth, getUsuario } from "@/lib/auth";
import { API_URL } from "@/lib/api";
import { formatarDataPura, formatarTimestamp } from "@/lib/date";
import { CarimboRestrito, ResumoAcesso } from "@/components/AcessoProntuario";
import { nomeEspecialidade, type UsuarioCompartilhavel, type Visibilidade } from "@/lib/visibilidade";

// O que a API devolve por prontuário depende de quem pergunta: conteúdo
// completo, ou só o carimbo (`conteudo_restrito`), sem campo clínico nenhum.
type ProntuarioItem = {
  id: string;
  especialidade?: string;
  profissional_id?: string;
  descricao?: string;
  anotacoes?: string;
  criado_em?: string;
  visibilidade?: Visibilidade;
  compartilhamentos?: string[];
  // Presentes só no carimbo:
  conteudo_restrito?: boolean;
  data?: string;
  profissional?: string;
};

export default function HistoricoBeneficiariaPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [beneficiaria, setBeneficiaria] = useState<any>(null);
  const [triagens, setTriagens] = useState<any[]>([]);
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [prontuarios, setProntuarios] = useState<ProntuarioItem[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioCompartilhavel[]>([]);
  const [loading, setLoading] = useState(true);

  const usuarioLogadoId = getUsuario()?.id;

  useEffect(() => {
    async function carregarHistorico() {
      try {
        const [benefRes, triRes, agRes, proRes] = await Promise.all([
          fetchAuth(`${API_URL}/beneficiarias/${id}?incluir_arquivadas=true`),
          fetchAuth(`${API_URL}/triagens?beneficiaria_id=${id}`),
          fetchAuth(`${API_URL}/agendamentos?beneficiaria_id=${id}`),
          fetchAuth(`${API_URL}/prontuarios/beneficiaria/${id}`),
        ]);

        const benefData = await benefRes.json();
        const triData = triRes.ok ? await triRes.json() : [];
        const agData = agRes.ok ? await agRes.json() : [];
        const proData = proRes.ok ? await proRes.json() : [];

        // Para traduzir os ids de `compartilhamentos` em nomes. A rota é
        // GESTORA+PROFISSIONAL; se negar, a lista fica vazia e o resumo mostra
        // só a contagem — nunca um id cru.
        try {
          const usuariosRes = await fetchAuth(`${API_URL}/usuarios/compartilhaveis`);
          if (usuariosRes.ok) {
            const usuariosData = await usuariosRes.json();
            setUsuarios(Array.isArray(usuariosData) ? usuariosData : []);
          }
        } catch {
          setUsuarios([]);
        }

        setBeneficiaria(benefData);
        setTriagens(Array.isArray(triData) ? triData : []);
        setAgendamentos(Array.isArray(agData) ? agData : []);
        setProntuarios(Array.isArray(proData) ? proData : []);
      } catch (error) {
        console.error("Erro ao carregar histórico:", error);
      } finally {
        setLoading(false);
      }
    }

    if (id) carregarHistorico();
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: "40px", fontSize: "14px", color: "#64748b" }}>
        Carregando histórico...
      </div>
    );
  }

  return (
    <div style={{ padding: "36px 32px", minHeight: "100vh" }}>
      <button
        onClick={() => router.back()}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "24px",
          border: "none",
          background: "#f1f5f9",
          padding: "10px 16px",
          borderRadius: "10px",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        <ArrowLeft size={16} />
        Voltar
      </button>

      <div style={{ marginBottom: "30px" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "6px" }}>
          Histórico da Beneficiária
        </h1>
        <p style={{ fontSize: "14px", color: "#64748b" }}>
          {beneficiaria?.nome || "Beneficiária"}
        </p>
        {beneficiaria?.deletado_em && (
          <span
            style={{
              display: "inline-block",
              marginTop: "10px",
              padding: "4px 12px",
              borderRadius: "999px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            Beneficiária arquivada em {formatarTimestamp(beneficiaria.deletado_em)}
          </span>
        )}
      </div>

      {/* Dados principais */}
      <div
        style={{
          background: "#fff",
          borderRadius: "18px",
          padding: "24px",
          marginBottom: "28px",
          border: "1px solid #e2e8f0",
        }}
      >
        <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "16px" }}>
          Informações Gerais
        </h2>

        <div style={{ display: "grid", gap: "12px" }}>
          <Info label="Nome" value={beneficiaria?.nome} />
          <Info label="CPF" value={beneficiaria?.cpf} />
          <Info label="Telefone" value={beneficiaria?.telefone} />
          <Info
            label="Data de Nascimento"
            value={formatarDataPura(beneficiaria?.data_nascimento) || "-"}
          />
          <Info label="Endereço" value={beneficiaria?.endereco} />
          <Info label="Status" value={beneficiaria?.status} />
        </div>
      </div>

      {/* Triagens */}
      <HistoricoCard
        titulo="Triagens"
        icon={<ClipboardList size={18} />}
        itens={triagens}
        campoData="criado_em"
        renderItem={(item) => (
          <>
            <strong>Queixa:</strong>{" "}
            {item.queixas?.[0]?.queixa_principal || "-"}
            {item.queixas?.length > 1 && ` (+${item.queixas.length - 1})`}
          </>
        )}
      />

      {/* Agendamentos */}
      <HistoricoCard
        titulo="Agendamentos"
        icon={<Calendar size={18} />}
        itens={agendamentos}
        campoData="data_hora"
        renderItem={(item) => (
          <>
            <strong>Status:</strong> {item.status}
          </>
        )}
      />

      {/* Prontuários */}
      <HistoricoCard
        titulo="Prontuários"
        icon={<FileText size={18} />}
        itens={prontuarios}
        campoData="criado_em"
        // O carimbo não traz `criado_em`, traz `data`.
        getData={(item) => item.criado_em || item.data}
        renderItem={(item: ProntuarioItem) => {
          if (item.conteudo_restrito) {
            return (
              <CarimboRestrito
                profissional={item.profissional}
                especialidade={nomeEspecialidade(item.especialidade)}
              />
            );
          }

          return (
            <>
              <strong>Registro:</strong> {item.anotacoes || item.descricao || "-"}
              <ResumoAcesso
                visibilidade={item.visibilidade}
                especialidade={item.especialidade}
                compartilhamentos={item.compartilhamentos}
                usuarios={usuarios}
                // Só o autor vê a lista de quem foi incluído; para os demais
                // fica só a frase do nível, como informação de leitura.
                podeGerenciar={!!usuarioLogadoId && item.profissional_id === usuarioLogadoId}
              />
            </>
          );
        }}
      />
    </div>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        padding: "12px 14px",
        borderRadius: "10px",
        background: "#fafaf9",
        border: "1px solid #e7e5e4",
      }}
    >
      <span style={{ minWidth: "160px", fontWeight: 700, color: "#334155" }}>
        {label}
      </span>
      <span>{value || "-"}</span>
    </div>
  );
}

function HistoricoCard({
  titulo,
  icon,
  itens,
  campoData,
  getData,
  renderItem,
}: {
  titulo: string;
  icon: React.ReactNode;
  itens: any[];
  campoData: string;
  getData?: (item: any) => string | undefined;
  renderItem: (item: any) => React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "18px",
        padding: "24px",
        marginBottom: "24px",
        border: "1px solid #e2e8f0",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "18px",
        }}
      >
        {icon}
        <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>{titulo}</h2>
      </div>

      {itens.length === 0 ? (
        <p style={{ color: "#94a3b8", fontSize: "13px" }}>
          Nenhum registro encontrado.
        </p>
      ) : (
        <div style={{ display: "grid", gap: "14px" }}>
          {itens.map((item, index) => {
            const data = getData ? getData(item) : item[campoData];
            return (
            <div
              key={index}
              style={{
                padding: "14px",
                borderRadius: "12px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#64748b",
                  marginBottom: "6px",
                }}
              >
                {data ? new Date(data).toLocaleString("pt-BR") : "-"}
              </div>
              <div style={{ fontSize: "13px", color: "#0f172a" }}>
                {renderItem(item)}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}