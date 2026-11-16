import { propriedadesInvalidas } from '../../test-utils/validar-dto';
import { CreateUsuarioDto } from './create-usuario.dto';
import { UpdateUsuarioDto } from './update-usuario.dto';

const valido = {
  nome: 'Ana',
  email: 'ana@example.com',
  senha: 'segredo123',
  perfis: ['PROFISSIONAL'],
};

describe('DTOs de usuário', () => {
  it('aceita um cadastro válido', async () => {
    await expect(
      propriedadesInvalidas(CreateUsuarioDto, valido),
    ).resolves.toEqual([]);
  });

  it.each([
    ['perfil inexistente', ['ADMIN']],
    ['lista vazia', []],
    ['perfil repetido', ['GESTORA', 'GESTORA']],
  ])('rejeita perfis com %s', async (_caso, perfis) => {
    await expect(
      propriedadesInvalidas(CreateUsuarioDto, { ...valido, perfis }),
    ).resolves.toEqual(['perfis']);
  });

  it('não aceita senha_hash nem campos desconhecidos', async () => {
    await expect(
      propriedadesInvalidas(UpdateUsuarioDto, { senha_hash: 'x' }),
    ).resolves.toEqual(['senha_hash']);
  });

  it('permite atualização parcial com ativo booleano', async () => {
    await expect(
      propriedadesInvalidas(UpdateUsuarioDto, { ativo: false }),
    ).resolves.toEqual([]);
  });
});
