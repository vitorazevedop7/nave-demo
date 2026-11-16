import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateProntuarioDto } from './create-prontuario.dto';

/**
 * Beneficiária e agendamento são definidos na criação e não mudam depois: um
 * PATCH que tente alterá-los é rejeitado pela validação (campo não permitido).
 */
export class UpdateProntuarioDto extends PartialType(
  OmitType(CreateProntuarioDto, ['beneficiaria_id', 'agendamento_id'] as const),
) {}
