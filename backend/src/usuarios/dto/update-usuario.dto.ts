import { IsString, IsEmail, IsOptional, IsArray, IsBoolean, MinLength } from 'class-validator';

export class UpdateUsuarioDto {
  @IsString()
  @IsOptional()
  nome?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  senha?: string;

  @IsString()
  @IsOptional()
  especialidade?: string;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  perfis?: string[];
}
