// Organiza os chamados de um posto e calcula os indicadores a partir deles (nada é digitado à mão).
import type { ChamadoSOS } from "@/data/tipos";
import { visivelNoPosto, type Posto } from "./servicos";

/** Meta de tempo até alguém assumir um chamado urgente. Parâmetro da demo, não dado de pesquisa. */
export const META_ATENDIMENTO_S = 120;

const ms = (iso?: string) => (iso ? new Date(iso).getTime() : 0);
const ehHoje = (iso: string, agora: number) => new Date(iso).toDateString() === new Date(agora).toDateString();

/** Desde quando o chamado espera na fila atual: abertura, ou o último encaminhamento. */
export function esperaDesde(c: ChamadoSOS): string {
  const encaminhado = [...(c.historico ?? [])].reverse().find((e) => e.tipo === "encaminhado");
  return encaminhado?.em ?? c.criadoEm;
}

export type Fila = {
  aguardando: ChamadoSOS[];
  emAtendimento: ChamadoSOS[];
  encerrados: ChamadoSOS[];
  resolvidosIA: ChamadoSOS[];
};

export function montarFila(todos: ChamadoSOS[], posto: Posto, agora: number): Fila {
  const meus = todos.filter((c) => visivelNoPosto(c, posto));
  return {
    // urgentes primeiro; entre iguais, quem espera há mais tempo
    aguardando: meus
      .filter((c) => c.status === "enviado")
      .sort((a, b) => Number(b.urgencia === "urgente") - Number(a.urgencia === "urgente") || ms(esperaDesde(a)) - ms(esperaDesde(b))),
    emAtendimento: meus.filter((c) => c.status === "em_atendimento").sort((a, b) => ms(a.atendidoEm) - ms(b.atendidoEm)),
    encerrados: meus
      .filter((c) => c.status === "encerrado" && ehHoje(c.encerradoEm ?? c.criadoEm, agora))
      .sort((a, b) => ms(b.encerradoEm) - ms(a.encerradoEm)),
    resolvidosIA: meus
      .filter((c) => c.status === "resolvido_ia" && ehHoje(c.criadoEm, agora))
      .sort((a, b) => ms(b.criadoEm) - ms(a.criadoEm)),
  };
}

export type Indicadores = {
  aguardando: number;
  urgentesAguardando: number;
  maiorEsperaS: number | null;
  emAtendimento: number;
  /** média de hoje entre a abertura e a primeira vez que alguém assumiu */
  tempoMedioS: number | null;
  atendidosHoje: number;
  dentroDaMeta: number;
  resolvidosIA: number;
  encerrados: number;
};

export function calcularIndicadores(todos: ChamadoSOS[], posto: Posto, agora: number): Indicadores {
  const fila = montarFila(todos, posto, agora);
  const atendidos = todos.filter((c) => visivelNoPosto(c, posto) && c.atendidoEm && ehHoje(c.atendidoEm, agora));
  const tempos = atendidos.map((c) => (ms(c.atendidoEm) - ms(c.criadoEm)) / 1000);
  const urgentes = fila.aguardando.filter((c) => c.urgencia === "urgente");
  return {
    aguardando: fila.aguardando.length,
    urgentesAguardando: urgentes.length,
    maiorEsperaS: fila.aguardando.length ? Math.max(...fila.aguardando.map((c) => (agora - ms(esperaDesde(c))) / 1000)) : null,
    emAtendimento: fila.emAtendimento.length,
    tempoMedioS: tempos.length ? tempos.reduce((a, b) => a + b, 0) / tempos.length : null,
    atendidosHoje: tempos.length,
    dentroDaMeta: tempos.filter((s) => s <= META_ATENDIMENTO_S).length,
    resolvidosIA: fila.resolvidosIA.length,
    encerrados: fila.encerrados.length,
  };
}

/** "1:05", "12:40", "1:02:10" */
export function formatarDuracao(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${r}` : `${m}:${r}`;
}

/** Tom do relógio de espera em relação à meta. */
export function tomEspera(segundos: number): "ok" | "atencao" | "atrasado" {
  if (segundos >= META_ATENDIMENTO_S) return "atrasado";
  if (segundos >= META_ATENDIMENTO_S / 2) return "atencao";
  return "ok";
}
