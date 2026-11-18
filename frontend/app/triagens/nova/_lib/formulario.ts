export interface FormBeneficiaria {
  nome: string;
  cpf: string;
  data_nascimento: string;
  telefone: string;
  endereco: string;
  tipo: string;
  estado_civil: string;
  escolaridade: string;
  raca: string;
  ocupacao: string;
  empregada: string;
  status: string;
}

export interface FormQueixa {
  queixa_principal: string;
  queixa_secundaria: string;
  sintomas: string;
  tipo_violencia: string;
  observacoes: string;
}

export function maskCPF(value: string): string {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function maskTelefone(value: string): string {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}
