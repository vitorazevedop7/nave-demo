// Visibilidade de prontuário — rótulos e regras de apresentação.
//
// Os quatro níveis NÃO formam uma escala linear: ESPECIALIDADE e GESTORAS são
// incomparáveis entre si. Nada aqui pode virar comparação numérica ou ordenação
// por "nível de abertura" — a ordem abaixo é só a ordem de exibição aprovada
// pela ONG.

export type Visibilidade =
  | "PRIVADO"
  | "ESPECIALIDADE"
  | "GESTORAS"
  | "EQUIPE_CLINICA";

export const VISIBILIDADE_PADRAO: Visibilidade = "PRIVADO";

// Nome da profissão no plural, por especialidade. O rótulo de ESPECIALIDADE
// acompanha a especialidade do prontuário — nunca "psicólogos" fixo.
const PROFISSIONAIS_POR_ESPECIALIDADE: Record<string, string> = {
  PSICOLOGIA: "psicólogos",
  FISIOTERAPIA: "fisioterapeutas",
  ACUPUNTURA: "acupunturistas",
  ASSISTENCIA_SOCIAL: "assistentes sociais",
};

const NOME_ESPECIALIDADE: Record<string, string> = {
  PSICOLOGIA: "Psicologia",
  FISIOTERAPIA: "Fisioterapia",
  ACUPUNTURA: "Acupuntura",
  ASSISTENCIA_SOCIAL: "Assistência Social",
  FEPAD: "FEPAD",
};

export function nomeEspecialidade(especialidade?: string | null): string {
  if (!especialidade) return "";
  const chave = especialidade.toUpperCase();
  return NOME_ESPECIALIDADE[chave] ?? especialidade;
}

/** "psicólogos", "fisioterapeutas"… e, sem profissão conhecida, "profissionais de FEPAD". */
export function profissionaisDaEspecialidade(
  especialidade?: string | null,
): string {
  if (!especialidade) return "profissionais da mesma especialidade";
  const chave = especialidade.toUpperCase();
  return (
    PROFISSIONAIS_POR_ESPECIALIDADE[chave] ??
    `profissionais de ${nomeEspecialidade(especialidade)}`
  );
}

export type OpcaoVisibilidade = {
  valor: Visibilidade;
  rotulo: string;
  descricao: string;
};

/** As quatro opções, na ordem e com os rótulos aprovados pela ONG. */
export function opcoesVisibilidade(
  especialidade?: string | null,
): OpcaoVisibilidade[] {
  const profissionais = profissionaisDaEspecialidade(especialidade);
  return [
    {
      valor: "PRIVADO",
      rotulo: "Só eu",
      descricao: "Ninguém além de você abre este laudo.",
    },
    {
      valor: "ESPECIALIDADE",
      rotulo: `Só ${profissionais}`,
      descricao: `Profissionais da mesma especialidade (${nomeEspecialidade(
        especialidade,
      )}). As gestoras não entram por aqui.`,
    },
    {
      valor: "GESTORAS",
      rotulo: "Eu e as gestoras",
      descricao: "As gestoras da ONG. Os demais profissionais não entram.",
    },
    {
      valor: "EQUIPE_CLINICA",
      rotulo: "Toda a equipe clínica",
      descricao: "Todos os profissionais e as gestoras.",
    },
  ];
}

/** Frase curta de leitura: "Visível para você e as gestoras". */
export function resumoVisibilidade(
  visibilidade: Visibilidade | undefined,
  especialidade?: string | null,
): string {
  switch (visibilidade) {
    case "ESPECIALIDADE":
      return `Visível para você e ${profissionaisDaEspecialidade(especialidade)}`;
    case "GESTORAS":
      return "Visível para você e as gestoras";
    case "EQUIPE_CLINICA":
      return "Visível para toda a equipe clínica";
    case "PRIVADO":
    default:
      return "Visível só para você";
  }
}

export type UsuarioCompartilhavel = {
  id: string;
  nome: string;
  especialidade: string | null;
  perfis: string[];
};

export function descreverUsuario(usuario: UsuarioCompartilhavel): string {
  const partes = [
    usuario.especialidade ? nomeEspecialidade(usuario.especialidade) : null,
    usuario.perfis.includes("GESTORA") ? "Gestora" : null,
  ].filter(Boolean);
  return partes.join(" · ");
}
