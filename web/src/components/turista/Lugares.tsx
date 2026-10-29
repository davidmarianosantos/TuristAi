"use client";

import { ArrowRight, BedDouble, Car, Compass, Map, MapPin, Music, ShieldCheck, ShoppingBag, Star, UserRound, Utensils, type LucideIcon } from "lucide-react";
import type { Categoria, Estabelecimento, Traduzido } from "@/data/tipos";
import { useIdioma } from "@/lib/idioma";
import { distanciaKm, formatarDistancia } from "@/lib/mapa";
import { Titulo } from "./Praias";

export const CATEGORIA: Record<Categoria, Traduzido> = {
  hotel: { pt: "Hotel", es: "Hotel", en: "Hotel" },
  pousada: { pt: "Pousada", es: "Posada", en: "Inn" },
  receptivo: { pt: "Passeios", es: "Paseos", en: "Tours" },
  condutor: { pt: "Guia", es: "Guía", en: "Guide" },
  restaurante: { pt: "Restaurante", es: "Restaurante", en: "Restaurant" },
  barraca: { pt: "Barraca de praia", es: "Chiringuito", en: "Beach stall" },
  comercio: { pt: "Loja", es: "Tienda", en: "Shop" },
  vida_noturna: { pt: "Vida noturna", es: "Vida nocturna", en: "Nightlife" },
  transporte: { pt: "Transporte", es: "Transporte", en: "Transport" },
};

// Cor e ícone por categoria, da paleta identitária praiana (cacau, dourado, mata, mar).
const VISUAL: Record<Categoria, { icone: LucideIcon; fundo: string; tinta: string }> = {
  restaurante: { icone: Utensils, fundo: "#7b3f00", tinta: "#e5a93c" },
  barraca: { icone: Utensils, fundo: "#a8651a", tinta: "#f8ead0" },
  transporte: { icone: Car, fundo: "#007791", tinta: "#bfe7ef" },
  receptivo: { icone: Compass, fundo: "#1b4332", tinta: "#9fd3b4" },
  condutor: { icone: UserRound, fundo: "#1b4332", tinta: "#9fd3b4" },
  comercio: { icone: ShoppingBag, fundo: "#8b4513", tinta: "#f8ead0" },
  pousada: { icone: BedDouble, fundo: "#0b4f6c", tinta: "#bfe7ef" },
  hotel: { icone: BedDouble, fundo: "#0b4f6c", tinta: "#bfe7ef" },
  vida_noturna: { icone: Music, fundo: "#1b4332", tinta: "#e5a93c" },
};

export function Selo({ tamanho = 28 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 30 30" aria-hidden>
      <path
        d="M15 1.5l3.2 2.4 4-.3 1.3 3.8 3.4 2.1-1.1 3.9 1.1 3.9-3.4 2.1-1.3 3.8-4-.3L15 25.3l-3.2-2.4-4 .3-1.3-3.8-3.4-2.1 1.1-3.9-1.1-3.9 3.4-2.1 1.3-3.8 4 .3z"
        fill="var(--accent)"
      />
      <path d="M10 13.6l3.4 3.4 6.6-6.8" stroke="var(--ink)" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CartaoLugar({
  lugar,
  de,
  largo = false,
}: {
  lugar: Estabelecimento;
  de?: { lat: number; lng: number };
  largo?: boolean;
}) {
  const { t, tr, idioma } = useIdioma();
  const dist = de ? formatarDistancia(distanciaKm(de, lugar), idioma) : null;
  const v = VISUAL[lugar.categoria];
  const Icone = v.icone;
  return (
    <article
      className={`flex flex-col overflow-hidden rounded-[24px] bg-card ${largo ? "w-full" : "w-[264px] shrink-0 snap-start lg:w-auto"}`}
    >
      <div className="relative flex h-[112px] items-end justify-between overflow-hidden p-3.5" style={{ background: v.fundo }}>
        <Icone aria-hidden size={92} strokeWidth={1.4} className="absolute -right-3 -top-3 opacity-25" style={{ color: v.tinta }} />
        {lugar.temSelo ? <Selo /> : <span />}
        {dist && (
          <span className="flex items-center gap-1 rounded-full bg-black/20 px-2.5 py-1 text-[12px] font-semibold text-white backdrop-blur-sm">
            <MapPin size={12} strokeWidth={2.6} />
            {dist}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[17px] font-bold leading-tight tracking-[-0.015em]">{lugar.nome}</h3>
        <p className="mb-3 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-2">
          {tr(CATEGORIA[lugar.categoria])}
          {lugar.cadastur && (
            <span className="inline-flex items-center gap-1 font-semibold text-mata">
              <ShieldCheck size={13} strokeWidth={2.4} />
              {t("cadasturOk")}
            </span>
          )}
        </p>
        {/* sem preços: dependem do cadastro de cada estabelecimento; mostramos avaliação e onde fica */}
        <div className="mt-auto flex flex-col gap-1.5">
          <p className="flex items-center gap-2 rounded-full bg-sand px-3.5 py-2 text-[14px]">
            <Star size={16} strokeWidth={2.2} className="shrink-0 fill-accent text-accent" />
            <b className="font-extrabold tabular-nums">{lugar.avaliacao.nota.toLocaleString(idioma === "pt" ? "pt-BR" : idioma, { minimumFractionDigits: 1 })}</b>
            <span className="truncate text-ink-2">({t("avaliacoes", { n: lugar.avaliacao.total })})</span>
          </p>
          <p className="flex items-center gap-2 rounded-full bg-sand px-3.5 py-2 text-[14px]">
            <MapPin size={16} strokeWidth={2.2} className="shrink-0 text-cacau" />
            <span className="truncate">{lugar.local}</span>
          </p>
        </div>
      </div>
    </article>
  );
}

export function Lugares({
  lugares,
  de,
  aoAbrirMapa,
}: {
  lugares: Estabelecimento[];
  de?: { lat: number; lng: number };
  aoAbrirMapa(): void;
}) {
  const { t } = useIdioma();
  return (
    <section aria-labelledby="t-lugares" className="mt-10 rounded-[32px] bg-sand py-8 lg:px-8">
      <Titulo
        id="t-lugares"
        descoberta
        extra={
          <button
            onClick={aoAbrirMapa}
            className="toque flex h-9 items-center gap-1.5 rounded-full bg-card px-3.5 text-[13px] font-semibold text-cacau shadow-1 lg:hidden"
          >
            <Map size={15} strokeWidth={2.4} />
            {t("mapa")}
          </button>
        }
      >
        {t("lugaresSelo")}
      </Titulo>
      {lugares.length === 0 ? (
        <p className="mx-5 rounded-[20px] bg-card p-4 text-[15px] text-ink-2 lg:mx-0">{t("semLugares")}</p>
      ) : (
        <div className="sem-barra flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 pb-3 lg:grid lg:grid-cols-2 lg:overflow-visible lg:px-0">
          {lugares.map((l) => (
            <CartaoLugar key={l.id} lugar={l} de={de} />
          ))}
        </div>
      )}
      <div className="px-5 lg:hidden">
        <button
          onClick={aoAbrirMapa}
          className="toque mt-2 flex h-[54px] w-full items-center justify-center gap-2 rounded-full bg-cacau px-6 text-[15px] font-semibold text-white shadow-2"
        >
          <Map size={18} strokeWidth={2.2} />
          {t("verMapa")}
        </button>
      </div>
    </section>
  );
}

export function Seta() {
  return <ArrowRight size={18} strokeWidth={2.4} aria-hidden />;
}
