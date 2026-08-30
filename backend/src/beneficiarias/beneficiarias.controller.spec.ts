import { ROLES_KEY } from '../auth/roles.decorator';
import { BeneficiariasController } from './beneficiarias.controller';

describe('BeneficiariasController', () => {
  it('permite os três perfis na busca mínima', () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, BeneficiariasController.prototype.buscar),
    ).toEqual(['GESTORA', 'TRIADORA', 'PROFISSIONAL']);
  });
});
