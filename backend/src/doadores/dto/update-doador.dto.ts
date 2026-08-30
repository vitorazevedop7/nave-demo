import { IsString, IsOptional, Matches, IsEmail } from 'class-validator';

export class UpdateDoadorDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  tipo?: string;

  @IsOptional()
  @Matches(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/, {
    message: 'Telefone inválido. Use formato: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX',
  })
  telefone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'E-mail inválido' })
  email?: string;
}
