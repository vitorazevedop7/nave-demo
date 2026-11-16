import { AppE2E, como, criarApp, login, prismaDe } from './support/app';
import { BaseE2E, EMAILS, semearBase } from './support/fixtures';

describe('Beneficiárias (e2e)', () => {
  let app: AppE2E;
  let base: BaseE2E;
  let gestora: string;
  let triadora: string;
  let psi: string;

  beforeAll(async () => {
    app = await criarApp();
    base = await semearBase(prismaDe(app));
    gestora = await login(app, EMAILS.gestora);
    triadora = await login(app, EMAILS.triadora);
    psi = await login(app, EMAILS.psi);
  });

  afterAll(async () => {
    await app.close();
  });

  it('cadastra, lista e atualiza uma beneficiária', async () => {
    const criada = await como(app, triadora)
      .post('/beneficiarias')
      .send({
        nome: 'Nova E2E',
        cpf: '98765432100',
        data_nascimento: '1990-05-10',
      })
      .expect(201);
    const id = (criada.body as { id: string }).id;

    expect(criada.body).toMatchObject({
      nome: 'Nova E2E',
      tipo: 'ADULTA',
      status: 'ATIVA',
    });

    await como(app, triadora)
      .patch(`/beneficiarias/${id}`)
      .send({ telefone: '(31) 99999-0000' })
      .expect(200);

    const lida = await como(app, gestora)
      .get(`/beneficiarias/${id}`)
      .expect(200);
    expect(lida.body).toMatchObject({ telefone: '(31) 99999-0000' });
  });

  it('rejeita responsável que não é UUID (400)', async () => {
    await como(app, triadora)
      .post('/beneficiarias')
      .send({ nome: 'Criança', responsavel_id: 'abc' })
      .expect(400);
  });

  it('arquivamento é soft delete e preserva o histórico clínico', async () => {
    const id = base.beneficiaria.id;

    await como(app, gestora).delete(`/beneficiarias/${id}`).expect(200);

    const lista = await como(app, gestora).get('/beneficiarias').expect(200);
    expect((lista.body as { id: string }[]).map((b) => b.id)).not.toContain(id);

    const busca = await como(app, psi)
      .get('/beneficiarias/buscar?busca=Alfa')
      .expect(200);
    expect(busca.body).toEqual([]);

    await como(app, gestora).get(`/beneficiarias/${id}`).expect(404);

    const arquivada = await como(app, gestora)
      .get(`/beneficiarias/${id}?incluir_arquivadas=true`)
      .expect(200);
    expect(arquivada.body).toMatchObject({
      id,
      deletado_em: expect.any(String) as unknown,
    });

    const historico = await como(app, psi)
      .get(`/prontuarios/beneficiaria/${id}`)
      .expect(200);
    expect(historico.body).toHaveLength(Object.keys(base.prontuarios).length);

    const triagemArquivada = await como(app, triadora)
      .post('/triagens')
      .send({ beneficiaria_id: id });
    expect(triagemArquivada.status).toBe(404);
  });

  it('arquivar de novo é idempotente (200)', async () => {
    await como(app, gestora)
      .delete(`/beneficiarias/${base.beneficiaria.id}`)
      .expect(200);
  });
});
