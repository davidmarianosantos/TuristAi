import type { Alerta, CorBandeira, Municipio, PraiaHoje, Severidade, Situacao, Traduzido } from "@/data/tipos";

/** Texto de alerta pronto e já traduzido, que a gestão aplica a uma praia para publicar (docs/adr/0003). */
export type ModeloAlerta = {
  id: "bandeira-vermelha" | "impropria-banho" | "mar-agitado";
  /** rótulo na tela da gestão */
  nome: string;
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
    titulo: (p) => t(`Não entre no mar na ${p}`, `No entres al mar en ${p}`, `Do not enter the sea at ${p}`),
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
      t(`Água imprópria para banho em ${p}`, `Agua no apta para baño en ${p}`, `Water unsafe for swimming at ${p}`),
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
    titulo: (p) => t(`Mar agitado em ${p}`, `Mar agitado en ${p}`, `Rough sea at ${p}`),
    texto: t(
      "Entre no mar só até a cintura e perto do salva-vidas.",
      "Entra al mar solo hasta la cintura y cerca del socorrista.",
      "Only go in up to your waist and near the lifeguard.",
    ),
    condicao: { situacao: "precaucao", bandeira: "amarela", detalhe: t("Mar agitado", "Mar agitado", "Rough sea") },
  },
];

/** Monta o Alerta pronto para publicar: id novo, criado agora, válido até o fim do dia. */
export function criarAlerta(modelo: ModeloAlerta, praia: PraiaHoje, municipio: Municipio): Alerta {
  const agora = new Date();
  const fimDoDia = new Date(agora);
  fimDoDia.setHours(23, 59, 59, 999);
  return {
    id: `a-${modelo.id}-${praia.id}-${agora.getTime()}`,
    tipo: modelo.tipo,
    severidade: modelo.severidade,
    municipioId: praia.municipioId,
    localId: praia.id,
    titulo: modelo.titulo(praia.nome),
    texto: modelo.texto,
    origem: `Prefeitura de ${municipio.nome}`,
    criadoEm: agora.toISOString(),
    validoAte: fimDoDia.toISOString(),
    condicao: modelo.condicao,
  };
}
