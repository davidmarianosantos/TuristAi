// Motor do chatbot simulado. A tela chama só `boasVindas` e `responder`;
// depois, um LLM ou o WhatsApp real (Twilio) entram aqui sem mexer na tela.
import type { Idioma } from "@/data/tipos";
import { normalizar } from "@/lib/assistente";
import { FALAS, FLUXOS } from "./roteiro";
import type { Bloco, ContextoChat, RespostaChat } from "./tipos";

export function nomeAssistente(idioma: Idioma) {
  return FALAS[idioma].nomeAssistente;
}

export function boasVindas(ctx: Pick<ContextoChat, "idioma" | "origem">): Bloco[] {
  return [{ tipo: "texto", texto: FALAS[ctx.idioma].boasVindas(ctx.origem?.nome) }];
}

export async function responder(mensagem: string, idioma: Idioma, ctx: ContextoChat): Promise<RespostaChat> {
  const contexto = { ...ctx, idioma };
  const m = normalizar(mensagem);
  for (const fluxo of FLUXOS) {
    if (fluxo.quando(m, contexto)) return fluxo.responder(mensagem, contexto);
  }
  return { blocos: [{ tipo: "texto", texto: FALAS[idioma].padrao }] };
}
