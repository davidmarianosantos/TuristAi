"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, CheckCheck, EllipsisVertical, Mic, Paperclip, Phone, SendHorizontal, Smile, Video } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MUNICIPIO_PADRAO } from "@/data/seed";
import type { Estabelecimento } from "@/data/tipos";
import { boasVindas, nomeAssistente, responder } from "@/lib/chatbot/motor";
import type { Bloco, EstadoConversa, MensagemChat } from "@/lib/chatbot/tipos";
import { useIdioma } from "@/lib/idioma";
import { hrefTurista } from "@/lib/rotas";
import { Bandeira } from "@/components/ui/Bandeira";
import { CartaoLugar } from "@/components/turista/Lugares";
import { ListaPraias } from "@/components/turista/Praias";
import { useRepositorio } from "@/components/turista/RepositorioContext";
import mascote from "../../../public/img/mascote.png";

const novoId = () => Math.random().toString(36).slice(2, 10);

/**
 * Isola o chat como um app: a página inteira fica travada (classe .pagina-chat no <html>),
 * a conversa ocupa a altura visível e só a lista de mensagens rola.
 * Quando o teclado abre, o iOS encolhe a área visível e tenta empurrar a página; em vez de
 * seguir esse empurrão (o que fazia a tela tremer), a página volta ao topo e só a altura muda.
 */
function useTelaIsolada(lista: React.RefObject<HTMLElement | null>, raiz: React.RefObject<HTMLElement | null>) {
  const [altura, setAltura] = useState<number | null>(null);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("pagina-chat");
    const vv = window.visualViewport;
    const medir = () => {
      const h = window.innerWidth < 1024 && vv ? Math.round(vv.height) : null;
      setAltura(h);
      // a página também encolhe até a área visível: abaixo do teclado não sobra nada para arrastar
      if (h) html.style.setProperty("--altura-visivel", `${h}px`);
      else html.style.removeProperty("--altura-visivel");
    };
    const segurar = () => {
      if (window.scrollY !== 0 || (vv && vv.offsetTop !== 0)) window.scrollTo(0, 0);
    };
    medir();
    vv?.addEventListener("resize", medir);
    vv?.addEventListener("scroll", segurar);
    window.addEventListener("resize", medir);

    // arrastar fora da lista de mensagens (cabeçalho, campo) não pode puxar a página;
    // dentro da lista, também não quando ela já está no topo ou no fim (senão o iOS arrasta tudo)
    let inicioY = 0;
    const marcarInicio = (e: TouchEvent) => {
      inicioY = e.touches[0]?.clientY ?? 0;
    };
    const travarArraste = (e: TouchEvent) => {
      const l = lista.current;
      if (!l || !l.contains(e.target as Node)) return e.preventDefault();
      const dy = (e.touches[0]?.clientY ?? 0) - inicioY;
      const noTopo = l.scrollTop <= 0 && dy > 0;
      const noFim = l.scrollTop + l.clientHeight >= l.scrollHeight - 1 && dy < 0;
      if (noTopo || noFim) e.preventDefault();
    };
    document.addEventListener("touchstart", marcarInicio, { passive: true });
    document.addEventListener("touchmove", travarArraste, { passive: false });

    return () => {
      html.classList.remove("pagina-chat");
      html.style.removeProperty("--altura-visivel");
      vv?.removeEventListener("resize", medir);
      vv?.removeEventListener("scroll", segurar);
      window.removeEventListener("resize", medir);
      document.removeEventListener("touchstart", marcarInicio);
      document.removeEventListener("touchmove", travarArraste);
    };
  }, [lista, raiz]);

  return altura;
}

// Visual de app de mensagens: cores próprias do canal (verde-petróleo, papel de parede claro),
// sem logo nem nome de marca de terceiros.
const ZAP = {
  barra: "#008069",
  fundo: "#efeae2",
  enviada: "#d9fdd3",
  recebida: "#ffffff",
  hora: "#667781",
  visto: "#53bdeb",
  campo: "#f0f2f5",
};

// papel de parede com motivos da Costa do Cacau (concha, onda, bandeira, cacau) em traço bem leve
const PAPEL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180' fill='none' stroke='%23000' stroke-opacity='.055' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 40c6-6 12-6 18 0s12 6 18 0'/%3E%3Cpath d='M118 22v26M118 23h20l-5 6 5 6h-20'/%3E%3Cpath d='M40 120c0-12 10-20 20-20s20 8 20 20c-6 6-34 6-40 0z'/%3E%3Cpath d='M50 108l10 12 10-12'/%3E%3Cellipse cx='140' cy='120' rx='10' ry='18'/%3E%3Cpath d='M140 102v36M134 108c3 4 3 20 0 24M146 108c-3 4-3 20 0 24'/%3E%3Cpath d='M96 160c6-6 12-6 18 0s12 6 18 0'/%3E%3Ccircle cx='96' cy='74' r='5'/%3E%3C/svg%3E\")";

/** Rabicho do balão (só no primeiro balão de cada mensagem, como no app). */
function Rabicho({ lado, cor }: { lado: "esq" | "dir"; cor: string }) {
  return (
    <svg
      aria-hidden
      width="8"
      height="13"
      viewBox="0 0 8 13"
      className={`absolute top-0 ${lado === "dir" ? "-right-2" : "-left-2 -scale-x-100"}`}
    >
      <path d="M0 0h8L1.5 9.5C.7 10.7 0 10 0 8.5z" fill={cor} />
    </svg>
  );
}

function Hora({ hora, visto }: { hora: string; visto?: boolean }) {
  return (
    <span className="float-right ml-2 mt-1.5 flex translate-y-1 items-center gap-0.5 text-[11px] leading-none" style={{ color: ZAP.hora }}>
      {hora}
      {visto && <CheckCheck size={15} strokeWidth={2.2} style={{ color: ZAP.visto }} aria-hidden />}
    </span>
  );
}

/** Desenha um bloco da mensagem. Novos tipos de bloco entram aqui. */
function BlocoChat({
  bloco,
  de,
  primeiro,
  hora,
  aoTocar,
}: {
  bloco: Bloco;
  de: MensagemChat["de"];
  primeiro: boolean;
  hora?: string;
  aoTocar(valor: string): void;
}) {
  const { tr } = useIdioma();
  const minha = de === "turista";
  const cor = minha ? ZAP.enviada : ZAP.recebida;
  const balao = `relative max-w-[80%] rounded-[8px] px-2.5 py-1.5 text-[15px] leading-[1.35] text-[#111b21] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] ${
    minha ? "self-end" : "self-start"
  } ${primeiro ? (minha ? "rounded-tr-none" : "rounded-tl-none") : ""}`;

  switch (bloco.tipo) {
    case "texto":
      return (
        <p className={`${balao} whitespace-pre-line`} style={{ background: cor }}>
          {primeiro && <Rabicho lado={minha ? "dir" : "esq"} cor={cor} />}
          {bloco.texto}
          {hora && <Hora hora={hora} visto={minha} />}
        </p>
      );
    case "botoes":
      // respostas rápidas: botões largos embaixo do balão, como nos apps de mensagem
      return (
        <div className="flex w-[80%] max-w-[340px] flex-col gap-1 self-start">
          {bloco.opcoes.map((o) => (
            <button
              key={o.valor}
              onClick={() => aoTocar(o.valor)}
              className="toque min-h-11 rounded-[8px] bg-white px-4 text-[15px] font-medium shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]"
              style={{ color: ZAP.barra }}
            >
              {o.rotulo}
            </button>
          ))}
        </div>
      );
    case "lugar":
      return (
        <div className={`${balao} w-[80%] max-w-[320px] p-1`} style={{ background: cor }}>
          {primeiro && <Rabicho lado={minha ? "dir" : "esq"} cor={cor} />}
          <CartaoLugar lugar={bloco.lugar} className="w-full" />
        </div>
      );
    case "praia":
      return (
        <div className={`${balao} w-[80%] max-w-[320px] p-1`} style={{ background: cor }}>
          {primeiro && <Rabicho lado={minha ? "dir" : "esq"} cor={cor} />}
          <ListaPraias praias={[bloco.praia]} />
        </div>
      );
    case "praias":
      return (
        <div className={`${balao} w-[80%] max-w-[320px] p-1`} style={{ background: cor }}>
          {primeiro && <Rabicho lado={minha ? "dir" : "esq"} cor={cor} />}
          <ListaPraias praias={bloco.praias} />
        </div>
      );
    case "alerta":
      return (
        <div className={`${balao} w-[80%] max-w-[320px]`} style={{ background: cor }}>
          {primeiro && <Rabicho lado={minha ? "dir" : "esq"} cor={cor} />}
          <div className="flex gap-3 rounded-[6px] bg-danger p-3 text-white">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-white">
              <Bandeira cor={bloco.alerta.condicao?.bandeira ?? "vermelha"} tamanho={22} mastro="var(--ink)" />
            </span>
            <div className="min-w-0">
              <p className="text-[15px] font-bold leading-tight">{tr(bloco.alerta.titulo)}</p>
              <p className="mt-1 text-[13px] opacity-90">{tr(bloco.alerta.texto)}</p>
            </div>
          </div>
        </div>
      );
  }
}

export function TelaChat({ origemSlug }: { origemSlug?: string | null }) {
  const repo = useRepositorio();
  const { t, idioma } = useIdioma();
  const raiz = useRef<HTMLDivElement>(null);
  const lista = useRef<HTMLDivElement>(null);
  const altura = useTelaIsolada(lista, raiz);

  const [origem, setOrigem] = useState<Estabelecimento | null>(null);
  const [municipioId, setMunicipioId] = useState(MUNICIPIO_PADRAO);
  const [msgs, setMsgs] = useState<MensagemChat[]>([]);
  const [estado, setEstado] = useState<EstadoConversa>({});
  const [texto, setTexto] = useState("");
  const [digitando, setDigitando] = useState(false);
  const [etapa, setEtapa] = useState<string | null>(null);
  const fim = useRef<HTMLDivElement>(null);

  // contexto da tela anterior: hotel de origem do QR → município; depois, a boas-vindas
  useEffect(() => {
    let vivo = true;
    (async () => {
      const o = origemSlug ? await repo.estabelecimentoPorSlug(origemSlug) : null;
      if (!vivo) return;
      setOrigem(o);
      if (o) setMunicipioId(o.municipioId);
      setMsgs([{ id: novoId(), de: "bot", blocos: boasVindas({ idioma, origem: o }), em: new Date().toISOString() }]);
    })();
    return () => {
      vivo = false;
    };
  }, [repo, origemSlug, idioma]);

  useEffect(() => {
    fim.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, digitando]);

  const enviar = async (mensagem: string) => {
    const m = mensagem.trim();
    if (!m || digitando) return;
    setTexto("");
    setMsgs((x) => [...x, { id: novoId(), de: "turista", blocos: [{ tipo: "texto", texto: m }], em: new Date().toISOString() }]);
    setDigitando(true);
    setEtapa(null);
    const [r] = await Promise.all([
      // as etapas do agente aparecem discretas no lugar do "digitando…", embaixo do nome
      responder(m, idioma, { repo, idioma, municipioId, origem, estado }, msgs, setEtapa),
      new Promise((ok) => setTimeout(ok, 900)), // tempo mínimo de "digitando…" para parecer conversa
    ]);
    if (r.estado) setEstado(r.estado);
    setDigitando(false);
    setEtapa(null);
    setMsgs((x) => [...x, { id: novoId(), de: "bot", blocos: r.blocos, em: new Date().toISOString() }]);
  };

  const hora = (iso: string) =>
    new Intl.DateTimeFormat(idioma === "pt" ? "pt-BR" : idioma, { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

  const temTexto = texto.trim().length > 0;

  return (
    <div
      ref={raiz}
      className="fixed inset-x-0 top-0 mx-auto flex h-dvh max-w-[640px] flex-col overflow-hidden lg:top-4 lg:h-[calc(100dvh-32px)] lg:rounded-[20px] lg:shadow-3"
      style={{ ...(altura ? { height: altura } : {}), backgroundColor: ZAP.fundo, backgroundImage: PAPEL }}
    >
      <header
        className="flex items-center gap-1.5 px-1.5 pb-2 pt-[max(8px,env(safe-area-inset-top))] text-white"
        style={{ background: ZAP.barra }}
      >
        <Link
          href={hrefTurista({ idioma, origem: origemSlug })}
          aria-label={t("voltarTurista")}
          className="toque flex h-11 shrink-0 items-center gap-1 rounded-full pl-1.5 pr-1 hover:bg-white/10"
        >
          <ArrowLeft size={22} strokeWidth={2.2} />
          <span className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-white">
            <Image src={mascote} alt="" aria-hidden priority className="h-8 w-auto" />
          </span>
        </Link>
        <div className="min-w-0 flex-1 pl-1">
          <p className="flex items-center gap-1 text-[17px] font-semibold leading-tight">
            <span className="truncate">{nomeAssistente(idioma)}</span>
            <BadgeCheck size={17} strokeWidth={2.2} className="shrink-0 fill-[#25D366] text-[#008069]" aria-label={t("contaComercial")} />
          </p>
          <p className="truncate text-[13px] text-white/80" aria-live="polite">
            {digitando ? (etapa ?? t("digitando")) : t("online")}
          </p>
        </div>
        {/* ícones decorativos da barra, como no app (sem função na demo) */}
        <span aria-hidden className="flex items-center gap-5 pr-3 text-white/95">
          <Video size={22} strokeWidth={2} />
          <Phone size={20} strokeWidth={2} />
          <EllipsisVertical size={20} strokeWidth={2} />
        </span>
      </header>

      <div ref={lista} className="sem-barra min-h-0 flex-auto overflow-y-auto overscroll-contain px-3 py-3 [-webkit-overflow-scrolling:touch]">
        <div className="flex flex-col">
          <p className="mx-auto mb-3 rounded-[8px] bg-white/90 px-3 py-1 text-[12.5px] font-medium shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]" style={{ color: ZAP.hora }}>
            {t("hoje")}
          </p>
          {/* aviso amarelo do topo da conversa, como no app */}
          <p className="mx-auto mb-2 max-w-[88%] rounded-[8px] bg-[#ffeecd] px-3 py-2 text-center text-[12.5px] leading-snug text-[#54656f] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]">
            {t("avisoCanal")}
          </p>
          {msgs.map((m, i) => {
            // espaço maior quando muda quem fala, menor entre mensagens seguidas da mesma pessoa
            const mesmoAutor = i > 0 && msgs[i - 1].de === m.de;
            const ultimoTexto = m.blocos.map((b) => b.tipo).lastIndexOf("texto");
            return (
              <div key={m.id} className={`aparece flex flex-col gap-1 ${mesmoAutor ? "mt-1" : "mt-3"}`}>
                {m.blocos.map((b, j) => (
                  <BlocoChat
                    key={j}
                    bloco={b}
                    de={m.de}
                    primeiro={j === 0 && !mesmoAutor}
                    hora={j === (ultimoTexto >= 0 ? ultimoTexto : -1) ? hora(m.em) : undefined}
                    aoTocar={enviar}
                  />
                ))}
              </div>
            );
          })}
          {digitando && (
            <p className="relative mt-3 flex w-[60px] gap-1.5 self-start rounded-[8px] rounded-tl-none bg-white px-3.5 py-3 shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]" aria-hidden>
              <Rabicho lado="esq" cor={ZAP.recebida} />
              {[0, 1, 2].map((k) => (
                <span key={k} className="size-2 animate-pulse rounded-full bg-[#8696a0]" style={{ animationDelay: `${k * 160}ms` }} />
              ))}
            </p>
          )}
          <div ref={fim} className="h-1" />
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void enviar(texto);
        }}
        className="flex items-end gap-1.5 px-1.5 pt-1.5 pb-[max(8px,env(safe-area-inset-bottom))]"
      >
        <div className="flex min-h-12 min-w-0 flex-1 items-center gap-1 rounded-[24px] bg-white pl-3 pr-2 shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]">
          <Smile aria-hidden size={24} strokeWidth={1.8} className="shrink-0" style={{ color: ZAP.hora }} />
          <label htmlFor="chat-msg" className="sr-only">
            {t("digiteMensagem")}
          </label>
          <input
            id="chat-msg"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={t("digiteMensagem")}
            autoComplete="off"
            enterKeyHint="send"
            className="h-12 min-w-0 flex-1 bg-transparent px-1.5 text-[16px] text-[#111b21] outline-none placeholder:text-[#8696a0]"
          />
          <Paperclip aria-hidden size={22} strokeWidth={1.8} className="shrink-0 -rotate-45" style={{ color: ZAP.hora }} />
        </div>
        <button
          type="submit"
          aria-label={t("enviarMensagem")}
          disabled={!temTexto || digitando}
          className="toque flex size-12 shrink-0 items-center justify-center rounded-full text-white shadow-[0_1px_2px_rgba(11,20,26,0.2)]"
          style={{ background: ZAP.barra }}
        >
          {/* sem texto o botão mostra o microfone, como no app; com texto vira "enviar" */}
          {temTexto ? <SendHorizontal size={21} strokeWidth={2.2} /> : <Mic size={22} strokeWidth={2.2} />}
        </button>
      </form>
    </div>
  );
}
