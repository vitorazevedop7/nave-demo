import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DialogProvider } from "@/components/DialogProvider";
import Doacoes from "./page";

const fetchAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  fetchAuth: (...args: unknown[]) => fetchAuth(...args) as unknown,
}));

const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { "Content-Type": "application/json" } });

const DOADOR = { id: "d1", nome: "Doadora Aurora", tipo: "PESSOA_FISICA", telefone: null, email: null };

beforeEach(() => {
  fetchAuth.mockReset();
  fetchAuth.mockImplementation((url: string, init?: RequestInit) => {
    if (init?.method && init.method !== "GET") return Promise.resolve(json({ id: "d1" }));
    if (url.endsWith("/doadores")) return Promise.resolve(json([DOADOR]));
    if (url.endsWith("/campanhas-doacoes")) return Promise.resolve(json([]));
    return Promise.resolve(json([]));
  });
});

const renderizar = async () => {
  render(
    <DialogProvider>
      <Doacoes />
    </DialogProvider>,
  );
  await screen.findByText("Registro de Doações");
};

const chamadas = (metodo: string) =>
  fetchAuth.mock.calls.filter(([, init]) => (init as RequestInit | undefined)?.method === metodo);

describe("Doações — cadastro de doadores", () => {
  it("editar um doador atualiza o registro existente em vez de criar outro", async () => {
    await renderizar();
    await userEvent.click(screen.getByRole("button", { name: /Gerenciar/ }));
    await userEvent.click(screen.getByRole("button", { name: "Editar Doadora Aurora" }));

    const dialogo = screen.getByRole("dialog", { name: "Editar Doador" });
    const nome = within(dialogo).getByLabelText("Nome *");
    await userEvent.clear(nome);
    await userEvent.type(nome, "Doadora Aurora Silva");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Salvar Alterações" }));

    expect(chamadas("POST")).toHaveLength(0);
    const [url, init] = chamadas("PATCH")[0] as [string, RequestInit];
    expect(url).toMatch(/\/doadores\/d1$/);
    expect(JSON.parse(init.body as string)).toMatchObject({ nome: "Doadora Aurora Silva" });
  });

  it("depois de editar, '+ Doador' abre um cadastro em branco", async () => {
    await renderizar();
    await userEvent.click(screen.getByRole("button", { name: /Gerenciar/ }));
    await userEvent.click(screen.getByRole("button", { name: "Editar Doadora Aurora" }));
    await userEvent.click(screen.getByRole("button", { name: "Salvar Alterações" }));

    await userEvent.click(await screen.findByRole("button", { name: "+ Doador" }));
    const dialogo = screen.getByRole("dialog", { name: "Cadastrar Doador" });
    expect(within(dialogo).getByLabelText("Nome *")).toHaveValue("");
  });

  it("valida telefone e e-mail antes de enviar", async () => {
    await renderizar();
    await userEvent.click(screen.getByRole("button", { name: "+ Doador" }));
    const dialogo = screen.getByRole("dialog", { name: "Cadastrar Doador" });

    await userEvent.type(within(dialogo).getByLabelText("Nome *"), "Novo Doador");
    await userEvent.type(within(dialogo).getByPlaceholderText("(XX) XXXXX-XXXX"), "3199");
    await userEvent.type(within(dialogo).getByPlaceholderText("doador@example.com"), "invalido@");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Cadastrar" }));

    expect(within(dialogo).getByText(/Telefone inválido/)).toBeInTheDocument();
    expect(within(dialogo).getByText("E-mail inválido")).toBeInTheDocument();
    expect(chamadas("POST")).toHaveLength(0);
  });
});
