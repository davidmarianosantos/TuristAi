// Roteiro do chatbot simulado: as falas fixas por idioma e a lista de fluxos.
// Para um fluxo novo (ex.: "praia", "comer", "SOS"), acrescente-o em FLUXOS; a tela não muda.
import type { Idioma } from "@/data/tipos";
import type { Fluxo } from "./tipos";

export type Falas = {
  nomeAssistente: string;
  boasVindas(origem?: string): string;
  /** resposta quando nenhum fluxo reconhece a mensagem */
  padrao: string;
};

export const FALAS: Record<Idioma, Falas> = {
  pt: {
    nomeAssistente: "Cacauzito",
    boasVindas: (origem) =>
      `Olá! Sou o Cacauzito, o assistente do TuristAí na Costa do Cacau${origem ? `, aqui com você pela ${origem}` : ""}. Pergunte sobre praias, onde comer, transporte ou peça ajuda.`,
    padrao: "Recebi sua mensagem. Em breve vou te ajudar por aqui.",
  },
  es: {
    nomeAssistente: "Cacauzito",
    boasVindas: (origem) =>
      `¡Hola! Soy Cacauzito, el asistente de TuristAí en la Costa do Cacau${origem ? `, contigo desde ${origem}` : ""}. Pregúntame por playas, dónde comer, transporte o pide ayuda.`,
    padrao: "Recibí tu mensaje. Pronto te ayudo por aquí.",
  },
  en: {
    nomeAssistente: "Cacauzito",
    boasVindas: (origem) =>
      `Hi! I'm Cacauzito, the TuristAí assistant for the Costa do Cacau${origem ? `, here with you from ${origem}` : ""}. Ask me about beaches, where to eat, transport, or ask for help.`,
    padrao: "Got your message. I'll help you here soon.",
  },
};

/**
 * Fluxos em ordem de prioridade (o primeiro que responder `quando` = true vence).
 * Vazio por enquanto: toda mensagem cai na resposta padrão.
 *
 * Exemplo de como um fluxo futuro se encaixa (usa os mesmos dados da tela do turista):
 *   {
 *     id: "praia",
 *     quando: (m) => /praia|playa|beach/.test(m),
 *     responder: async (_m, ctx) => ({
 *       blocos: (await ctx.repo.praiasHoje(ctx.municipioId)).map((praia) => ({ tipo: "praia", praia })),
 *     }),
 *   }
 */
export const FLUXOS: Fluxo[] = [];
