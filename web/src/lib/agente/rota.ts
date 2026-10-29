// Utilidades das rotas /api/agente/*: validação mínima do corpo e resposta em NDJSON.
import type { Idioma } from "@/data/tipos";
import type { EventoAgente } from "./tipos";

export const idiomaValido = (x: unknown): Idioma => (x === "es" || x === "en" ? x : "pt");

export const textoCurto = (x: unknown, max = 800) => (typeof x === "string" ? x.slice(0, max) : "");

/** Um evento por linha; se algo quebrar no meio, o fluxo fecha com "fim" para a tela não ficar esperando. */
export function respostaNdjson(eventos: AsyncGenerator<EventoAgente>) {
  const cod = new TextEncoder();
  const linha = (e: EventoAgente) => cod.encode(`${JSON.stringify(e)}\n`);
  const corpo = new ReadableStream<Uint8Array>({
    async start(saida) {
      let fechou = false;
      try {
        for await (const e of eventos) {
          if (e.tipo === "fim") fechou = true;
          saida.enqueue(linha(e));
        }
      } catch (erro) {
        console.error("[agente] erro no fluxo:", erro instanceof Error ? erro.message : erro);
      } finally {
        if (!fechou) saida.enqueue(linha({ tipo: "fim" }));
        saida.close();
      }
    },
  });
  return new Response(corpo, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store, no-transform", "X-Accel-Buffering": "no" },
  });
}
