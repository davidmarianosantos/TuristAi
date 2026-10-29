"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, SendHorizontal } from "lucide-react";
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
import logo from "../../../public/img/logo-turistai.png";

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

/** Desenha um bloco da mensagem. Novos tipos de bloco entram aqui. */
function BlocoChat({ bloco, de, aoTocar }: { bloco: Bloco; de: MensagemChat["de"]; aoTocar(valor: string): void }) {
  const { tr } = useIdioma();
  switch (bloco.tipo) {
    case "texto":
      return (
        <p
          className={`max-w-[85%] whitespace-pre-line px-3.5 py-2 text-[15px] leading-snug shadow-1 ${
            de === "turista"
              ? "self-end rounded-[18px] rounded-br-[6px] bg-[#d6e7ef] text-ink"
              : "self-start rounded-[18px] rounded-bl-[6px] bg-card text-ink"
          }`}
        >
          {bloco.texto}
        </p>
      );
    case "botoes":
      return (
        <div className="flex max-w-[90%] flex-wrap gap-2 self-start">
          {bloco.opcoes.map((o) => (
            <button
              key={o.valor}
              onClick={() => aoTocar(o.valor)}
              className="toque min-h-10 rounded-full border border-field/30 bg-card px-4 text-[14px] font-semibold text-field"
            >
              {o.rotulo}
            </button>
          ))}
        </div>
      );
    case "lugar":
      return (
        <div className="w-[85%] max-w-[320px] self-start">
          <CartaoLugar lugar={bloco.lugar} largo />
        </div>
      );
    case "praia":
      return (
        <div className="w-[85%] max-w-[320px] self-start">
          <ListaPraias praias={[bloco.praia]} />
        </div>
      );
    case "alerta":
      return (
        <div className="flex w-[85%] max-w-[320px] gap-3 self-start rounded-[18px] bg-danger p-3.5 text-white shadow-1">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-white">
            <Bandeira cor={bloco.alerta.condicao?.bandeira ?? "vermelha"} tamanho={24} mastro="var(--ink)" />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-bold leading-tight">{tr(bloco.alerta.titulo)}</p>
            <p className="mt-1 text-[13px] opacity-90">{tr(bloco.alerta.texto)}</p>
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
    const [r] = await Promise.all([
      responder(m, idioma, { repo, idioma, municipioId, origem, estado }),
      new Promise((ok) => setTimeout(ok, 700)), // tempo de "digitando…" para parecer conversa
    ]);
    if (r.estado) setEstado(r.estado);
    setDigitando(false);
    setMsgs((x) => [...x, { id: novoId(), de: "bot", blocos: r.blocos, em: new Date().toISOString() }]);
  };

  const hora = (iso: string) =>
    new Intl.DateTimeFormat(idioma === "pt" ? "pt-BR" : idioma, { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

  return (
    <div
      ref={raiz}
      className="fixed inset-x-0 top-0 mx-auto flex h-dvh max-w-[640px] flex-col overflow-hidden bg-sand lg:top-4 lg:h-[calc(100dvh-32px)] lg:rounded-[28px] lg:shadow-3"
      style={altura ? { height: altura } : undefined}
    >
      <header className="flex items-center gap-3 bg-field px-3 pb-3 pt-[max(12px,env(safe-area-inset-top))] text-white">
        <Link
          href={hrefTurista({ idioma, origem: origemSlug })}
          aria-label={t("voltarTurista")}
          className="toque flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-white/10"
        >
          <ArrowLeft size={22} strokeWidth={2.4} />
        </Link>
        <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
          <span aria-hidden className="block h-9 w-[26px] overflow-hidden">
            <Image src={logo} alt="" priority className="h-9 w-auto max-w-none" />
          </span>
        </span>
        <div className="min-w-0">
          <p className="truncate text-[17px] font-bold leading-tight">{nomeAssistente(idioma)}</p>
          <p className="text-[13px] text-field-ink" aria-live="polite">
            {digitando ? t("digitando") : t("online")}
          </p>
        </div>
      </header>

      <div ref={lista} className="sem-barra min-h-0 flex-auto overflow-y-auto overscroll-contain px-3 py-4 [-webkit-overflow-scrolling:touch]">
        <div className="flex flex-col gap-2">
          {msgs.map((m) => (
            <div key={m.id} className={`aparece flex flex-col gap-1.5 ${m.de === "turista" ? "items-end" : "items-start"}`}>
              {m.blocos.map((b, i) => (
                <BlocoChat key={i} bloco={b} de={m.de} aoTocar={enviar} />
              ))}
              <span className="px-1 text-[11px] text-ink-2">{hora(m.em)}</span>
            </div>
          ))}
          {digitando && (
            <p className="flex w-16 gap-1.5 self-start rounded-[18px] rounded-bl-[6px] bg-card px-4 py-3.5 shadow-1" aria-hidden>
              {[0, 1, 2].map((i) => (
                <span key={i} className="size-2 animate-pulse rounded-full bg-ink-2" style={{ animationDelay: `${i * 160}ms` }} />
              ))}
            </p>
          )}
          <div ref={fim} />
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void enviar(texto);
        }}
        className="flex items-center gap-2 bg-sand px-3 pt-2 pb-[max(10px,env(safe-area-inset-bottom))]"
      >
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
          className="h-12 min-w-0 flex-1 rounded-full bg-card px-5 text-[16px] text-ink shadow-1 outline-none placeholder:text-ink-2 focus-visible:outline-2 focus-visible:outline-blue"
        />
        <button
          type="submit"
          aria-label={t("enviarMensagem")}
          disabled={!texto.trim() || digitando}
          className="toque flex size-12 shrink-0 items-center justify-center rounded-full bg-field text-white disabled:opacity-50"
        >
          <SendHorizontal size={20} strokeWidth={2.4} />
        </button>
      </form>
    </div>
  );
}
