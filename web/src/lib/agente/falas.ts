// Textos curtos dos agentes nos 3 idiomas: etapas do "raciocínio" e rótulos da triagem.
import type { Idioma, Situacao, TipoOcorrencia, Traduzido } from "@/data/tipos";

export const t = (pt: string, es: string, en: string): Traduzido => ({ pt, es, en });

export const ETAPA = {
  lendo: t("lendo a mensagem…", "leyendo el mensaje…", "reading your message…"),
  alertas: t("consultando alertas oficiais…", "consultando alertas oficiales…", "checking official alerts…"),
  praias: t("consultando praias…", "consultando playas…", "checking beaches…"),
  lugares: t("buscando recomendados…", "buscando recomendados…", "looking up recommended places…"),
  atrativos: t("consultando passeios…", "consultando paseos…", "checking tours…"),
  sos: t("sinal de emergência: indicando o SOS", "señal de emergencia: indicando el SOS", "emergency signal: pointing to SOS"),
  triando: t("fazendo a triagem…", "haciendo el triaje…", "triaging…"),
  traduzido: t("traduzido para o português para a Central", "traducido al portugués para la Central", "translated into Portuguese for the Central"),
  paraCentral: t("ficha enviada à Central", "ficha enviada a la Central", "report sent to the Central"),
  resolvendo: t("não é emergência: resolvendo por aqui", "no es emergencia: lo resolvemos aquí", "not an emergency: solving it here"),
};

export function etapaAlertas(n: number, idioma: Idioma) {
  if (n === 0) return t("nenhum alerta ativo", "ningún alerta activo", "no active alerts")[idioma];
  return t(`${n} alerta(s) ativo(s)`, `${n} alerta(s) activo(s)`, `${n} active alert(s)`)[idioma];
}

export function etapaPraias(aptas: number, total: number, idioma: Idioma) {
  return t(`${aptas} de ${total} praias próprias`, `${aptas} de ${total} playas aptas`, `${aptas} of ${total} beaches safe`)[idioma];
}

export function etapaLugares(n: number, idioma: Idioma) {
  return t(`${n} recomendado(s) encontrado(s)`, `${n} recomendado(s) encontrado(s)`, `${n} recommended place(s) found`)[idioma];
}

export const SITUACAO: Record<Situacao, Traduzido> = {
  propria: t("própria para banho", "apta para el baño", "safe for swimming"),
  precaucao: t("com cuidado", "con precaución", "use caution"),
  impropria: t("imprópria", "no apta", "unsafe"),
  sem_dados: t("sem dados hoje", "sin datos hoy", "no data today"),
};

export const TIPO_OCORRENCIA: Record<TipoOcorrencia, Traduzido> = {
  saude: t("saúde", "salud", "health"),
  seguranca: t("segurança", "seguridad", "safety"),
  mar: t("mar", "mar", "sea"),
  perdido: t("pessoa perdida", "persona perdida", "lost person"),
  documento: t("documento", "documento", "document"),
  informacao: t("informação", "información", "information"),
};

export const URGENCIA = {
  urgente: t("urgente", "urgente", "urgent"),
  nao_urgente: t("não urgente", "no urgente", "not urgent"),
};

export function etapaClassificado(urgencia: keyof typeof URGENCIA, tipo: TipoOcorrencia, idioma: Idioma) {
  const rotulo = t("classificado", "clasificado", "classified")[idioma];
  return `${rotulo}: ${URGENCIA[urgencia][idioma]} · ${TIPO_OCORRENCIA[tipo][idioma]}`;
}


/** Espera curta para as etapas simuladas não piscarem rápido demais na tela. */
export const espera = (ms: number) => new Promise((ok) => setTimeout(ok, ms));

/** Quebra um texto em pedaços para simular o streaming nas respostas de reserva. */
export function* pedacos(texto: string) {
  const partes = texto.split(/(\s+)/);
  for (let i = 0; i < partes.length; i += 4) yield partes.slice(i, i + 4).join("");
}
