"use client";

import { formatarData, getIniciais } from "../_lib/helpers";
import type { Usuario } from "../_lib/tipos";

interface CabecalhoUsuarioProps {
  usuario: Usuario;
}

export default function CabecalhoUsuario({ usuario }: CabecalhoUsuarioProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        background: "#FDE8E4",
        borderRadius: "12px",
        padding: "16px",
        marginBottom: "28px",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          background: "#E07A6E",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
          fontWeight: 700,
          color: "#ffffff",
          flexShrink: 0,
        }}
      >
        {getIniciais(usuario.nome)}
      </div>
      <div>
        <p style={{ fontSize: "15px", fontWeight: 700, color: "#2B1F14", margin: 0 }}>
          {usuario.nome}
        </p>
        <p style={{ fontSize: "12px", color: "#6B5E54", marginTop: "2px" }}>
          Cadastrado em {formatarData(usuario.criado_em)}
        </p>
      </div>
      <div style={{ marginLeft: "auto" }}>
        <span
          style={{
            display: "inline-block",
            padding: "3px 12px",
            borderRadius: "9999px",
            fontSize: "11px",
            fontWeight: 700,
            background: usuario.ativo ? "#D4EDD4" : "#f5f2eb",
            color: usuario.ativo ? "#3D7845" : "#5a5a50",
            border: `0.5px solid ${usuario.ativo ? "#b4d4b4" : "#e0dbd2"}`,
          }}
        >
          {usuario.ativo ? "Ativo" : "Inativo"}
        </span>
      </div>
    </div>
  );
}
