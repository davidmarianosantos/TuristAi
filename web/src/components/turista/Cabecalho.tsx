"use client";

import Image from "next/image";
import { Check, ChevronDown, Globe, Sun, Waves } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TEMPO_DEMO } from "@/data/seed";
import type { Idioma, PraiaHoje } from "@/data/tipos";
import { useIdioma } from "@/lib/idioma";
import { Bandeira } from "@/components/ui/Bandeira";
import foto from "../../../public/img/itacarezinho.jpg";
import logo from "../../../public/img/logo-turistai.png";

const NOMES: Record<Idioma, string> = { pt: "Português", es: "Español", en: "English" };

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
        aria-label={`${t("idioma")}: ${NOMES[idioma]}`}
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
          {(Object.keys(NOMES) as Idioma[]).map((i) => (
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
                {NOMES[i]}
                {i === idioma && <Check size={18} strokeWidth={2.6} className="text-blue" />}
              </button>
            </li>
          ))}
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

export function Cabecalho({
  cidade,
  origem,
  praias,
  comFoto,
}: {
  cidade: string;
  origem?: string | null;
  praias: PraiaHoje[];
  comFoto: boolean;
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

  return (
    <>
      {/* barra compacta que aparece ao rolar */}
      <div
        aria-hidden={!compacto}
        className={`fixed inset-x-0 top-0 z-30 border-b border-line/70 bg-card/80 backdrop-blur-xl transition-transform duration-300 ease-[var(--ease-out)] lg:right-[min(40vw,560px)] ${
          compacto ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="mx-auto flex h-[60px] max-w-[720px] items-center justify-between px-5 pt-[env(safe-area-inset-top)] lg:px-10">
          <span className="flex items-center gap-2.5 text-[16px] font-bold tracking-[-0.02em]">
            {/* só o mascote: recorte do lado esquerdo da logo */}
            <span aria-hidden className="block h-10 w-[26px] overflow-hidden">
              <Image src={logo} alt="" priority className="h-10 w-auto max-w-none" />
            </span>
            {cidade}
          </span>
          <SeletorIdioma />
        </div>
      </div>

      <header
        ref={hero}
        className="relative isolate flex min-h-[440px] flex-col overflow-hidden rounded-b-[32px] bg-field text-white lg:m-4 lg:mb-0 lg:min-h-[480px] lg:rounded-[32px]"
      >
        {comFoto ? (
          <Image
            src={foto}
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="-z-10 object-cover object-[center_60%] motion-safe:animate-[zoom-lento_2.4s_var(--ease-out)_both]"
          />
        ) : null}
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background: comFoto
              ? "linear-gradient(180deg, rgba(8,40,54,0.55) 0%, rgba(8,40,54,0.05) 32%, rgba(8,40,54,0.28) 55%, rgba(6,32,44,0.94) 100%)"
              : "radial-gradient(120% 90% at 85% 0%, #007791 0%, #0b4f6c 50%, #083a50 100%)",
          }}
        />

        <div className="flex items-center justify-between px-5 pt-[max(18px,env(safe-area-inset-top))] lg:px-8 lg:pt-6">
          <Image
            src={logo}
            alt="TuristAí"
            priority
            className="h-[64px] w-auto drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)] lg:h-[80px]"
          />
          <SeletorIdioma vidro />
        </div>

        <div className="cascata mt-auto px-5 pb-12 lg:px-8 lg:pb-10">
          {origem && (
            <p className="mb-3 inline-flex rounded-full bg-white/12 px-3 py-1.5 text-[13px] font-medium text-field-ink backdrop-blur-md">
              {t("boasVindas", { lugar: origem })}
            </p>
          )}
          <h1 className="font-display text-[40px] font-normal leading-[1.05] lg:text-[60px]">{t("hojeEm", { cidade })}</h1>
          <p className="mt-2 text-[15px] font-medium text-field-ink first-letter:uppercase">{data}</p>
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
        </div>
      </header>
    </>
  );
}
