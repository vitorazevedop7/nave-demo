import { PartialType } from '@nestjs/swagger';
import { CreateBeneficiariaDto } from './create-beneficiaria.dto';

export class UpdateBeneficiariaDto extends PartialType(CreateBeneficiariaDto) {}
