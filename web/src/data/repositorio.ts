import { ATRATIVOS, CONDICOES, ESTABELECIMENTOS, LOCAIS, MUNICIPIOS, MUNICIPIO_PADRAO } from "./seed";
import type {
  Alerta,
  Atrativo,
  ChamadoSOS,
  Estabelecimento,
  EventoChamado,
  Municipio,
  PraiaHoje,
  Sessao,
  Severidade,
  StatusChamado,
} from "./tipos";

/** A única porta das telas para os dados. Hoje é mock; depois, Supabase. */
export interface Repositorio {
  municipio(id: string): Promise<Municipio>;
  /** os municípios da Costa do Cacau */
  municipios(): Promise<Municipio[]>;
  /** ids dos municípios que já têm conteúdo (praias, atrativos ou lugares) */
  municipiosComDados(): Promise<string[]>;
  /** pontos turísticos e passeios do município, na ordem de destaque */
  atrativos(municipioId: string): Promise<Atrativo[]>;
  alertasAtivos(municipioId: string): Promise<Alerta[]>;
  praiasHoje(municipioId: string): Promise<PraiaHoje[]>;
  estabelecimentosComSelo(municipioId: string): Promise<Estabelecimento[]>;
  estabelecimentoPorSlug(slug: string): Promise<Estabelecimento | null>;
  estabelecimentoPorId(id: string): Promise<Estabelecimento | null>;
  criarSessao(dados: Omit<Sessao, "id">): Promise<Sessao>;
  enviarSOS(dados: Omit<ChamadoSOS, "id" | "status" | "criadoEm"> & { status?: StatusChamado }): Promise<ChamadoSOS>;
  /** avisa quando os alertas do município mudam; devolve a função para cancelar */
  aoMudarAlertas(municipioId: string, cb: (alertas: Alerta[]) => void): () => void;
  /** avisa quando o chamado muda (status, serviço, mensagens da Central, histórico) */
  aoMudarChamado(id: string, cb: (c: ChamadoSOS) => void): () => void;
  // ---- Central Integrada ----
  chamados(): Promise<ChamadoSOS[]>;
  /** avisa a cada mudança em qualquer chamado; devolve a função para cancelar */
  aoMudarChamados(cb: (lista: ChamadoSOS[]) => void): () => void;
  /** aplica a mudança e, se vier, registra o evento no histórico do chamado */
  atualizarChamado(
    id: string,
    mudanca: Partial<Omit<ChamadoSOS, "id" | "sessaoId" | "criadoEm">>,
    evento?: Omit<EventoChamado, "em">,
  ): Promise<ChamadoSOS>;
}

/** Ações de ensaio da demo (a tela /ensaio usa para preparar e reiniciar a apresentação). */
export interface Ensaio {
  publicarAlerta(a: Alerta): void;
  limparAlertas(): void;
  mudarStatusChamado(id: string, status: StatusChamado): void;
  ultimoChamado(): ChamadoSOS | null;
  aoQualquerChamado(cb: (c: ChamadoSOS) => void): () => void;
  limparChamados(): void;
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
    async municipiosComDados() {
      const ids = [...LOCAIS, ...ATRATIVOS, ...ESTABELECIMENTOS].map((x) => x.municipioId);
      return MUNICIPIOS.map((m) => m.id).filter((id) => ids.includes(id));
    },
    async municipios() {
      return [...MUNICIPIOS];
    },
    async atrativos(municipioId) {
      return ATRATIVOS.filter((a) => a.municipioId === municipioId);
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
    async estabelecimentoPorId(id) {
      return ESTABELECIMENTOS.find((e) => e.id === id) ?? null;
    },
    async criarSessao(dados) {
      return { id: uid("s"), ...dados };
    },
    async enviarSOS(dados) {
      const criadoEm = new Date().toISOString();
      const status = dados.status ?? (dados.urgencia === "nao_urgente" ? "resolvido_ia" : "enviado");
      const chamado: ChamadoSOS = {
        id: uid("sos"),
        criadoEm,
        ...dados,
        status,
        historico: [{ em: criadoEm, tipo: status === "resolvido_ia" ? "resolvido_ia" : "aberto", servico: dados.servico }],
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
        const chave = c ? JSON.stringify([c.status, c.servico, c.atendente, c.respostas?.length, c.historico?.length]) : "";
        if (c && chave !== ultimo) {
          ultimo = chave;
          cb(c);
        }
      });
    },
    async chamados() {
      return [...estado.chamados];
    },
    aoMudarChamados(cb) {
      return assinar(() => cb([...estado.chamados]));
    },
    async atualizarChamado(id, mudanca, evento) {
      const atual = estado.chamados.find((c) => c.id === id);
      if (!atual) throw new Error(`chamado ${id} não existe`);
      const novo: ChamadoSOS = {
        ...atual,
        ...mudanca,
        historico: evento ? [...(atual.historico ?? []), { em: new Date().toISOString(), ...evento }] : atual.historico,
      };
      estado = { ...estado, chamados: estado.chamados.map((c) => (c.id === id ? novo : c)) };
      mudou();
      return novo;
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
      const em = new Date().toISOString();
      estado = {
        ...estado,
        chamados: estado.chamados.map((c) =>
          c.id !== id
            ? c
            : {
                ...c,
                status,
                atendidoEm: status === "em_atendimento" ? (c.atendidoEm ?? em) : c.atendidoEm,
                encerradoEm: status === "encerrado" ? em : c.encerradoEm,
                atendente: status === "em_atendimento" ? (c.atendente ?? "Ensaio da demo") : c.atendente,
                historico: [
                  ...(c.historico ?? []),
                  { em, tipo: status === "em_atendimento" ? "assumido" : status === "encerrado" ? "encerrado" : "aberto", texto: "Ensaio da demo" },
                ],
              },
        ),
      };
      mudou();
    },
    limparChamados() {
      estado = { ...estado, chamados: [] };
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
