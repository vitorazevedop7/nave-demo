import { propriedadesInvalidas } from '../../test-utils/validar-dto';
import { CreateProntuarioDto } from './create-prontuario.dto';
import { UpdateProntuarioDto } from './update-prontuario.dto';

const BENEFICIARIA = '0c6f4e44-58a5-4d8e-9b7a-0f3f6f2b9c11';
const AGENDAMENTO = '5a1d2f3e-4b5c-4d6e-8f70-819203a4b5c6';

describe('DTOs de prontuário', () => {
  it('aceita a criação mínima válida', async () => {
    await expect(
      propriedadesInvalidas(CreateProntuarioDto, {
        beneficiaria_id: BENEFICIARIA,
        agendamento_id: AGENDAMENTO,
        visibilidade: 'EQUIPE_CLINICA',
      }),
    ).resolves.toEqual([]);
  });

  it('não aceita autor nem especialidade vindos do cliente', async () => {
    await expect(
      propriedadesInvalidas(CreateProntuarioDto, {
        beneficiaria_id: BENEFICIARIA,
        profissional_id: AGENDAMENTO,
        especialidade: 'PSICOLOGIA',
      }),
    ).resolves.toEqual(
      expect.arrayContaining(['profissional_id', 'especialidade']),
    );
  });

  it('rejeita visibilidade fora do enum e compartilhamento que não é UUID', async () => {
    await expect(
      propriedadesInvalidas(CreateProntuarioDto, {
        beneficiaria_id: BENEFICIARIA,
        visibilidade: 'PUBLICO',
        compartilhamentos: ['nao-e-uuid'],
      }),
    ).resolves.toEqual(['visibilidade', 'compartilhamentos']);
  });

  it('impede o PATCH de trocar beneficiária, agendamento ou autor', async () => {
    await expect(
      propriedadesInvalidas(UpdateProntuarioDto, {
        beneficiaria_id: BENEFICIARIA,
        agendamento_id: AGENDAMENTO,
        profissional_id: AGENDAMENTO,
      }),
    ).resolves.toEqual([
      'beneficiaria_id',
      'agendamento_id',
      'profissional_id',
    ]);
  });

  it('permite o PATCH parcial de conteúdo e visibilidade', async () => {
    await expect(
      propriedadesInvalidas(UpdateProntuarioDto, {
        descricao: 'evolução',
        visibilidade: 'PRIVADO',
        fisioterapia: { queixa_principal: 'dor lombar', dor_intensidade: 4 },
      }),
    ).resolves.toEqual([]);
  });
});
