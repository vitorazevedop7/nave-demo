import { PartialType } from '@nestjs/mapped-types';
import { CreateBeneficiarioDto } from './create-beneficiaria.dto';

export class UpdateBeneficiarioDto extends PartialType(CreateBeneficiarioDto) {}