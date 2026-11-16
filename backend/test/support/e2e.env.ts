/**
 * Ambiente dos testes e2e. Eles APAGAM e recriam os dados do banco apontado
 * por DATABASE_URL, então só rodam contra uma base cujo nome indique teste
 * (ex.: `nave_demo_test`). Isso impede que um `.env` de desenvolvimento seja
 * usado por engano.
 */
const url = process.env.DATABASE_URL;
const nomeDoBanco = url ? new URL(url).pathname.replace(/^\//, '') : '';

if (!/test/i.test(nomeDoBanco)) {
  throw new Error(
    'Testes e2e exigem DATABASE_URL apontando para um banco de teste ' +
      `(nome contendo "test"). Recebido: "${nomeDoBanco || 'indefinido'}".`,
  );
}

process.env.JWT_SECRET ??= 'segredo-apenas-para-testes-e2e';
process.env.THROTTLE_DISABLED = 'true';
