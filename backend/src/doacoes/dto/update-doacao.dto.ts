import { PartialType } from '@nestjs/swagger';
import { CreateDoacaoDto } from './create-doacao.dto';

export class UpdateDoacaoDto extends PartialType(CreateDoacaoDto) {}
