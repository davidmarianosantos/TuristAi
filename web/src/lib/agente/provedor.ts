// Qual modelo os agentes usam. Para trocar de provedor, acrescente um caso aqui
// (ex.: `@ai-sdk/openai`) e defina AGENTE_PROVEDOR e AGENTE_MODELO no ambiente.
// Só o servidor importa este arquivo (rotas em app/api/agente): a chave nunca vai para o navegador.
import { google } from "@ai-sdk/google";
import type { LanguageModel } from "ai";

/** Devolve o modelo configurado, ou null quando falta a chave (os agentes caem nas respostas simuladas). */
export function modeloDoAgente(): LanguageModel | null {
  const provedor = process.env.AGENTE_PROVEDOR ?? "google";
  const id = process.env.AGENTE_MODELO;
  switch (provedor) {
    case "google":
      return process.env.GOOGLE_GENERATIVE_AI_API_KEY ? google(id ?? "gemini-flash-latest") : null;
    default:
      return null;
  }
}

/** Corta a espera do modelo: a demo não pode travar esperando a API. */
export const TEMPO_MAXIMO_MS = 20_000;
