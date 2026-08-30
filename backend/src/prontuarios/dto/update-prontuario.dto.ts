import { PartialType } from '@nestjs/mapped-types';
import { CreateProntuarioDto } from './create-prontuario.dto';

export class UpdateProntuarioDto extends PartialType(CreateProntuarioDto) {}
