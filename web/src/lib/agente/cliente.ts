// Lado do navegador: chama /api/agente/<rota> e entrega cada evento do fluxo NDJSON assim que chega.
import type { EventoAgente, PedidoGuia, PedidoSOS } from "./tipos";

type Rotas = { guia: PedidoGuia; sos: PedidoSOS };

/** Lança erro se a rota não responder ou o fluxo cair antes do "fim": quem chama usa a sua reserva local. */
export async function chamarAgente<R extends keyof Rotas>(rota: R, pedido: Rotas[R], aoEvento: (e: EventoAgente) => void) {
  const r = await fetch(`/api/agente/${rota}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pedido),
  });
  if (!r.ok || !r.body) throw new Error(`agente ${rota}: HTTP ${r.status}`);
  const leitor = r.body.pipeThrough(new TextDecoderStream()).getReader();
  let resto = "";
  let terminou = false;
  const processar = (linha: string) => {
    if (!linha.trim()) return;
    const e = JSON.parse(linha) as EventoAgente;
    if (e.tipo === "fim") terminou = true;
    aoEvento(e);
  };
  for (;;) {
    const { value, done } = await leitor.read();
    if (done) break;
    resto += value;
    const linhas = resto.split("\n");
    resto = linhas.pop() ?? "";
    linhas.forEach(processar);
  }
  processar(resto);
  if (!terminou) throw new Error(`agente ${rota}: fluxo interrompido`);
}
