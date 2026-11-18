export interface PerfilUsuario {
  id: string;
  perfil: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  especialidade: string | null;
  ativo: boolean;
  criado_em: string;
  perfis_usuario: PerfilUsuario[];
}

export interface FormUsuario {
  nome: string;
  email: string;
  especialidade: string;
  perfis: string[];
}

export interface FormSenha {
  nova: string;
  confirmar: string;
}
