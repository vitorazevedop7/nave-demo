import { PartialType } from '@nestjs/swagger';
import { CreateDoadorDto } from './create-doador.dto';

export class UpdateDoadorDto extends PartialType(CreateDoadorDto) {}
