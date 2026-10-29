// Agente de SOS: lê o texto livre do turista (PT/ES/EN), classifica tipo e urgência,
// traduz para o português e monta a ficha da Central. Regra de ouro: na dúvida, urgente.
// Sem chave ou com a API fora do ar, as regras de palavra-chave (lib/triagem) fazem a triagem.
import { generateText, Output, type LanguageModel } from "ai";
import { z } from "zod";
import type { FichaSOS, Idioma, Servico, TipoOcorrencia } from "@/data/tipos";
import { normalizar } from "@/lib/assistente";
import { triarSOS } from "@/lib/triagem";
import { espera, ETAPA, etapaClassificado, NOME_IDIOMA, pedacos, t } from "./falas";
import { modeloDoAgente, TEMPO_MAXIMO_MS } from "./provedor";
import type { EventoAgente, PedidoSOS } from "./tipos";

const TIPOS = ["saude", "seguranca", "mar", "perdido", "documento", "informacao"] as const;

export const SERVICO_DA_OCORRENCIA: Record<TipoOcorrencia, Servico> = {
  saude: "samu",
  seguranca: "policia",
  mar: "bombeiros",
  perdido: "bombeiros",
  documento: "turismo",
  informacao: "turismo",
};

const ESQUEMA = z.object({
  tipo: z.enum(TIPOS),
  urgencia: z.enum(["urgente", "nao_urgente"]),
  confianca: z.enum(["alta", "baixa"]).describe("baixa se a mensagem for ambígua"),
  mensagemPt: z.string().describe("tradução fiel da mensagem para o português do Brasil"),
  resumoPt: z.string().describe("resumo para o atendente, em português, até 12 palavras"),
  motivo: z.string().describe("por que classificou assim, uma frase em português"),
  orientacao: z.string().describe("orientação imediata ao turista, no idioma dele, até 2 frases curtas"),
  passos: z.array(z.string()).describe("se não urgente, 2 a 4 passos curtos no idioma do turista; se urgente, lista vazia"),
});

function instrucoes(p: PedidoSOS) {
  return `Você faz a triagem de pedidos de ajuda de turistas na Costa do Cacau (Bahia, Brasil). Um atendente humano da Central confirma depois; você não decide sozinho.

Tipos:
- saude: doença, ferimento, mal-estar, alergia, desmaio.
- seguranca: roubo, furto, assalto, agressão, ameaça, golpe, alguém seguindo.
- mar: afogamento, correnteza, acidente na água, alguém sumiu no mar.
- perdido: pessoa perdida ou desaparecida (trilha, mata, cidade), inclusive criança.
- documento: perda de documentos ou carteira SEM violência nem ameaça.
- informacao: dúvida ou pedido sem risco.

Urgência:
- "urgente" se houver risco à vida ou à integridade, crime acontecendo ou recente, criança ou pessoa desaparecida, ou qualquer dúvida.
- "nao_urgente" só quando claramente não há risco (documento perdido sem violência, pedido de informação).
- Na dúvida, "urgente" com confianca "baixa".

Campos:
- orientacao: escreva em ${NOME_IDIOMA[p.idioma]}. Se urgente, diga que a Central foi avisada e cite o número certo (190 polícia, 192 SAMU, 193 bombeiros), com uma ação prática para agora. Nunca prometa tempo de chegada.
- passos: em ${NOME_IDIOMA[p.idioma]}; vazio se urgente.
- mensagemPt, resumoPt e motivo: em português.

Contexto: ${p.hotel ? `hospedado na ${p.hotel}` : "sem hotel de origem"}; ${p.local ? "localização enviada" : "sem localização"}.`;
}

async function triarComModelo(modelo: LanguageModel, p: PedidoSOS): Promise<FichaSOS> {
  const { output: o } = await generateText({
    model: modelo,
    system: instrucoes(p),
    prompt: p.texto,
    output: Output.object({ schema: ESQUEMA }),
    temperature: 0,
    abortSignal: AbortSignal.timeout(TEMPO_MAXIMO_MS),
  });
  // trava de segurança: palavra de emergência nas regras ou dúvida do modelo sobem para urgente
  const regras = triarSOS("outro", p.texto, p.idioma);
  const sobe = o.urgencia === "nao_urgente" && (o.confianca === "baixa" || (regras.urgencia === "urgente" && !!regras.servico));
  const urgencia = sobe ? "urgente" : o.urgencia;
  return {
    tipo: o.tipo,
    urgencia,
    resumoPt: o.resumoPt,
    mensagemPt: o.mensagemPt,
    idioma: p.idioma,
    servico: SERVICO_DA_OCORRENCIA[o.tipo],
    motivo: sobe ? `${o.motivo} Subiu para urgente pela regra “na dúvida, urgente”.` : o.motivo,
    orientacao: sobe ? ORIENTACAO[o.tipo][p.idioma] : o.orientacao,
    passos: urgencia === "urgente" ? [] : o.passos,
    local: p.local ?? null,
    hotel: p.hotel ?? null,
    modo: "ia",
  };
}

// ---------- reserva: regras de palavra-chave ----------

const ORIENTACAO: Record<TipoOcorrencia, ReturnType<typeof t>> = {
  saude: t(
    "A Central foi avisada. Se for grave, ligue 192 agora e peça ajuda a quem estiver perto.",
    "La Central fue avisada. Si es grave, llama al 192 ahora y pide ayuda a quien esté cerca.",
    "The Central has been alerted. If it is serious, call 192 now and ask people nearby for help.",
  ),
  seguranca: t(
    "A Central foi avisada. Vá para um lugar seguro e movimentado; se estiver em perigo, ligue 190.",
    "La Central fue avisada. Ve a un lugar seguro y con gente; si estás en peligro, llama al 190.",
    "The Central has been alerted. Move to a safe, busy place; if you are in danger, call 190.",
  ),
  mar: t(
    "A Central foi avisada. Não entre na água para resgatar: chame o salva-vidas e ligue 193.",
    "La Central fue avisada. No entres al agua a rescatar: llama al socorrista y al 193.",
    "The Central has been alerted. Do not go into the water to rescue: call the lifeguard and 193.",
  ),
  perdido: t(
    "A Central foi avisada. Fique onde está, economize bateria e, se puder, ligue 193.",
    "La Central fue avisada. Quédate donde estás, ahorra batería y, si puedes, llama al 193.",
    "The Central has been alerted. Stay where you are, save battery and, if you can, call 193.",
  ),
  documento: t(
    "Não é emergência: veja os passos abaixo para resolver.",
    "No es una emergencia: mira los pasos de abajo para resolverlo.",
    "Not an emergency: follow the steps below.",
  ),
  informacao: t(
    "A Central foi avisada e um atendente vai te responder. Em perigo, ligue 190, 192 ou 193.",
    "La Central fue avisada y un agente te responderá. Si hay peligro, llama al 190, 192 o 193.",
    "The Central has been alerted and an agent will reply. If in danger, call 190, 192 or 193.",
  ),
};

const RESUMO: Record<TipoOcorrencia, string> = {
  saude: "Problema de saúde relatado pelo turista",
  seguranca: "Ocorrência de segurança (roubo, ameaça ou agressão)",
  mar: "Emergência no mar",
  perdido: "Pessoa perdida",
  documento: "Documento perdido, sem violência",
  informacao: "Pedido sem categoria clara: confirmar com o turista",
};

const MAR = ["afog", "ahog", "drown", "mar", "onda", "ola", "wave", "corrent", "current", "agua", "water", "sea", "praia", "playa", "beach"];

function tipoPorRegra(texto: string, servico?: Servico): TipoOcorrencia {
  if (servico === "policia") return "seguranca";
  if (servico === "samu") return "saude";
  if (servico === "turismo") return "documento";
  if (servico === "bombeiros") return normalizar(texto).split(" ").some((w) => MAR.some((m) => w.startsWith(m))) ? "mar" : "perdido";
  return "informacao";
}

function triarSimulado(p: PedidoSOS): FichaSOS {
  const r = triarSOS("outro", p.texto, p.idioma);
  const tipo = tipoPorRegra(p.texto, r.servico);
  return {
    tipo,
    urgencia: r.urgencia,
    resumoPt: RESUMO[tipo],
    mensagemPt: r.mensagemPt,
    idioma: p.idioma,
    // sem palavra reconhecida, fica sem serviço: um atendente decide
    servico: r.servico,
    motivo: `${r.motivo} (regras de reserva, sem modelo de IA)`,
    orientacao: ORIENTACAO[tipo][p.idioma],
    passos: r.resolucao?.passos.map((x) => x[p.idioma]) ?? [],
    local: p.local ?? null,
    hotel: p.hotel ?? null,
    modo: "simulado",
  };
}

/** Roda a triagem e transmite as etapas, a ficha e a orientação ao turista. */
export async function* rodarSOS(p: PedidoSOS, idioma: Idioma = p.idioma): AsyncGenerator<EventoAgente> {
  yield { tipo: "etapa", texto: ETAPA.lendo[idioma] };
  yield { tipo: "etapa", texto: ETAPA.triando[idioma] };
  const modelo = modeloDoAgente();
  let ficha: FichaSOS | null = null;
  if (modelo) {
    try {
      ficha = await triarComModelo(modelo, p);
    } catch (erro) {
      console.error("[agente/sos] modelo falhou, usando as regras:", erro instanceof Error ? erro.message : erro);
    }
  }
  if (!ficha) {
    await espera(450);
    ficha = triarSimulado(p);
  }
  yield { tipo: "etapa", texto: etapaClassificado(ficha.urgencia, ficha.tipo, idioma) };
  if (idioma !== "pt" && ficha.modo === "ia") yield { tipo: "etapa", texto: ETAPA.traduzido[idioma] };
  yield { tipo: "etapa", texto: ficha.urgencia === "urgente" ? ETAPA.paraCentral[idioma] : ETAPA.resolvendo[idioma] };
  yield { tipo: "ficha", ficha };
  for (const pedaco of pedacos(ficha.orientacao)) {
    yield { tipo: "texto", delta: pedaco };
    await espera(30);
  }
  yield { tipo: "fim", modo: ficha.modo };
}
