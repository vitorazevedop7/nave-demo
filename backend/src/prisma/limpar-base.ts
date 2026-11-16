import { Prisma } from '@prisma/client';

/**
 * Apaga todos os dados da aplicação respeitando a ordem das chaves
 * estrangeiras. Usada pelo seed de demonstração e pelos testes e2e. Nunca
 * chame contra uma base com dados reais.
 */
export async function limparBase(db: Prisma.TransactionClient) {
  await db.prontuario_compartilhamentos.deleteMany({});
  await db.prontuarios_acupuntura.deleteMany({});
  await db.prontuarios_fisioterapia.deleteMany({});
  await db.prontuarios_psicologia_adulto.deleteMany({});
  await db.prontuarios_psicologia_crianca.deleteMany({});
  await db.prontuarios.deleteMany({});
  await db.agendamentos.deleteMany({});
  await db.queixas.deleteMany({});
  await db.encaminhamentos.deleteMany({});
  await db.triagens.deleteMany({});
  await db.doacoes.deleteMany({});
  await db.campanhas_doacoes.deleteMany({});
  await db.bazar_profissionais.deleteMany({});
  await db.bazares.deleteMany({});
  await db.doadores.deleteMany({});
  await db.perfis_usuario.deleteMany({});
  await db.beneficiarias.updateMany({ data: { responsavel_id: null } });
  await db.beneficiarias.deleteMany({});
  await db.usuarios.deleteMany({});
}
