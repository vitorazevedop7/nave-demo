import { describe, expect, it } from "vitest";
import { extrairMensagemErro, garantirOk, mensagemDeErro, mensagemPorStatus } from "./api";

const resposta = (status: number, corpo?: unknown) =>
  new Response(corpo === undefined ? null : JSON.stringify(corpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("extrairMensagemErro", () => {
  it("usa a mensagem do NestJS quando ela é texto", async () => {
    await expect(extrairMensagemErro(resposta(409, { message: "E-mail já cadastrado" }))).resolves.toBe(
      "E-mail já cadastrado",
    );
  });

  it("junta e traduz a lista de erros de validação", async () => {
    const res = resposta(400, {
      message: ["email must be an email", "senha must be longer than or equal to 6 characters"],
    });
    await expect(extrairMensagemErro(res)).resolves.toBe(
      "Informe um e-mail válido. A senha deve ter pelo menos 6 caracteres.",
    );
  });

  it("cai na mensagem por status quando o corpo não ajuda", async () => {
    await expect(extrairMensagemErro(resposta(403))).resolves.toBe(
      "Você não tem permissão para realizar esta ação.",
    );
  });

  it("não repassa detalhes de erro 5xx ao usuário", async () => {
    const res = resposta(500, { message: "relation \"usuarios\" does not exist" });
    await expect(extrairMensagemErro(res)).resolves.toBe(
      "Algo deu errado no servidor. Tente novamente em instantes.",
    );
  });
});

describe("garantirOk", () => {
  it("devolve a resposta quando é 2xx", async () => {
    const res = resposta(200, {});
    await expect(garantirOk(res)).resolves.toBe(res);
  });

  it("lança com a mensagem extraída quando não é 2xx", async () => {
    await expect(garantirOk(resposta(404))).rejects.toThrow("Registro não encontrado.");
  });
});

describe("mensagens auxiliares", () => {
  it("usa o fallback para status sem mensagem própria", () => {
    expect(mensagemPorStatus(418, "Falhou")).toBe("Falhou");
  });

  it("extrai a mensagem de qualquer valor capturado", () => {
    expect(mensagemDeErro(new Error("Sem conexão"))).toBe("Sem conexão");
    expect(mensagemDeErro("texto solto", "Padrão")).toBe("Padrão");
  });
});
