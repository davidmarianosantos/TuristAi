"use client";

import Image from "next/image";
import { Check, ChevronDown, Globe, MapPin, Sun, Waves } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TEMPO_DEMO } from "@/data/seed";
import type { Idioma, Municipio, PraiaHoje } from "@/data/tipos";
import type { Chave } from "@/i18n/textos";
import { useIdioma } from "@/lib/idioma";
import { Bandeira } from "@/components/ui/Bandeira";
import fotoPadrao from "../../../public/img/itacarezinho.jpg";
import logo from "../../../public/img/logo-turistai.png";
import mascote from "../../../public/img/mascote.png";

export const NOMES_IDIOMA: Record<Idioma, string> = { pt: "Português", es: "Español", en: "English" };

function SeletorIdioma({ vidro = false }: { vidro?: boolean }) {
  const { idioma, setIdioma, t } = useIdioma();
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setAberto(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("pointerdown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAberto((x) => !x)}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-label={`${t("idioma")}: ${NOMES_IDIOMA[idioma]}`}
        className={`toque flex h-10 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-bold uppercase tracking-wide ${
          vidro
            ? "border border-white/30 bg-white/15 text-white backdrop-blur-md hover:bg-white/25"
            : "bg-accent text-ink"
        }`}
      >
        <Globe size={15} strokeWidth={2.4} />
        {idioma}
        <ChevronDown size={14} strokeWidth={2.6} className={`transition-transform duration-200 ${aberto ? "rotate-180" : ""}`} />
      </button>
      {aberto && (
        <ul
          role="listbox"
          aria-label={t("idioma")}
          className="aparece absolute right-0 top-[calc(100%+8px)] z-40 w-48 origin-top-right overflow-hidden rounded-[18px] bg-card p-1.5 text-ink shadow-3"
        >
          {(Object.keys(NOMES_IDIOMA) as Idioma[]).map((i) => (
            <li key={i}>
              <button
                role="option"
                aria-selected={i === idioma}
                lang={i}
                onClick={() => {
                  setIdioma(i);
                  setAberto(false);
                }}
                className="flex h-11 w-full items-center justify-between rounded-[12px] px-3 text-left text-[15px] font-semibold hover:bg-surface"
              >
                {NOMES_IDIOMA[i]}
                {i === idioma && <Check size={18} strokeWidth={2.6} className="text-blue" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type Cidades = {
  municipioId: string;
  municipios: Municipio[];
  /** só estas têm conteúdo; as outras aparecem, mas "em breve" */
  disponiveis: string[];
  aoTrocarCidade(id: string): void;
};

/** Troca de cidade da Costa do Cacau. As cidades ainda sem dados ficam visíveis e desativadas. */
function SeletorCidade({ municipioId, municipios, disponiveis, aoTrocarCidade, vidro = false }: Cidades & { vidro?: boolean }) {
  const { t } = useIdioma();
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const atual = municipios.find((m) => m.id === municipioId);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setAberto(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("pointerdown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  // disponíveis primeiro, na ordem alfabética; depois as que ainda vão chegar
  const ordem = [...municipios].sort((a, b) => Number(disponiveis.includes(b.id)) - Number(disponiveis.includes(a.id)) || a.nome.localeCompare(b.nome));

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAberto((x) => !x)}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-label={`${t("turistaTrocarCidade")}: ${atual?.nome ?? ""}`}
        className={`toque flex h-10 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-bold ${
          vidro ? "border border-white/30 bg-white/15 text-white backdrop-blur-md hover:bg-white/25" : "text-ink hover:bg-surface"
        }`}
      >
        <MapPin size={15} strokeWidth={2.4} className={vidro ? "" : "text-cacau"} />
        {atual?.nome}
        <ChevronDown size={14} strokeWidth={2.6} className={`transition-transform duration-200 ${aberto ? "rotate-180" : ""}`} />
      </button>
      {aberto && (
        <ul
          role="listbox"
          aria-label={t("turistaTrocarCidade")}
          className={`aparece absolute top-[calc(100%+8px)] z-40 w-60 overflow-hidden rounded-[18px] bg-card p-1.5 text-ink shadow-3 ${vidro ? "right-0 origin-top-right" : "left-0 origin-top-left"}`}
        >
          {ordem.map((m) => {
            const tem = disponiveis.includes(m.id);
            return (
              <li key={m.id}>
                <button
                  role="option"
                  aria-selected={m.id === municipioId}
                  aria-disabled={!tem}
                  disabled={!tem}
                  onClick={() => {
                    setAberto(false);
                    aoTrocarCidade(m.id);
                  }}
                  className="flex h-11 w-full items-center justify-between gap-2 rounded-[12px] px-3 text-left text-[15px] font-semibold enabled:hover:bg-surface disabled:cursor-default disabled:text-ink-2/70"
                >
                  {m.nome}
                  {m.id === municipioId ? (
                    <Check size={18} strokeWidth={2.6} className="text-blue" />
                  ) : (
                    !tem && <span className="rounded-full bg-surface px-2 py-0.5 text-[11.5px] font-semibold text-ink-2">{t("turistaEmBreve")}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-9 items-center gap-1.5 rounded-full border border-white/20 bg-white/12 px-3 text-[13px] font-semibold text-white backdrop-blur-md">
      {children}
    </span>
  );
}

// seções que a barra compacta lista no desktop (o id é o do título de cada uma)
const SECOES: [string, Chave][] = [
  ["t-praias", "praiasHoje"],
  ["t-fazer", "turistaOQueFazer"],
  ["t-lugares", "turistaRecomendados"],
  ["t-mapa", "mapa"],
];

/** desce até o título da seção, que para logo abaixo da barra fixa */
function irPara(id: string) {
  const alvo = document.getElementById(id);
  if (!alvo) return;
  const suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: alvo.getBoundingClientRect().top + window.scrollY - 96, behavior: suave ? "smooth" : "auto" });
}

/**
 * Barra que aparece ao rolar a página. No desktop, navega pelas seções e marca onde você está;
 * em qualquer tela, avisa quando há alerta ativo e leva até ele.
 */
function BarraCompacta({
  visivel,
  cidade,
  alertas,
  aoVerAlertas,
  acoes,
  cidades,
}: {
  visivel: boolean;
  cidade: string;
  alertas: number;
  aoVerAlertas?(): void;
  acoes?: React.ReactNode;
  cidades?: Cidades;
}) {
  const { t } = useIdioma();
  const [presentes, setPresentes] = useState<string[]>([]);
  const [ativa, setAtiva] = useState<string | null>(null);

  useEffect(() => {
    const secoes = SECOES.map(([id]) => document.getElementById(id)?.closest("section")).filter((s): s is HTMLElement => !!s);
    setPresentes(secoes.map((s) => s.getAttribute("aria-labelledby") ?? ""));
    // a seção "ativa" é a que cruza a faixa logo abaixo da barra
    const io = new IntersectionObserver(
      (entradas) => entradas.forEach((e) => e.isIntersecting && setAtiva(e.target.getAttribute("aria-labelledby"))),
      { rootMargin: "-90px 0px -60% 0px" },
    );
    secoes.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  const resumo = alertas > 0 ? (
    <button
      onClick={aoVerAlertas}
      className="toque flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-danger px-3 text-[13px] font-bold text-white shadow-1"
    >
      <Bandeira cor="vermelha" tamanho={14} mastro="#fff" />
      {alertas === 1 ? t("turistaUmAlerta") : t("turistaVariosAlertas", { n: alertas })}
    </button>
  ) : null;

  return (
    <div
      aria-hidden={!visivel}
      inert={!visivel}
      className={`fixed inset-x-0 top-0 z-30 border-b border-line/70 bg-card/85 pt-[env(safe-area-inset-top)] shadow-[0_6px_24px_rgba(64,44,22,0.08)] backdrop-blur-xl transition-transform duration-300 ease-[var(--ease-out)] ${
        visivel ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[720px] items-center gap-3 px-4 lg:max-w-[1280px] lg:px-8">
        <div className="-ml-1 flex shrink-0 items-center">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label={t("hojeEm", { cidade })}
            className="toque flex shrink-0 items-center rounded-full p-1 hover:bg-surface"
          >
            {/* só o mascote: recorte do lado esquerdo da logo */}
            <Image src={mascote} alt="" aria-hidden priority className="h-10 w-auto shrink-0" />
          </button>
          {cidades ? <SeletorCidade {...cidades} /> : <span className="px-2 text-[16px] font-bold tracking-[-0.02em]">{cidade}</span>}
        </div>

        <nav aria-label={t("hojeEm", { cidade })} className="mx-auto hidden h-full items-stretch lg:flex">
          {SECOES.filter(([id]) => presentes.includes(id)).map(([id, chave]) => (
            <button
              key={id}
              onClick={() => irPara(id)}
              aria-current={ativa === id ? "location" : undefined}
              className={`relative px-3.5 text-[14px] font-semibold transition-colors after:absolute after:inset-x-3.5 after:bottom-0 after:h-[3px] after:rounded-t-full after:transition-colors ${
                ativa === id ? "text-ink after:bg-accent" : "text-ink-2 after:bg-transparent hover:text-ink"
              }`}
            >
              {t(chave)}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          {resumo}
          {acoes && <div className="hidden items-center gap-2 lg:flex">{acoes}</div>}
          <SeletorIdioma />
        </div>
      </div>
    </div>
  );
}

export function Cabecalho({
  cidade,
  origem,
  praias,
  comFoto,
  acoes,
  busca,
  alertas = 0,
  aoVerAlertas,
  foto,
  municipioId,
  municipios,
  disponiveis,
  aoTrocarCidade,
}: Partial<Cidades> & {
  cidade: string;
  origem?: string | null;
  praias: PraiaHoje[];
  comFoto: boolean;
  /** foto do topo da cidade, caminho em /public; sem ela, a de Itacarezinho */
  foto?: string;
  /** quantos alertas ativos: a barra que aparece ao rolar avisa e leva até eles */
  alertas?: number;
  aoVerAlertas?(): void;
  /** só no desktop: WhatsApp e SOS na barra do topo, como num site (no celular eles flutuam no rodapé) */
  acoes?: React.ReactNode;
  /** só no desktop: a barra de pergunta ao assistente dentro da foto */
  busca?: React.ReactNode;
}) {
  const { t, idioma } = useIdioma();
  const hero = useRef<HTMLElement>(null);
  const [compacto, setCompacto] = useState(false);

  useEffect(() => {
    const el = hero.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setCompacto(!e.isIntersecting), { rootMargin: "-72px 0px 0px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const data = new Intl.DateTimeFormat(idioma === "pt" ? "pt-BR" : idioma, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const aptas = praias.filter((p) => p.condicao.situacao === "propria").length;
  const cidades: Cidades | undefined =
    municipioId && municipios && disponiveis && aoTrocarCidade ? { municipioId, municipios, disponiveis, aoTrocarCidade } : undefined;

  return (
    <>
      <BarraCompacta visivel={compacto} cidade={cidade} alertas={alertas} aoVerAlertas={aoVerAlertas} acoes={acoes} cidades={cidades} />

      <header
        ref={hero}
        className="relative isolate flex min-h-[440px] flex-col overflow-hidden rounded-b-[32px] bg-field text-white has-[[role=listbox]]:z-20 lg:m-4 lg:mb-0 lg:min-h-[600px] lg:rounded-[32px]"
      >
        {comFoto ? (
          <Image
            key={foto ?? "padrao"}
            src={foto ?? fotoPadrao}
            alt=""
            fill
            priority
            sizes="100vw"
            className="-z-10 object-cover object-[center_60%] motion-safe:animate-[zoom-lento_2.4s_var(--ease-out)_both]"
          />
        ) : null}
        {/* no desktop o texto fica à esquerda: um véu lateral garante leitura sobre a areia clara da foto */}
        {comFoto && (
          <div
            aria-hidden
            className="absolute inset-0 -z-10 hidden lg:block"
            style={{ background: "linear-gradient(90deg, rgba(6,32,44,0.62) 0%, rgba(6,32,44,0.28) 42%, rgba(6,32,44,0) 62%)" }}
          />
        )}
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background: comFoto
              ? "linear-gradient(180deg, rgba(8,40,54,0.55) 0%, rgba(8,40,54,0.05) 32%, rgba(8,40,54,0.28) 55%, rgba(6,32,44,0.94) 100%)"
              : "radial-gradient(120% 90% at 85% 0%, #007791 0%, #0b4f6c 50%, #083a50 100%)",
          }}
        />

        <div className="flex items-center justify-between px-5 pt-[max(18px,env(safe-area-inset-top))] lg:mx-auto lg:w-full lg:max-w-[1280px] lg:px-8 lg:pt-6">
          <Image
            src={logo}
            alt="TuristAí"
            priority
            className="h-[52px] w-auto drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)] sm:h-[64px] lg:h-[80px]"
          />
          <div className="flex items-center gap-2">
            {acoes && <div className="hidden items-center gap-2 lg:flex">{acoes}</div>}
            {cidades && <SeletorCidade {...cidades} vidro />}
            <SeletorIdioma vidro />
          </div>
        </div>

        {/* no desktop, a direita fica livre para o alerta do dia, que a TelaTurista posiciona por cima da foto */}
        <div className="cascata mt-auto px-5 pb-12 lg:mx-auto lg:w-full lg:max-w-[1280px] lg:px-8 lg:pb-14 lg:pt-10 lg:pr-[500px] xl:pr-[540px]">
          <h1 className="font-display text-[40px] font-normal leading-[1.05] lg:text-[52px] xl:text-[64px]">{t("hojeEm", { cidade })}</h1>
          <p className="mt-2 text-[15px] font-medium text-field-ink first-letter:uppercase lg:text-[16px]">{data}</p>
          {origem && <p className="mt-0.5 text-[14px] text-field-ink/85 lg:text-[15px]">{t("hotelOrigem", { lugar: origem })}</p>}
          <div className="mt-5 flex flex-wrap gap-2">
            <Chip>
              <Sun size={16} strokeWidth={2.4} className="text-accent" />
              {TEMPO_DEMO.temperatura}° · {t("ensolarado")}
            </Chip>
            <Chip>
              <Waves size={16} strokeWidth={2.4} className="text-[#8fd8e6]" />
              {t("mareAlta")} {TEMPO_DEMO.mareAlta}
            </Chip>
            {praias.length > 0 && (
              <Chip>
                <Bandeira cor="verde" tamanho={15} mastro="#fff" />
                {t("praiasAptas", { n: aptas, total: praias.length })}
              </Chip>
            )}
          </div>
          {busca && <div className="mt-8 hidden max-w-[600px] lg:block">{busca}</div>}
        </div>
      </header>
    </>
  );
}
