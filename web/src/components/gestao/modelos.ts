import type { Alerta, CorBandeira, Municipio, PraiaHoje, Severidade, Situacao, Traduzido } from "@/data/tipos";

/** Texto de alerta pronto e já traduzido, que a gestão aplica a uma praia para publicar (docs/adr/0003). */
export type ModeloAlerta = {
  id: "bandeira-vermelha" | "impropria-banho" | "mar-agitado";
  /** rótulo na tela da gestão */
  nome: string;
  // O título começa pelo nome da praia ("Concha: não entre no mar"): a preposição variava com o nome
  // ("na Concha", mas "em Itacarezinho") e o nome na frente também lê melhor na lista de alertas.
  tipo: string;
  severidade: Severidade;
  titulo: (praia: string) => Traduzido;
  texto: Traduzido;
  condicao: { situacao: Situacao; bandeira: CorBandeira; detalhe: Traduzido };
};

const t = (pt: string, es: string, en: string): Traduzido => ({ pt, es, en });

export const MODELOS_ALERTA: ModeloAlerta[] = [
  {
    id: "bandeira-vermelha",
    nome: "Bandeira vermelha",
    tipo: "bandeira_vermelha",
    severidade: "perigo",
    titulo: (p) => t(`${p}: não entre no mar`, `${p}: no entres al mar`, `${p}: do not enter the sea`),
    texto: t(
      "Mar agitado e correntes fortes até novo aviso.",
      "Mar agitado y corrientes fuertes hasta nuevo aviso.",
      "Rough sea and strong currents until further notice.",
    ),
    condicao: { situacao: "impropria", bandeira: "vermelha", detalhe: t("Bandeira vermelha", "Bandera roja", "Red flag") },
  },
  {
    id: "impropria-banho",
    nome: "Imprópria para banho",
    tipo: "impropria_banho",
    severidade: "atencao",
    titulo: (p) =>
      t(`${p}: água imprópria para banho`, `${p}: agua no apta para baño`, `${p}: water unsafe for swimming`),
    texto: t(
      "Evite entrar na água até o próximo boletim.",
      "Evita entrar al agua hasta el próximo boletín.",
      "Avoid going in the water until the next bulletin.",
    ),
    condicao: {
      situacao: "impropria",
      bandeira: "vermelha",
      detalhe: t("Água imprópria para banho", "Agua no apta para baño", "Water unsafe for swimming"),
    },
  },
  {
    id: "mar-agitado",
    nome: "Mar agitado",
    tipo: "mar_agitado",
    severidade: "atencao",
    titulo: (p) => t(`${p}: mar agitado`, `${p}: mar agitado`, `${p}: rough sea`),
    texto: t(
      "Entre no mar só até a cintura e perto do salva-vidas.",
      "Entra al mar solo hasta la cintura y cerca del socorrista.",
      "Only go in up to your waist and near the lifeguard.",
    ),
    condicao: { situacao: "precaucao", bandeira: "amarela", detalhe: t("Mar agitado", "Mar agitado", "Rough sea") },
  },
];

/** Quem assina o Alerta. São as fontes e os parceiros que o CLAUDE.md §5 e §7 já nomeiam. */
export type OrgaoEmissor = { id: string; nome: (municipio: Municipio) => string };

export const ORGAOS_EMISSORES: OrgaoEmissor[] = [
  { id: "prefeitura", nome: (m) => `Prefeitura de ${m.nome}` },
  { id: "inema", nome: () => "INEMA" },
  { id: "defesa-civil", nome: () => "Defesa Civil" },
  { id: "bombeiros", nome: () => "Corpo de Bombeiros" },
  { id: "marinha", nome: () => "Marinha do Brasil" },
];

/** Monta o Alerta pronto para publicar: id novo, criado agora, válido até o fim do dia. */
export function criarAlerta(
  modelo: ModeloAlerta,
  praia: PraiaHoje,
  municipio: Municipio,
  orgao: OrgaoEmissor = ORGAOS_EMISSORES[0],
): Alerta {
  const agora = new Date();
  const fimDoDia = new Date(agora);
  fimDoDia.setHours(23, 59, 59, 999);
  return {
    id: `a-${modelo.id}-${praia.id}-${orgao.id}-${agora.getTime()}`,
    tipo: modelo.tipo,
    severidade: modelo.severidade,
    municipioId: praia.municipioId,
    localId: praia.id,
    titulo: modelo.titulo(praia.nome),
    texto: modelo.texto,
    origem: orgao.nome(municipio),
    criadoEm: agora.toISOString(),
    validoAte: fimDoDia.toISOString(),
    condicao: modelo.condicao,
  };
}
