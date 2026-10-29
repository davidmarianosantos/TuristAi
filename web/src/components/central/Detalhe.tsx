"use client";

import dynamic from "next/dynamic";
import { ArrowRightLeft, ChevronLeft, CircleCheck, Hand, Languages, MapPin, Send, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import type { ChamadoSOS, Estabelecimento, FichaSOS, Idioma, Servico, Traduzido } from "@/data/tipos";
import { assumir, encaminhar, encerrar, responderTurista } from "@/lib/central/acoes";
import { esperaDesde } from "@/lib/central/fila";
import { frasesPara } from "@/lib/central/frases";
import { nomePosto, SERVICOS, servicoDe, type Posto } from "@/lib/central/servicos";
import { distanciaKm } from "@/lib/mapa";
import { triarSOS } from "@/lib/triagem";
import { useRepositorio } from "@/components/turista/RepositorioContext";
import { resumo } from "./Fila";
import type { PontoMapa } from "./MapaCentral";
import { AnelEspera, IconeServico } from "./visual";

const MapaCentral = dynamic(() => import("./MapaCentral"), { ssr: false, loading: () => <div className="size-full animate-pulse bg-c-painel-2" /> });

const IDIOMA: Record<Idioma, string> = { pt: "Português", es: "Espanhol", en: "Inglês" };
const hora = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "");

function Cartao({ titulo, children, className = "" }: { titulo: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-[18px] border border-c-linha bg-c-painel p-4 ${className}`}>
      <h3 className="mb-3 text-[13px] font-semibold text-c-texto-2">{titulo}</h3>
      {children}
    </section>
  );
}

function textoEvento(e: NonNullable<ChamadoSOS["historico"]>[number]) {
  switch (e.tipo) {
    case "aberto":
      return `Turista confirmou o SOS${e.servico ? `; triagem sugeriu ${SERVICOS[e.servico].nomePt}` : "; triagem sem serviço definido"}`;
    case "resolvido_ia":
      return "Resolvido pela IA na hora, fora da fila";
    case "assumido":
      return `Assumido por ${e.texto ?? "atendente"}`;
    case "encaminhado":
      return `Encaminhado para ${e.servico ? SERVICOS[e.servico].nomePt : "outro serviço"}${e.texto ? ` por ${e.texto}` : ""}`;
    case "mensagem":
      return `Mensagem ao turista: “${e.texto ?? ""}”`;
    case "encerrado":
      return `Encerrado${e.texto ? ` por ${e.texto}` : ""}`;
  }
}

const TIPO_FICHA: Record<FichaSOS["tipo"], string> = {
  saude: "Saúde",
  seguranca: "Segurança",
  mar: "Mar",
  perdido: "Pessoa perdida",
  documento: "Documento",
  informacao: "Informação",
};

/** A ficha que o agente de SOS montou a partir do texto livre do turista. */
function FichaAgente({ ficha, origem }: { ficha: FichaSOS; origem?: string }) {
  const linhas: [string, React.ReactNode][] = [
    ["Resumo", ficha.resumoPt],
    ["Tipo", TIPO_FICHA[ficha.tipo]],
    ["Urgência", ficha.urgencia === "urgente" ? "Urgente" : "Não urgente"],
    ["Idioma", IDIOMA[ficha.idioma]],
    ["Localização", ficha.local ? `${ficha.local.lat.toFixed(4)}, ${ficha.local.lng.toFixed(4)}` : "Não enviada"],
    ["Hospedagem", ficha.hotel ?? origem ?? "Sem hospedagem"],
    ["Orientação dada", `“${ficha.orientacao}”`],
    ["Sinais no texto", ficha.sinais?.length ? ficha.sinais.join(" · ") : "Nenhum sinal claro"],
  ];
  return (
    <Cartao titulo="Ficha da triagem automática">
      <dl className="grid grid-cols-[112px_1fr] gap-x-3 gap-y-2 text-[14px] leading-snug">
        {linhas.map(([rotulo, valor]) => (
          <div key={rotulo} className="contents">
            <dt className="text-c-texto-3">{rotulo}</dt>
            <dd className={rotulo === "Resumo" ? "font-semibold" : ""}>{valor}</dd>
          </div>
        ))}
      </dl>
      {ficha.passos.length > 0 && (
        <ol className="mt-3 flex flex-col gap-1.5 border-t border-c-linha pt-3 text-[14px] leading-snug">
          {ficha.passos.map((p, i) => (
            <li key={i} className="flex gap-2">
              <b className="text-c-texto-3">{i + 1}.</b>
              {p}
            </li>
          ))}
        </ol>
      )}
      <p className="mt-3 flex gap-3 border-t border-c-linha pt-3 text-[14px] leading-snug text-c-texto-2">
        <Sparkles size={17} className="mt-0.5 shrink-0 text-c-atencao" aria-hidden />
        {ficha.motivo}
      </p>
      <p className="mt-2 pl-[29px] text-[13px] text-c-texto-3">O agente sugere; quem confirma ou encaminha é o atendente.</p>
    </Cartao>
  );
}

function MenuEncaminhar({ atual, aoEscolher }: { atual?: Servico; aoEscolher(s: Servico): void }) {
  const [aberto, setAberto] = useState(false);
  const opcoes = (Object.keys(SERVICOS) as Servico[]).filter((s) => s !== atual);
  return (
    <div className="relative">
      <button
        onClick={() => setAberto((x) => !x)}
        aria-expanded={aberto}
        className="toque flex h-12 items-center gap-2 rounded-full border border-c-linha bg-c-painel-2 px-5 text-[15px] font-semibold hover:bg-c-painel-3"
      >
        <ArrowRightLeft size={17} strokeWidth={2.2} />
        {atual ? "Encaminhar" : "Definir serviço"}
      </button>
      {aberto && (
        <ul className="aparece absolute bottom-[calc(100%+8px)] right-0 z-20 w-64 origin-bottom-right rounded-[16px] border border-c-linha bg-c-painel-3 p-1.5 shadow-3">
          {opcoes.map((s) => (
            <li key={s}>
              <button
                onClick={() => {
                  setAberto(false);
                  aoEscolher(s);
                }}
                className="flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left text-[14px] font-semibold hover:bg-c-painel-2"
              >
                <IconeServico servico={s} tamanho={30} />
                <span>
                  {SERVICOS[s].nomePt}
                  {SERVICOS[s].numero && <span className="ml-1.5 text-c-texto-3">{SERVICOS[s].numero}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Detalhe({
  c,
  agora,
  posto,
  origem,
  municipio,
  aoVoltar,
}: {
  c: ChamadoSOS;
  agora: number;
  posto: Posto;
  origem?: Estabelecimento;
  municipio?: string;
  aoVoltar(): void;
}) {
  const repo = useRepositorio();
  const [frase, setFrase] = useState<{ id: string; texto: Traduzido } | null>(null);
  const [confirmandoFim, setConfirmandoFim] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  const servico = servicoDe(c);
  const assumido = c.status === "em_atendimento";
  const aberto = c.status === "enviado";
  const fechado = c.status === "encerrado" || c.status === "resolvido_ia";
  const traduzido = !c.mensagemPt.startsWith("[texto original");
  const triagemAtual = useMemo(() => triarSOS(c.tipo, c.tipo === "outro" ? c.mensagemOriginal : null, c.idiomaOriginal), [c]);
  const motivo = c.motivoTriagem ?? triagemAtual.motivo;

  const espera = c.atendidoEm
    ? (new Date(c.atendidoEm).getTime() - new Date(c.criadoEm).getTime()) / 1000
    : (agora - new Date(esperaDesde(c)).getTime()) / 1000;

  const local = c.lat != null && c.lng != null ? { lat: c.lat, lng: c.lng } : null;
  const referencia = local ?? (origem ? { lat: origem.lat, lng: origem.lng } : null);
  const pontos = useMemo<PontoMapa[]>(() => {
    const p: PontoMapa[] = [];
    if (referencia)
      p.push({
        id: c.id,
        ...referencia,
        tipo: "chamado",
        cor: servico ? SERVICOS[servico].cor : "#c9d1d7",
        rotulo: local ? "Local enviado pelo turista" : "Sem localização: hospedagem como referência",
        destaque: true,
        pulsar: aberto,
      });
    if (origem) p.push({ id: `h-${origem.id}`, lat: origem.lat, lng: origem.lng, tipo: "hospedagem", cor: "#f8f9fa", rotulo: origem.nome });
    return p;
  }, [c.id, c.lat, c.lng, referencia?.lat, referencia?.lng, servico, aberto, origem]); // eslint-disable-line react-hooks/exhaustive-deps

  const fazer = async (acao: () => Promise<unknown>) => {
    setOcupado(true);
    try {
      await acao();
    } finally {
      setOcupado(false);
    }
  };

  const frases = frasesPara(servico);

  return (
    <article aria-label="Chamado selecionado" className="flex min-h-0 flex-1 flex-col">
      <div className="sem-barra min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-4 lg:px-6">
        {/* cabeçalho */}
        <div className="flex items-start gap-4">
          <button onClick={aoVoltar} aria-label="Voltar para a fila" className="toque -ml-2 flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-c-painel-2 lg:hidden">
            <ChevronLeft size={22} />
          </button>
          <IconeServico servico={servico} tamanho={52} />
          <div className="min-w-0 flex-1">
            <h2 className="text-[26px] font-bold leading-tight tracking-[-0.02em] lg:text-[30px]">{resumo(c)}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] font-semibold">
              <span className={`rounded-full px-2.5 py-1 ${c.urgencia === "urgente" ? "bg-c-urgente/15 text-c-urgente" : "bg-c-painel-3 text-c-texto-2"}`}>
                {c.urgencia === "urgente" ? "Urgente" : "Não urgente"}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 ${servico ? "" : "border border-dashed border-c-texto-3 text-c-texto"}`}
                style={servico ? { background: `${SERVICOS[servico].cor}22`, color: SERVICOS[servico].cor } : undefined}
              >
                {servico ? `${SERVICOS[servico].nomePt}${SERVICOS[servico].numero ? ` ${SERVICOS[servico].numero}` : ""}` : "Serviço a definir"}
              </span>
              <span className="rounded-full bg-c-painel-3 px-2.5 py-1 text-c-texto-2">
                {aberto && "Aguardando"}
                {assumido && `Em atendimento por ${c.atendente ?? "Central"}`}
                {c.status === "encerrado" && `Encerrado às ${hora(c.encerradoEm)}`}
                {c.status === "resolvido_ia" && "Resolvido pela IA"}
              </span>
            </div>
          </div>
          {c.status !== "resolvido_ia" && <AnelEspera segundos={espera} congelado={!!c.atendidoEm} />}
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="flex flex-col gap-4">
            <Cartao titulo="O que o turista disse">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 rounded-[6px] bg-c-painel-3 px-1.5 py-px text-[12px] font-bold uppercase">{c.idiomaOriginal}</span>
                <p className="text-[17px] leading-snug">“{c.mensagemOriginal}”</p>
              </div>
              {c.idiomaOriginal !== "pt" && (
                <div className="mt-3 flex items-start gap-3 border-t border-c-linha pt-3">
                  <Languages size={18} className="mt-0.5 shrink-0 text-c-azul-claro" aria-label="tradução" />
                  {traduzido ? (
                    <p className="text-[17px] font-semibold leading-snug">“{c.mensagemPt}”</p>
                  ) : (
                    <p className="text-[14px] leading-snug text-c-texto-2">
                      Texto livre em {IDIOMA[c.idiomaOriginal].toLowerCase()}: a tradução automática de texto livre chega com a IA. Use as
                      respostas prontas, que vão no idioma do turista.
                    </p>
                  )}
                </div>
              )}
            </Cartao>

            {c.ficha ? (
              <FichaAgente ficha={c.ficha} origem={origem?.nome} />
            ) : (
              <Cartao titulo="Triagem da IA">
                <p className="flex gap-3 text-[15px] leading-snug">
                  <Sparkles size={18} className="mt-0.5 shrink-0 text-c-atencao" aria-hidden />
                  {motivo}
                </p>
                <p className="mt-2 pl-[30px] text-[13px] text-c-texto-3">A IA sugere; quem confirma ou encaminha é o atendente.</p>
              </Cartao>
            )}

            {c.status === "resolvido_ia" && !c.ficha && triagemAtual.resolucao && (
              <Cartao titulo={`O que a IA respondeu ao turista (em ${IDIOMA[c.idiomaOriginal].toLowerCase()})`}>
                <ol className="flex flex-col gap-2">
                  {triagemAtual.resolucao.passos.map((p, i) => (
                    <li key={i} className="flex gap-2 text-[14px] leading-snug">
                      <b className="text-c-texto-3">{i + 1}.</b>
                      {p.pt}
                    </li>
                  ))}
                </ol>
              </Cartao>
            )}

            {!fechado && (
              <Cartao titulo="Responder ao turista">
                {!assumido && <p className="mb-3 text-[13px] text-c-texto-3">Assuma o chamado para responder.</p>}
                <div className="flex flex-wrap gap-2">
                  {frases.map((f) => (
                    <button
                      key={f.id}
                      disabled={!assumido}
                      onClick={() => setFrase(frase?.id === f.id ? null : f)}
                      aria-pressed={frase?.id === f.id}
                      className={`toque rounded-[12px] px-3 py-2 text-left text-[13.5px] leading-snug transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                        frase?.id === f.id ? "bg-c-azul text-white ring-1 ring-c-azul-claro" : "bg-c-painel-2 hover:bg-c-painel-3"
                      }`}
                    >
                      {f.texto.pt}
                    </button>
                  ))}
                </div>
                {frase && assumido && (
                  <div className="aparece mt-3 rounded-[14px] bg-c-painel-2 p-3">
                    <p className="text-[12.5px] font-semibold text-c-texto-3">O turista lê em {IDIOMA[c.idiomaOriginal].toLowerCase()}:</p>
                    <p className="mt-1 text-[15px] leading-snug">{frase.texto[c.idiomaOriginal]}</p>
                    <button
                      disabled={ocupado}
                      onClick={() =>
                        fazer(async () => {
                          await responderTurista(repo, c, frase.texto);
                          setFrase(null);
                        })
                      }
                      className="toque mt-3 flex h-10 items-center gap-2 rounded-full bg-c-azul px-4 text-[14px] font-semibold text-white hover:brightness-110 disabled:opacity-60"
                    >
                      <Send size={15} strokeWidth={2.4} />
                      Enviar ao turista
                    </button>
                  </div>
                )}
                {(c.respostas?.length ?? 0) > 0 && (
                  <ul className="mt-4 flex flex-col gap-1.5 border-t border-c-linha pt-3">
                    {c.respostas!.map((r, i) => (
                      <li key={i} className="flex gap-2 text-[13.5px] leading-snug text-c-texto-2">
                        <span className="shrink-0 tabular-nums text-c-texto-3">{hora(r.em)}</span>
                        {r.texto.pt}
                      </li>
                    ))}
                  </ul>
                )}
              </Cartao>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <section className="overflow-hidden rounded-[18px] border border-c-linha bg-c-painel">
              <div className="h-[220px]">{pontos.length ? <MapaCentral pontos={pontos} zoomMax={15} /> : null}</div>
              <p className="flex items-start gap-2 p-3 text-[13.5px] leading-snug text-c-texto-2">
                <MapPin size={16} className="mt-0.5 shrink-0" aria-hidden />
                {local
                  ? `Localização enviada pelo turista${origem ? `, a ${distanciaKm(local, origem).toFixed(1).replace(".", ",")} km da hospedagem` : ""}.`
                  : "O turista não enviou a localização. A hospedagem serve de referência."}
              </p>
            </section>

            <Cartao titulo="Turista">
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[14px]">
                <dt className="text-c-texto-3">Idioma</dt>
                <dd>{IDIOMA[c.idiomaOriginal]}</dd>
                <dt className="text-c-texto-3">Hospedagem</dt>
                <dd>{origem ? `${origem.nome}${municipio ? `, ${municipio}` : ""}` : "Não informada"}</dd>
                <dt className="text-c-texto-3">Onde fica</dt>
                <dd>{origem?.local ?? "—"}</dd>
                <dt className="text-c-texto-3">Sessão</dt>
                <dd className="tabular-nums text-c-texto-2">{c.sessaoId.slice(-6)} (anônima)</dd>
              </dl>
            </Cartao>

            <Cartao titulo="Linha do tempo">
              <ol className="flex flex-col gap-3">
                {(c.historico?.length ? c.historico : [{ em: c.criadoEm, tipo: "aberto" as const, servico }]).map((e, i) => (
                  <li key={i} className="flex gap-3 text-[13.5px] leading-snug">
                    <span className="w-11 shrink-0 tabular-nums text-c-texto-3">{hora(e.em)}</span>
                    <span>{textoEvento(e)}</span>
                  </li>
                ))}
              </ol>
            </Cartao>
          </div>
        </div>
      </div>

      {/* ações: sempre à vista no pé do chamado */}
      <div className="flex flex-wrap items-center gap-2 border-t border-c-linha bg-c-painel px-4 py-3 lg:px-6">
        {aberto && (
          <button
            disabled={ocupado}
            onClick={() => fazer(() => assumir(repo, c, posto))}
            className="toque flex h-12 items-center gap-2 rounded-full bg-c-azul px-6 text-[15px] font-bold text-white hover:brightness-110 disabled:opacity-60"
          >
            <Hand size={18} strokeWidth={2.2} />
            Assumir chamado
            <kbd className="ml-1 rounded-[6px] bg-white/15 px-1.5 text-[12px] font-semibold">A</kbd>
          </button>
        )}
        {assumido &&
          (confirmandoFim ? (
            <>
              <button
                disabled={ocupado}
                onClick={() => fazer(async () => {
                  await encerrar(repo, c, posto);
                  setConfirmandoFim(false);
                })}
                className="toque flex h-12 items-center gap-2 rounded-full bg-c-ok px-6 text-[15px] font-bold text-[#06210f] disabled:opacity-60"
              >
                <CircleCheck size={18} strokeWidth={2.4} />
                Confirmar encerramento
              </button>
              <button onClick={() => setConfirmandoFim(false)} className="toque h-12 rounded-full px-4 text-[15px] font-semibold text-c-texto-2 hover:bg-c-painel-2">
                Cancelar
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmandoFim(true)}
              className="toque flex h-12 items-center gap-2 rounded-full bg-c-painel-3 px-6 text-[15px] font-bold hover:bg-c-painel-2"
            >
              <CircleCheck size={18} strokeWidth={2.2} />
              Encerrar atendimento
            </button>
          ))}
        {c.status === "resolvido_ia" && (
          <button
            disabled={ocupado}
            onClick={() => fazer(() => assumir(repo, c, posto))}
            className="toque flex h-12 items-center gap-2 rounded-full bg-c-painel-3 px-6 text-[15px] font-bold hover:bg-c-painel-2"
          >
            <Hand size={18} strokeWidth={2.2} />
            Acompanhar com um atendente
          </button>
        )}
        {c.status === "encerrado" && <p className="text-[14px] text-c-texto-2">Atendimento encerrado às {hora(c.encerradoEm)}.</p>}
        {!fechado && (
          <div className="ml-auto">
            <MenuEncaminhar atual={servico} aoEscolher={(s) => fazer(() => encaminhar(repo, c, s, posto))} />
          </div>
        )}
        {!fechado && posto !== "coordenacao" && servico && servico !== posto && (
          <p className="w-full text-[12.5px] text-c-texto-3">Este chamado é de {SERVICOS[servico].nomePt}; você está no posto {nomePosto(posto)}.</p>
        )}
      </div>
    </article>
  );
}
