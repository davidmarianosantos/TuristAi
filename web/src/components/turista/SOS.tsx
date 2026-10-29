"use client";

import { Ambulance, Flame, LifeBuoy, Siren } from "lucide-react";
import { useEffect, useState } from "react";
import type { ChamadoSOS, Estabelecimento, FichaSOS, Sessao, TipoSOS } from "@/data/tipos";
import type { Chave } from "@/i18n/textos";
import { chamadoDaFicha } from "@/lib/agente/chamado";
import { chamarAgente } from "@/lib/agente/cliente";
import { useIdioma } from "@/lib/idioma";
import { pedirLocalizacao } from "@/lib/localizacao";
import { triarSOS, type Triagem } from "@/lib/triagem";
import { SERVICOS, servicoDe } from "@/lib/central/servicos";
import { Folha } from "@/components/ui/Folha";
import { EtapasAgente } from "./Assistente";
import { useRepositorio } from "./RepositorioContext";

const FRASES: { tipo: Exclude<TipoSOS, "outro">; chave: Chave }[] = [
  { tipo: "roubo", chave: "fRoubo" },
  { tipo: "medica", chave: "fMedica" },
  { tipo: "perdido", chave: "fPerdido" },
  { tipo: "documentos", chave: "fDocumentos" },
];

/** Barra flutuante no celular e no tablet; no desktop o SOS mora na coluna lateral (CartaoSOS). */
export function RodapeSOS({ aoAbrir }: { aoAbrir(): void }) {
  const { t } = useIdioma();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 px-3 pb-[max(12px,env(safe-area-inset-bottom))] lg:hidden">
      <div className="pointer-events-auto mx-auto flex max-w-[560px] items-center justify-between gap-3 rounded-full border border-line/80 bg-card/85 py-2 pl-5 pr-2 shadow-3 backdrop-blur-xl">
        <span className="flex items-center gap-2 text-[15px] font-semibold text-ink">
          <LifeBuoy size={18} strokeWidth={2.4} className="text-danger" />
          {t("precisaAjuda")}
        </span>
        <button
          onClick={aoAbrir}
          className="toque h-11 rounded-full bg-danger-bg px-6 text-[15px] font-extrabold tracking-[0.04em] text-danger-ink ring-2 ring-danger/70 ring-inset hover:bg-danger hover:text-white"
        >
          {t("sos")}
        </button>
      </div>
    </div>
  );
}

/** SOS na barra do topo do desktop: sempre à vista, sem cobrir o conteúdo. */
export function BotaoSOSTopo({ aoAbrir }: { aoAbrir(): void }) {
  const { t } = useIdioma();
  return (
    <button
      onClick={aoAbrir}
      aria-label={`${t("sos")}: ${t("precisaAjuda")}`}
      className="toque flex h-10 items-center gap-1.5 rounded-full bg-danger px-4 text-[14px] font-extrabold tracking-[0.04em] text-white shadow-1 hover:brightness-110"
    >
      <LifeBuoy size={17} strokeWidth={2.6} />
      {t("sos")}
    </button>
  );
}

export const TELEFONES: { n: string; c: Chave; icone: typeof Siren; cor: string }[] = [
  { n: "190", c: "policia", icone: Siren, cor: "#0b4f6c" },
  { n: "192", c: "samu", icone: Ambulance, cor: "#c62828" },
  { n: "193", c: "bombeiros", icone: Flame, cor: "#b45309" },
];

export function Telefones({ grandes = false }: { grandes?: boolean }) {
  const { t } = useIdioma();
  return (
    <div className="grid grid-cols-3 gap-2">
      {TELEFONES.map(({ n, c, icone: Icone, cor }) => (
        <a
          key={n}
          href={`tel:${n}`}
          className={`toque flex flex-col items-start gap-2 rounded-[16px] border border-line bg-card p-3.5 text-[13px] font-medium text-ink-2 lg:flex-row lg:items-center lg:gap-4 lg:p-5 lg:text-[14px] ${grandes ? "py-4" : ""}`}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full lg:size-12" style={{ background: `${cor}1a`, color: cor }}>
            <Icone size={18} strokeWidth={2.4} />
          </span>
          <span>
            <b className={`block font-extrabold leading-none tracking-[-0.03em] text-ink ${grandes ? "text-[28px]" : "text-[24px] lg:text-[30px]"}`}>{n}</b>
            {t(c)}
          </span>
        </a>
      ))}
    </div>
  );
}

// Fluxo: escolher o que houve, triagem na hora; urgente pede confirmação antes de enviar,
// não urgente resolve aqui com opção de pedir uma pessoa. Nada sai sem o turista confirmar.
// Texto livre passa pelo agente de SOS: urgente vai direto à Central (escrever é intenção clara);
// os botões de frase pronta continuam pedindo confirmação, porque um toque errado acontece.
type Fase = "escolher" | "analisando" | "confirmar" | "resolvido" | "enviado" | "erro";
type Pedido = { tipo: TipoSOS; texto: string; triagem: Triagem; urgencia: Triagem["urgencia"]; ficha?: FichaSOS };

export function FolhaSOS({
  aberta,
  aoFechar,
  sessao,
  origem,
}: {
  aberta: boolean;
  aoFechar(): void;
  sessao: Sessao | null;
  origem: Estabelecimento | null;
}) {
  const { t, tr, idioma } = useIdioma();
  const repo = useRepositorio();

  const [fase, setFase] = useState<Fase>("escolher");
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [enviarLocal, setEnviarLocal] = useState(true);
  const [escrevendo, setEscrevendo] = useState(false);
  const [livre, setLivre] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [chamado, setChamado] = useState<ChamadoSOS | null>(null);
  const [comLocal, setComLocal] = useState(false);
  const [etapas, setEtapas] = useState<string[]>([]);
  const [orientacao, setOrientacao] = useState("");

  // acompanha o status do chamado enviado
  useEffect(() => {
    if (!chamado || fase !== "enviado") return;
    return repo.aoMudarChamado(chamado.id, setChamado);
  }, [chamado?.id, fase, repo]); // eslint-disable-line react-hooks/exhaustive-deps

  const base = (p: Pedido) => ({
    sessaoId: sessao?.id ?? "sem-sessao",
    tipo: p.tipo,
    mensagemOriginal: p.texto,
    mensagemPt: p.triagem.mensagemPt,
    idiomaOriginal: idioma,
    origemId: origem?.id,
    // a triagem já sugere o serviço da Central e explica o porquê ao atendente
    servico: p.triagem.servico,
    motivoTriagem: p.triagem.motivo,
    ...(p.ficha ? { ficha: p.ficha } : {}),
  });

  const triarComAgente = async (texto: string) => {
    setFase("analisando");
    setEtapas([]);
    setOrientacao("");
    // a localização é pedida em paralelo com a triagem, para não atrasar o envio urgente
    const posicao = enviarLocal ? pedirLocalizacao(6000) : Promise.resolve(null);
    let ficha: FichaSOS | null = null;
    try {
      await chamarAgente("sos", { texto, idioma, hotel: origem?.nome ?? null, local: null }, (e) => {
        if (e.tipo === "etapa") setEtapas((x) => [...x, e.texto]);
        if (e.tipo === "ficha") ficha = e.ficha;
        if (e.tipo === "texto") setOrientacao((x) => x + e.delta);
      });
    } catch {}
    const f = ficha as FichaSOS | null;
    if (!f) return escolher("outro", texto); // sem rede: as regras locais fazem a triagem
    const triagem: Triagem = {
      urgencia: f.urgencia,
      mensagemPt: f.mensagemPt,
      servico: f.servico,
      motivo: f.motivo,
      resolucao: f.passos.length ? { passos: f.passos.map((x) => ({ pt: x, es: x, en: x })) } : undefined,
    };
    const p: Pedido = { tipo: "outro", texto, triagem, urgencia: f.urgencia, ficha: f };
    setPedido(p);
    const sessaoId = sessao?.id ?? "sem-sessao";
    if (f.urgencia !== "urgente") {
      setFase("resolvido");
      void repo.enviarSOS(chamadoDaFicha(f, texto, sessaoId, origem?.id)).catch(() => {});
      return;
    }
    const local = await posicao;
    try {
      const comFicha = { ...f, local };
      const c = await repo.enviarSOS(chamadoDaFicha(comFicha, texto, sessaoId, origem?.id));
      setPedido({ ...p, ficha: comFicha });
      setComLocal(!!local);
      setChamado(c);
      setFase("enviado");
    } catch {
      setFase("erro");
    }
  };

  const escolher = (tipo: TipoSOS, texto: string) => {
    const triagem = triarSOS(tipo, tipo === "outro" ? texto : null, idioma);
    const p = { tipo, texto, triagem, urgencia: triagem.urgencia };
    setPedido(p);
    if (triagem.urgencia === "urgente") {
      setFase("confirmar");
    } else {
      setFase("resolvido");
      // registro para os indicadores: a Central vê como "resolvido pela IA", fora da fila
      void repo.enviarSOS({ ...base(p), urgencia: "nao_urgente", status: "resolvido_ia" }).catch(() => {});
    }
  };

  const confirmar = async () => {
    if (!pedido || enviando) return;
    setEnviando(true);
    const pos = enviarLocal ? await pedirLocalizacao(6000) : null;
    try {
      const c = await repo.enviarSOS({ ...base(pedido), urgencia: pedido.urgencia, status: "enviado", ...(pos ?? {}) });
      setComLocal(!!pos);
      setChamado(c);
      setFase("enviado");
    } catch {
      setFase("erro");
    } finally {
      setEnviando(false);
    }
  };

  const recomecar = () => {
    setFase("escolher");
    setPedido(null);
    setChamado(null);
    setEscrevendo(false);
    setLivre("");
  };

  const fechar = () => {
    aoFechar();
    if (fase !== "enviado") recomecar();
  };

  const hora = (iso: string) =>
    new Intl.DateTimeFormat(idioma === "pt" ? "pt-BR" : idioma, { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

  const titulo = {
    escolher: t("oQueAconteceu"),
    analisando: t("oQueAconteceu"),
    confirmar: pedido?.urgencia === "urgente" ? t("triagemUrgente") : t("avisarCentralTitulo"),
    resolvido: t("resolvidoAqui"),
    enviado: t("centralRecebeu"),
    erro: t("sos"),
  }[fase];

  const item = "toque flex min-h-[54px] items-center rounded-[16px] bg-surface px-4 text-left text-[16px] font-semibold hover:bg-surface-2";

  return (
    <Folha aberta={aberta} aoFechar={fechar} titulo={titulo} rotuloFechar={t("fechar")}>
      <div className="sem-barra min-h-0 flex-auto overflow-y-auto overscroll-contain px-5 pb-[max(20px,env(safe-area-inset-bottom))]">
        {fase === "escolher" && (
          <>
            <p className="mb-2 text-[13px] font-semibold text-ink-2">{t("ligarAgora")}</p>
            <Telefones />
            <p className="mb-2 mt-5 text-[13px] font-semibold text-ink-2">{t("avisarCentral")}</p>
            <div className="flex flex-col gap-1.5">
              {FRASES.map((f) => (
                <button key={f.tipo} onClick={() => escolher(f.tipo, t(f.chave))} className={item}>
                  {t(f.chave)}
                </button>
              ))}
              {!escrevendo ? (
                <button onClick={() => setEscrevendo(true)} className={item}>
                  {t("fOutro")}
                </button>
              ) : (
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (livre.trim()) void triarComAgente(livre.trim());
                  }}
                >
                  <label htmlFor="sos-livre" className="sr-only">
                    {t("descreva")}
                  </label>
                  <input
                    id="sos-livre"
                    autoFocus
                    value={livre}
                    onChange={(e) => setLivre(e.target.value)}
                    placeholder={t("descreva")}
                    className="h-[54px] min-w-0 flex-1 rounded-full bg-surface px-5 text-[16px] outline-none placeholder:text-ink-2 focus-visible:outline-2 focus-visible:outline-blue"
                  />
                  <button type="submit" className="toque h-[54px] rounded-full bg-ink px-5 text-[15px] font-bold text-white">
                    {t("enviar")}
                  </button>
                </form>
              )}
            </div>
          </>
        )}

        {fase === "analisando" && (
          <div aria-live="polite" className="flex flex-col gap-4">
            <EtapasAgente etapas={etapas} pronto={false} />
            {orientacao && <p className="aparece rounded-[18px] bg-surface px-4 py-3 text-[16px] font-semibold leading-snug">{orientacao}</p>}
            <div>
              <p className="mb-2 text-[13px] font-semibold text-ink-2">{t("ligarAgora")}</p>
              <Telefones />
            </div>
          </div>
        )}

        {fase === "confirmar" && pedido && (
          <div className="flex flex-col gap-4">
            <p className="text-[15px] leading-snug text-ink-2">
              {pedido.urgencia === "urgente" ? t("confirmeEnvio") : t("confirmeEnvioSimples")}
            </p>
            <div className="rounded-[20px] bg-surface p-4">
              <p className="text-[13px] font-semibold text-ink-2">{t("vamosEnviar")}</p>
              <p className="mt-1 text-[18px] font-bold">“{pedido.texto}”</p>
              {idioma !== "pt" && <p className="mt-0.5 text-[14px] text-ink-2">“{pedido.triagem.mensagemPt}”</p>}
              {origem && <p className="mt-3 text-[14px] text-ink-2">{t("hotelOrigem", { lugar: origem.nome })}</p>}
              <label className="mt-3 flex min-h-11 cursor-pointer items-center justify-between gap-4 text-[15px]">
                {t("enviarLocalizacao")}
                <input type="checkbox" role="switch" checked={enviarLocal} onChange={(e) => setEnviarLocal(e.target.checked)} className="peer sr-only" />
                <span
                  aria-hidden
                  className="relative h-7 w-12 shrink-0 rounded-full bg-[#ced4da] transition-colors peer-checked:bg-ok peer-focus-visible:outline-3 peer-focus-visible:outline-blue after:absolute after:left-0.5 after:top-0.5 after:size-6 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5"
                />
              </label>
            </div>
            <button
              onClick={confirmar}
              disabled={enviando}
              className={`toque h-[56px] rounded-full text-[16px] font-extrabold text-white shadow-2 disabled:opacity-70 ${pedido.urgencia === "urgente" ? "bg-danger" : "bg-ink"}`}
            >
              {enviando ? t("enviando") : t("confirmarEnviar")}
            </button>
            <button onClick={recomecar} disabled={enviando} className="toque h-12 rounded-full text-[15px] font-semibold text-ink-2 hover:bg-surface">
              {t("voltar")}
            </button>
            {pedido.urgencia === "urgente" && (
              <a href="tel:190" className="text-center text-[14px] font-semibold text-danger-ink underline underline-offset-4">
                {t("seEmPerigo")}
              </a>
            )}
          </div>
        )}

        {fase === "resolvido" && pedido && (
          <div className="flex flex-col gap-3">
            {pedido.ficha && (
              <>
                <EtapasAgente etapas={etapas} pronto modo={pedido.ficha.modo} />
                <p className="text-[16px] font-semibold leading-snug">{orientacao || pedido.ficha.orientacao}</p>
              </>
            )}
            <ol className="flex flex-col gap-2">
              {(pedido.triagem.resolucao?.passos ?? []).map((p, i) => (
                <li key={i} className="grid grid-cols-[24px_1fr] gap-2 rounded-[16px] bg-surface px-4 py-3 text-[15px]">
                  <b className="font-extrabold">{i + 1}.</b>
                  {tr(p)}
                </li>
              ))}
            </ol>
            <p className="text-[13px] text-ink-2">{t("naoEntrouFila")}</p>
            <button
              onClick={() => {
                setPedido({ ...pedido, urgencia: "nao_urgente" });
                setFase("confirmar");
              }}
              className="toque h-[52px] rounded-full border-2 border-ink text-[16px] font-bold"
            >
              {t("aindaPrecisa")}
            </button>
          </div>
        )}

        {fase === "enviado" && chamado && (
          <div className="flex flex-col gap-4">
            {pedido?.ficha && (
              <div className="flex flex-col gap-2">
                <EtapasAgente etapas={etapas} pronto modo={pedido.ficha.modo} />
                <p className="rounded-[18px] bg-danger-bg px-4 py-3 text-[16px] font-semibold leading-snug text-danger-deep">
                  {orientacao || pedido.ficha.orientacao}
                </p>
              </div>
            )}
            {chamado.urgencia === "urgente" && (
              <span className="self-start rounded-full bg-danger-bg px-3 py-1 text-[13px] font-extrabold text-danger-ink">{t("urgente")}</span>
            )}
            <ol className="flex flex-col gap-4">
              <li className="flex gap-3">
                <span className="mt-1 size-3.5 shrink-0 rounded-full bg-ok" />
                <div>
                  <p className="text-[15px] font-semibold">{t("enviadoAs", { hora: hora(chamado.criadoEm) })}</p>
                  <p className="text-[13px] text-ink-2">
                    “{chamado.mensagemOriginal}”{idioma !== "pt" && ` → “${chamado.mensagemPt}”`}
                  </p>
                </div>
              </li>
              {(chamado.historico ?? [])
                .filter((e) => e.tipo === "encaminhado" && e.servico)
                .map((e, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-1 size-3.5 shrink-0 rounded-full bg-blue" />
                    <p className="text-[15px] font-semibold">
                      {t("encaminhadoPara", { servico: SERVICOS[e.servico!].nome[idioma] })} <span className="font-normal text-ink-2">· {hora(e.em)}</span>
                    </p>
                  </li>
                ))}
              <li className="flex gap-3">
                {chamado.status === "enviado" ? (
                  <span className="mt-1 size-3.5 shrink-0 animate-pulse rounded-full border-2 border-ink-2" />
                ) : (
                  <span className="mt-1 size-3.5 shrink-0 rounded-full bg-ok" />
                )}
                <div aria-live="polite">
                  <p className="text-[15px] font-semibold">
                    {chamado.status === "enviado" && t("aguardando")}
                    {chamado.status === "em_atendimento" &&
                      (servicoDe(chamado) ? t("servicoCuidando", { servico: SERVICOS[servicoDe(chamado)!].nome[idioma] }) : t("emAtendimento"))}
                    {chamado.status === "encerrado" && t("atendimentoEncerrado")}
                  </p>
                  <p className="text-[13px] text-ink-2">
                    {chamado.status === "enviado" && t("atualizaSozinha")}
                    {chamado.status === "em_atendimento" && (servicoDe(chamado) ? t("atualizaSozinha") : t("atendenteCaminho"))}
                    {chamado.status === "encerrado" && t("encerradoTexto")}
                  </p>
                </div>
              </li>
            </ol>
            {(chamado.respostas?.length ?? 0) > 0 && (
              <div aria-live="polite" className="flex flex-col gap-2">
                <p className="text-[13px] font-semibold text-ink-2">{t("mensagensCentral")}</p>
                {chamado.respostas!.map((r, i) => (
                  <p key={i} className="aparece rounded-[18px] rounded-tl-[6px] bg-[#e3f0f5] px-4 py-3 text-[15px] leading-snug text-ink">
                    {r.texto[idioma]}
                    <span className="mt-1 block text-[12px] text-ink-2">{hora(r.em)}</span>
                  </p>
                ))}
              </div>
            )}
            <p className="rounded-[16px] bg-surface px-4 py-3 text-[15px]">
              {comLocal ? t("localEnviado") : t("semLocal")}
              {origem && (
                <>
                  <br />
                  <span className="text-ink-2">{t("hotelOrigem", { lugar: origem.nome })}</span>
                </>
              )}
            </p>
            {chamado.urgencia === "urgente" && (
              <a href="tel:190" className="toque flex h-[52px] items-center justify-center rounded-full border-2 border-danger text-[16px] font-extrabold text-danger-ink">
                {t("ligar190")}
              </a>
            )}
            <button onClick={recomecar} className="toque h-11 self-center px-4 text-[15px] font-semibold text-blue underline underline-offset-4">
              {t("outroAviso")}
            </button>
          </div>
        )}

        {fase === "erro" && (
          <div className="flex flex-col gap-4">
            <p className="rounded-[16px] bg-danger-bg px-4 py-3 text-[15px] font-semibold text-danger-deep">{t("falhaEnvio")}</p>
            <Telefones grandes />
            <button onClick={() => (pedido ? setFase("confirmar") : recomecar())} className="toque h-[52px] rounded-full border-2 border-ink text-[16px] font-bold">
              {t("tentarNovamente")}
            </button>
          </div>
        )}
      </div>
    </Folha>
  );
}
