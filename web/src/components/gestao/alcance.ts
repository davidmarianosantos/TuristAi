import type { Alerta, Idioma, SessoesEEntregas } from "@/data/tipos";

/** Alcance de um Alerta (docs/adr/0002). Só contagens: o percentual é da tela, e só quando há Sessões abertas. */
export type AlcanceDoAlerta = {
  /** Sessões do município do Alerta abertas hoje */
  abertas: number;
  /** dessas, quantas têm Entrega deste Alerta */
  alcancadas: number;
  /** alcançadas, pelo idioma da Entrega */
  porIdioma: Record<Idioma, number>;
  /** Tempo até chegar, só das Sessões que já estavam abertas quando o Alerta saiu */
  primeiraMs: number | null;
  medianaMs: number | null;
};

const mesmoDia = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export function calcularAlcance(alerta: Alerta, d: SessoesEEntregas, agora: Date): AlcanceDoAlerta {
  const abertas = d.sessoes.filter((s) => s.municipioId === alerta.municipioId && mesmoDia(new Date(s.abertaEm), agora));
  const porIdioma: Record<Idioma, number> = { pt: 0, es: 0, en: 0 };
  const criado = new Date(alerta.criadoEm).getTime();
  const tempos: number[] = [];
  let alcancadas = 0;
  for (const s of abertas) {
    // a primeira Entrega vale
    const e = d.entregas.find((x) => x.sessaoId === s.id && x.alertaId === alerta.id);
    if (!e) continue;
    alcancadas++;
    porIdioma[e.idioma]++;
    // aberta depois do Alerta: recebeu ao carregar, não conta no Tempo até chegar
    if (new Date(s.abertaEm).getTime() <= criado) tempos.push(Math.max(0, new Date(e.em).getTime() - criado));
  }
  tempos.sort((a, b) => a - b);
  const meio = Math.floor(tempos.length / 2);
  const medianaMs = !tempos.length ? null : tempos.length % 2 ? tempos[meio] : (tempos[meio - 1] + tempos[meio]) / 2;
  return { abertas: abertas.length, alcancadas, porIdioma, primeiraMs: tempos[0] ?? null, medianaMs };
}

/** null → "—"; menos de 1 min → "2 s"; senão "1 min 5 s". */
export function formatarTempo(ms: number | null): string {
  if (ms == null) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} s`;
  return s % 60 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${s / 60} min`;
}
