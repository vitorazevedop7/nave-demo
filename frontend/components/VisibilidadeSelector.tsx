"use client";

import { useMemo, useState } from "react";
import {
  descreverUsuario,
  opcoesVisibilidade,
  type UsuarioCompartilhavel,
  type Visibilidade,
} from "@/lib/visibilidade";

const CARD: React.CSSProperties = {
  background: "#fff",
  border: "0.5px solid #d6d0c4",
  borderRadius: "16px",
  padding: "20px",
};

type Props = {
  visibilidade: Visibilidade;
  onVisibilidadeChange: (valor: Visibilidade) => void;
  compartilhamentos: string[];
  onCompartilhamentosChange: (ids: string[]) => void;
  /** Especialidade do prontuário — define o rótulo da opção ESPECIALIDADE. */
  especialidade?: string | null;
  /** Lista de quem pode ser incluído. O autor é filtrado fora: ele já vê. */
  usuarios: UsuarioCompartilhavel[];
  autorId?: string;
};

export default function VisibilidadeSelector({
  visibilidade,
  onVisibilidadeChange,
  compartilhamentos,
  onCompartilhamentosChange,
  especialidade,
  usuarios,
  autorId,
}: Props) {
  const [busca, setBusca] = useState("");
  const opcoes = useMemo(
    () => opcoesVisibilidade(especialidade),
    [especialidade],
  );

  const disponiveis = useMemo(
    () => usuarios.filter((u) => u.id !== autorId),
    [usuarios, autorId],
  );

  const incluidos = useMemo(
    () =>
      compartilhamentos
        .map((id) => disponiveis.find((u) => u.id === id))
        .filter((u): u is UsuarioCompartilhavel => !!u),
    [compartilhamentos, disponiveis],
  );

  const termo = busca.trim().toLowerCase();
  const resultados = useMemo(() => {
    if (!termo) return [];
    return disponiveis
      .filter((u) => !compartilhamentos.includes(u.id))
      .filter((u) => u.nome.toLowerCase().includes(termo))
      .slice(0, 6);
  }, [termo, disponiveis, compartilhamentos]);

  const incluir = (id: string) => {
    if (compartilhamentos.includes(id)) return;
    onCompartilhamentosChange([...compartilhamentos, id]);
    setBusca("");
  };

  const remover = (id: string) =>
    onCompartilhamentosChange(compartilhamentos.filter((x) => x !== id));

  return (
    <div style={CARD}>
      <h3
        style={{
          margin: 0,
          fontSize: "14px",
          fontWeight: 700,
          color: "#2B1F14",
        }}
      >
        Quem pode ver este laudo?
      </h3>
      <p
        style={{
          margin: "6px 0 0",
          fontSize: "12px",
          color: "#6B5E54",
          lineHeight: 1.5,
        }}
      >
        Começa em <strong>Só eu</strong>. Quem você incluir tem acesso de{" "}
        <strong>leitura</strong> — editar e excluir continuam sendo só seus.
      </p>

      <div style={{ display: "grid", gap: "10px", marginTop: "16px" }}>
        {opcoes.map((opcao) => {
          const marcada = visibilidade === opcao.valor;
          return (
            <label
              key={opcao.valor}
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "flex-start",
                padding: "12px 14px",
                borderRadius: "16px",
                cursor: "pointer",
                background: marcada ? "rgba(106, 158, 110, 0.10)" : "#faf9f6",
                border: marcada
                  ? "1.5px solid #6A9E6E"
                  : "0.5px solid #e0dbd2",
                transition: "background 0.15s, border-color 0.15s",
              }}
            >
              <input
                type="radio"
                name="visibilidade-prontuario"
                checked={marcada}
                onChange={() => onVisibilidadeChange(opcao.valor)}
                style={{ marginTop: "2px", accentColor: "#6A9E6E" }}
              />
              <span style={{ display: "grid", gap: "3px" }}>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#2B1F14",
                  }}
                >
                  {opcao.rotulo}
                  {opcao.valor === "PRIVADO" && (
                    <span
                      style={{
                        marginLeft: "8px",
                        fontSize: "10px",
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        color: "#3D7845",
                        background: "#D4EDD4",
                        borderRadius: "16px",
                        padding: "2px 8px",
                      }}
                    >
                      Padrão
                    </span>
                  )}
                </span>
                <span style={{ fontSize: "11.5px", color: "#6B5E54" }}>
                  {opcao.descricao}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      {/* ── Incluir alguém ──────────────────────────────────────────────── */}
      <div style={{ marginTop: "20px" }}>
        <label
          style={{
            display: "block",
            fontSize: "12px",
            fontWeight: 700,
            color: "#2B1F14",
          }}
        >
          Incluir alguém
        </label>
        <p style={{ margin: "4px 0 8px", fontSize: "11.5px", color: "#6B5E54" }}>
          Soma-se à opção escolhida acima, sem substituí-la. Também é acesso de
          leitura.
        </p>

        <div style={{ position: "relative" }}>
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar pelo nome…"
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "0.5px solid #d6d0c4",
              borderRadius: "16px",
              fontSize: "12px",
              fontFamily: "inherit",
              background: "#faf9f6",
            }}
          />

          {termo && (
            <div
              style={{
                marginTop: "8px",
                border: "0.5px solid #e0dbd2",
                borderRadius: "16px",
                overflow: "hidden",
                background: "#fff",
              }}
            >
              {resultados.length === 0 ? (
                <p
                  style={{
                    margin: 0,
                    padding: "12px 14px",
                    fontSize: "12px",
                    color: "#9B8E84",
                  }}
                >
                  Ninguém encontrado com esse nome.
                </p>
              ) : (
                resultados.map((usuario) => (
                  <button
                    key={usuario.id}
                    type="button"
                    onClick={() => incluir(usuario.id)}
                    style={{
                      display: "flex",
                      width: "100%",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 14px",
                      border: "none",
                      borderTop: "0.5px solid #f0ece4",
                      background: "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "inherit",
                    }}
                  >
                    <span>
                      <span
                        style={{
                          display: "block",
                          fontSize: "12.5px",
                          fontWeight: 600,
                          color: "#2B1F14",
                        }}
                      >
                        {usuario.nome}
                      </span>
                      <span style={{ fontSize: "11px", color: "#9B8E84" }}>
                        {descreverUsuario(usuario) || "—"}
                      </span>
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#6A9E6E",
                      }}
                    >
                      Incluir
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div style={{ marginTop: "12px" }}>
          {incluidos.length === 0 ? (
            <p style={{ margin: 0, fontSize: "11.5px", color: "#9B8E84" }}>
              Ninguém incluído individualmente.
            </p>
          ) : (
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "grid",
                gap: "8px",
              }}
            >
              {incluidos.map((usuario) => (
                <li
                  key={usuario.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 14px",
                    borderRadius: "16px",
                    background: "#faf9f6",
                    border: "0.5px solid #e0dbd2",
                  }}
                >
                  <span>
                    <span
                      style={{
                        display: "block",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        color: "#2B1F14",
                      }}
                    >
                      {usuario.nome}
                    </span>
                    <span style={{ fontSize: "11px", color: "#9B8E84" }}>
                      {descreverUsuario(usuario) || "—"}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => remover(usuario.id)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#C05A48",
                      fontFamily: "inherit",
                    }}
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
