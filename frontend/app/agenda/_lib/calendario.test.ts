import { describe, expect, it, vi } from "vitest";
import type { Agendamento } from "@/lib/agendamentos";
import {
  agruparPorDia,
  calcularRange,
  comoBotao,
  formatarTituloView,
  gerarDiasCalendario,
  isoLocal,
  moverCursor,
  obterTituloAgendamento,
} from "./calendario";

const ag = (parcial: Partial<Agendamento>): Agendamento => ({
  id: "1",
  beneficiaria_id: "b",
  profissional_id: "p",
  encaminhamento_id: null,
  data_hora: "2026-11-18T13:00:00.000Z",
  status: "AGENDADO",
  observacoes: null,
  criado_em: "2026-11-01T00:00:00.000Z",
  ...parcial,
});

// Quarta-feira, 18 de novembro de 2026.
const cursor = new Date(2026, 10, 18, 15, 30);

describe("intervalo consultado na API", () => {
  it("cobre o mês inteiro na visão mensal", () => {
    const { inicio, fim } = calcularRange("month", cursor);
    expect(isoLocal(inicio)).toBe("2026-11-01T00:00:00");
    expect(fim.getDate()).toBe(30);
  });

  it("vai de domingo a sábado na visão semanal", () => {
    const { inicio, fim } = calcularRange("week", cursor);
    expect(inicio.getDay()).toBe(0);
    expect(inicio.getDate()).toBe(15);
    expect(fim.getDate()).toBe(21);
  });

  it("cobre só o dia na visão diária", () => {
    const { inicio, fim } = calcularRange("day", cursor);
    expect([inicio.getHours(), fim.getHours(), fim.getDate()]).toEqual([0, 23, 18]);
  });
});

describe("navegação", () => {
  it("anda um período por vez conforme a visão", () => {
    expect(moverCursor("month", cursor, 1).getMonth()).toBe(11);
    expect(moverCursor("week", cursor, -1).getDate()).toBe(11);
    expect(moverCursor("day", cursor, 1).getDate()).toBe(19);
  });

  it("mostra um título legível para cada visão", () => {
    expect(formatarTituloView("month", cursor)).toBe("Novembro 2026");
    expect(formatarTituloView("week", cursor)).toBe("15 – 21 de Novembro 2026");
  });
});

describe("grade do mês", () => {
  it("completa as semanas com dias vazios", () => {
    const dias = gerarDiasCalendario(cursor);
    expect(dias.length % 7).toBe(0);
    // 1º de novembro de 2026 é um domingo: nenhum espaço antes dele.
    expect(dias[0]?.getDate()).toBe(1);
    expect(dias.filter(Boolean)).toHaveLength(30);
  });
});

describe("agendamentos", () => {
  it("agrupa pelo dia local", () => {
    const grupos = agruparPorDia([
      ag({ id: "a", data_hora: "2026-11-18T13:00:00.000Z" }),
      ag({ id: "b", data_hora: "2026-11-18T20:00:00.000Z" }),
      ag({ id: "c", data_hora: "2026-11-19T13:00:00.000Z" }),
    ]);
    expect(grupos.get(new Date(2026, 10, 18).toDateString())?.map((a) => a.id)).toEqual(["a", "b"]);
  });

  it("titula pelo nome da beneficiária, pelo bazar ou como reserva", () => {
    expect(obterTituloAgendamento(ag({ beneficiarias: { id: "b", nome: "Ana", telefone: null } }))).toBe("Ana");
    expect(obterTituloAgendamento(ag({ observacoes: "[bazar:42] Bazar: Bazar de Inverno - Centro" }))).toBe(
      "Bazar: Bazar de Inverno - Centro",
    );
    expect(obterTituloAgendamento(ag({}))).toBe("Horário Reservado");
  });
});

describe("comoBotao", () => {
  it("aciona com Enter e Espaço, como um botão de verdade", () => {
    const acao = vi.fn();
    const props = comoBotao(acao);
    const evento = (key: string) => ({ key, preventDefault: vi.fn() }) as unknown as Parameters<typeof props.onKeyDown>[0];
    props.onKeyDown(evento("Enter"));
    props.onKeyDown(evento(" "));
    props.onKeyDown(evento("a"));
    expect(acao).toHaveBeenCalledTimes(2);
    expect(props).toMatchObject({ role: "button", tabIndex: 0 });
  });
});
