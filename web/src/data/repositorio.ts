import { CONDICOES, ESTABELECIMENTOS, LOCAIS, MUNICIPIOS, MUNICIPIO_PADRAO } from "./seed";
import type {
  Alerta,
  ChamadoSOS,
  Estabelecimento,
  Municipio,
  PraiaHoje,
  Sessao,
  Severidade,
  StatusChamado,
} from "./tipos";

/** A única porta das telas para os dados. Hoje é mock; depois, Supabase. */
export interface Repositorio {
  municipio(id: string): Promise<Municipio>;
  alertasAtivos(municipioId: string): Promise<Alerta[]>;
  praiasHoje(municipioId: string): Promise<PraiaHoje[]>;
  estabelecimentosComSelo(municipioId: string): Promise<Estabelecimento[]>;
  estabelecimentoPorSlug(slug: string): Promise<Estabelecimento | null>;
  criarSessao(dados: Omit<Sessao, "id">): Promise<Sessao>;
  enviarSOS(dados: Omit<ChamadoSOS, "id" | "status" | "criadoEm"> & { status?: StatusChamado }): Promise<ChamadoSOS>;
  /** avisa quando os alertas do município mudam; devolve a função para cancelar */
  aoMudarAlertas(municipioId: string, cb: (alertas: Alerta[]) => void): () => void;
  aoMudarChamado(id: string, cb: (c: ChamadoSOS) => void): () => void;
}

/** Ações de ensaio da demo (depois viram as telas /gestao e /central). */
export interface Ensaio {
  publicarAlerta(a: Alerta): void;
  limparAlertas(): void;
  mudarStatusChamado(id: string, status: StatusChamado): void;
  ultimoChamado(): ChamadoSOS | null;
  aoQualquerChamado(cb: (c: ChamadoSOS) => void): () => void;
}

type Estado = { alertas: Alerta[]; chamados: ChamadoSOS[] };
type Mensagem = { tipo: "estado" };

const CHAVE = "costa-cacau:estado";
const CANAL = "costa-cacau";
const PESO: Record<Severidade, number> = { perigo: 0, atencao: 1, info: 2 };

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;

function lerEstado(): Estado {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (bruto) return JSON.parse(bruto) as Estado;
  } catch {}
  return { alertas: [], chamados: [] };
}

function gravarEstado(e: Estado) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(e));
  } catch {}
}

export function criarRepositorioMock(): Repositorio & Ensaio {
  let estado = lerEstado();
  const ouvintes = new Set<() => void>();
  const canal = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(CANAL) : null;

  const notificar = () => ouvintes.forEach((f) => f());
  const mudou = () => {
    gravarEstado(estado);
    canal?.postMessage({ tipo: "estado" } satisfies Mensagem);
    notificar();
  };

  canal?.addEventListener("message", () => {
    estado = lerEstado();
    notificar();
  });
  // outra aba gravou sem BroadcastChannel (ou o canal falhou)
  if (typeof window !== "undefined") {
    window.addEventListener("storage", (ev) => {
      if (ev.key !== CHAVE) return;
      estado = lerEstado();
      notificar();
    });
  }

  const ativos = (municipioId: string) => {
    const agora = Date.now();
    const vistos = new Set<string>();
    return estado.alertas
      .filter((a) => a.municipioId === municipioId)
      .filter((a) => !a.validoAte || new Date(a.validoAte).getTime() > agora)
      .filter((a) => (vistos.has(a.id) ? false : (vistos.add(a.id), true)))
      .sort((a, b) => PESO[a.severidade] - PESO[b.severidade] || b.criadoEm.localeCompare(a.criadoEm));
  };

  const assinar = (f: () => void) => {
    ouvintes.add(f);
    return () => void ouvintes.delete(f);
  };

  return {
    async municipio(id) {
      return MUNICIPIOS.find((m) => m.id === id) ?? MUNICIPIOS.find((m) => m.id === MUNICIPIO_PADRAO)!;
    },
    async alertasAtivos(municipioId) {
      return ativos(municipioId);
    },
    async praiasHoje(municipioId) {
      const alertas = ativos(municipioId);
      return LOCAIS.filter((l) => l.municipioId === municipioId && l.tipo === "praia").map((l) => {
        const base = CONDICOES.find((c) => c.localId === l.id);
        const imposta = alertas.find((a) => a.localId === l.id && a.condicao)?.condicao;
        const condicao = imposta
          ? { localId: l.id, fonte: "Alerta oficial", data: new Date().toISOString().slice(0, 10), ...imposta }
          : base ?? {
              localId: l.id, situacao: "sem_dados" as const, bandeira: "cinza" as const, fonte: "", data: "",
              detalhe: { pt: "Sem dados hoje", es: "Sin datos hoy", en: "No data today" },
            };
        return { ...l, condicao };
      });
    },
    async estabelecimentosComSelo(municipioId) {
      return ESTABELECIMENTOS.filter((e) => e.municipioId === municipioId && e.temSelo);
    },
    async estabelecimentoPorSlug(slug) {
      return ESTABELECIMENTOS.find((e) => e.slug === slug) ?? null;
    },
    async criarSessao(dados) {
      return { id: uid("s"), ...dados };
    },
    async enviarSOS(dados) {
      const chamado: ChamadoSOS = {
        id: uid("sos"),
        criadoEm: new Date().toISOString(),
        ...dados,
        status: dados.status ?? (dados.urgencia === "nao_urgente" ? "resolvido_ia" : "enviado"),
      };
      estado = { ...estado, chamados: [...estado.chamados, chamado] };
      mudou();
      return chamado;
    },
    aoMudarAlertas(municipioId, cb) {
      return assinar(() => cb(ativos(municipioId)));
    },
    aoMudarChamado(id, cb) {
      let ultimo = "";
      return assinar(() => {
        const c = estado.chamados.find((x) => x.id === id);
        if (c && c.status !== ultimo) {
          ultimo = c.status;
          cb(c);
        }
      });
    },

    publicarAlerta(a) {
      if (estado.alertas.some((x) => x.id === a.id)) return;
      estado = { ...estado, alertas: [...estado.alertas, a] };
      mudou();
    },
    limparAlertas() {
      estado = { ...estado, alertas: [] };
      mudou();
    },
    mudarStatusChamado(id, status) {
      estado = { ...estado, chamados: estado.chamados.map((c) => (c.id === id ? { ...c, status } : c)) };
      mudou();
    },
    ultimoChamado() {
      return estado.chamados.at(-1) ?? null;
    },
    aoQualquerChamado(cb) {
      let n = estado.chamados.length;
      return assinar(() => {
        if (estado.chamados.length !== n) {
          n = estado.chamados.length;
          const c = estado.chamados.at(-1);
          if (c) cb(c);
        }
      });
    },
  };
}

let instancia: (Repositorio & Ensaio) | null = null;
export function repositorio() {
  instancia ??= criarRepositorioMock();
  return instancia;
}
