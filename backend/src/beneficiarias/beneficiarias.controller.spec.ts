import { ROLES_KEY } from '../auth/roles.decorator';
import { BeneficiariasController } from './beneficiarias.controller';

describe('BeneficiariasController', () => {
  it('restringe o cadastro completo a GESTORA e TRIADORA', () => {
    expect(Reflect.getMetadata(ROLES_KEY, BeneficiariasController)).toEqual([
      'GESTORA',
      'TRIADORA',
    ]);
  });

  it('permite os três perfis na busca mínima', () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, BeneficiariasController.prototype.buscar),
    ).toEqual(['GESTORA', 'TRIADORA', 'PROFISSIONAL']);
  });
});
