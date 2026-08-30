const STATUS_STYLES: Record<string, { background: string; color: string; label: string }> = {
  // Status de beneficiária
  ATIVA:       { background: "#D4EDD4", color: "#3D7845", label: "Ativa" },
  EM_ESPERA:   { background: "#FEF3E2", color: "#C47A1E", label: "Em espera" },
  ENCERRADA:   { background: "#F0ECE8", color: "#6B5E54", label: "Encerrada" },
  DESISTENTE:  { background: "#FDE8E4", color: "#C05A48", label: "Desistente" },
  // Status de encaminhamento/agendamento
  PENDENTE:    { background: "#FDE8E4", color: "#C05A48", label: "Pendente" },
  AGENDADO:    { background: "#FEF3E2", color: "#C47A1E", label: "Agendado" },
  CONFIRMADO:  { background: "#D4EDD4", color: "#3D7845", label: "Confirmado" },
  REALIZADO:   { background: "#D4EDD4", color: "#3D7845", label: "Realizado" },
  CONCLUIDO:   { background: "#D4EDD4", color: "#3D7845", label: "Concluído" },
  CANCELADO:   { background: "#F0ECE8", color: "#6B5E54", label: "Cancelado" },
  ENCAMINHADO: { background: "#FDE8E4", color: "#E07A6E", label: "Encaminhado" },
  // Status de profissional
  Ativo:       { background: "#D4EDD4", color: "#3D7845", label: "Ativo" },
  Inativo:     { background: "#F0ECE8", color: "#6B5E54", label: "Inativo" },
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? { background: "#f1f5f9", color: "#475569", label: status };
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 10px",
      borderRadius: "9999px",
      fontSize: "11px",
      fontWeight: 700,
      background: style.background,
      color: style.color,
    }}>
      {style.label}
    </span>
  );
}
