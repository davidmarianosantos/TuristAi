"use client";

import Image from "next/image";
import {
  ArrowRight, BedDouble, Car, ChevronDown, Compass, Map, MapPin, Music, ShieldCheck, ShoppingBag, Star, UserRound, Utensils,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import type { Categoria, Estabelecimento, Traduzido } from "@/data/tipos";
import type { Chave } from "@/i18n/textos";
import { mostraCadastur } from "@/lib/cadastur";
import { useIdioma } from "@/lib/idioma";
import { distanciaKm, formatarDistancia } from "@/lib/mapa";
import { CLASSE_TRILHO, SetasTrilho, useTrilho } from "./Trilho";

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
  compacto = false,
  className = "w-[264px] shrink-0 snap-start",
  aoAbrir,
}: {
  lugar: Estabelecimento;
  de?: { lat: number; lng: number };
  /** sobre o mapa: topo mais baixo para não cobrir os pinos */
  compacto?: boolean;
  /** largura e encaixe; o padrão serve às fileiras do assistente */
  className?: string;
  /** quando vem, o cartão inteiro vira botão e abre os detalhes do lugar */
  aoAbrir?(): void;
}) {
  const { t, tr, idioma } = useIdioma();
  const dist = de ? formatarDistancia(distanciaKm(de, lugar), idioma) : null;
  const v = VISUAL[lugar.categoria];
  const Icone = v.icone;
  return (
    <article
      className={`relative flex flex-col overflow-hidden rounded-[24px] bg-card ${aoAbrir ? "toque transition-shadow has-[button:hover]:shadow-2" : ""} ${className}`}
    >
      {/* o botão cobre o cartão inteiro: tocar em qualquer ponto abre os detalhes */}
      {aoAbrir && (
        <button
          onClick={aoAbrir}
          aria-label={t("turistaDetalhes", { nome: lugar.nome })}
          className="absolute inset-0 z-10 rounded-[24px] focus-visible:outline-offset-[-3px]"
        />
      )}
      <div
        className={`relative flex items-end justify-between overflow-hidden p-3.5 ${compacto ? "h-[96px]" : "h-[140px]"}`}
        style={{ background: v.fundo }}
      >
        {/* foto ilustrativa do tipo de lugar; sem foto, o ícone da categoria */}
        {lugar.foto ? (
          <>
            <Image src={lugar.foto} alt="" fill sizes="(min-width: 1280px) 300px, (min-width: 1024px) 31vw, 264px" className="object-cover" />
            <span
              aria-hidden
              className="absolute inset-0"
              style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.4) 100%)" }}
            />
          </>
        ) : (
          <Icone aria-hidden size={92} strokeWidth={1.4} className="absolute -right-3 -top-3 opacity-25" style={{ color: v.tinta }} />
        )}
        <span className="relative">{lugar.temSelo && <Selo />}</span>
        {dist && (
          <span className="relative flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-[12px] font-semibold tabular-nums text-white">
            <MapPin size={12} strokeWidth={2.6} />
            {dist}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[17px] font-bold leading-tight tracking-[-0.015em]">{lugar.nome}</h3>
        <p className="mb-3 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-2">
          {tr(CATEGORIA[lugar.categoria])}
          {/* Cadastur só aparece onde a lei exige (hospedagem, agências, guias, transporte turístico) */}
          {mostraCadastur(lugar) && (
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

/** O que o Selo quer dizer: no celular abre com um toque; no desktop fica sempre à vista, ao lado dos cartões. */
function SobreSelo() {
  const { t } = useIdioma();
  const [aberto, setAberto] = useState(false);
  const itens: [LucideIcon, Chave][] = [
    [ShieldCheck, "turistaSeloCadastro"],
    [Star, "turistaSeloAvaliacao"],
  ];
  return (
    <div className="mt-4 rounded-[20px] bg-card/70 p-1.5 lg:mt-6 lg:bg-card lg:p-5">
      <button
        onClick={() => setAberto((x) => !x)}
        aria-expanded={aberto}
        aria-controls="sobre-selo"
        className="toque flex min-h-11 w-full items-center gap-2.5 rounded-[14px] px-2.5 text-left text-[14px] font-bold lg:pointer-events-none lg:min-h-0 lg:px-0 lg:text-[15px]"
      >
        <Selo tamanho={24} />
        {t("turistaSeloPergunta")}
        <ChevronDown size={17} strokeWidth={2.4} aria-hidden className={`ml-auto text-ink-2 transition-transform lg:hidden ${aberto ? "rotate-180" : ""}`} />
      </button>
      <ul id="sobre-selo" className={`${aberto ? "flex" : "hidden"} flex-col gap-2.5 px-2.5 pb-2.5 pt-1.5 lg:flex lg:px-0 lg:pb-0 lg:pt-3`}>
        {itens.map(([Icone, chave]) => (
          <li key={chave} className="flex gap-2.5 text-[14px] leading-snug text-ink">
            <Icone size={17} strokeWidth={2.2} className="mt-px shrink-0 text-cacau" aria-hidden />
            {t(chave)}
          </li>
        ))}
      </ul>
    </div>
  );
}

const FILTROS: { id: string; chave: Chave; categorias: Categoria[] }[] = [
  { id: "comer", chave: "filtroComer", categorias: ["restaurante", "barraca"] },
  { id: "passeios", chave: "turistaFiltroPasseios", categorias: ["receptivo", "condutor"] },
  { id: "transporte", chave: "filtroTransporte", categorias: ["transporte"] },
  { id: "hospedagem", chave: "filtroHospedagem", categorias: ["hotel", "pousada"] },
  { id: "compras", chave: "turistaFiltroCompras", categorias: ["comercio"] },
];

export function Lugares({
  lugares,
  de,
  aoAbrirMapa,
  aoAbrirLugar,
}: {
  lugares: Estabelecimento[];
  de?: { lat: number; lng: number };
  aoAbrirMapa(): void;
  aoAbrirLugar?(l: Estabelecimento): void;
}) {
  const { t } = useIdioma();
  const [filtro, setFiltro] = useState<string | null>(null);
  // só os filtros que têm algum lugar recomendado
  const disponiveis = FILTROS.filter((f) => lugares.some((l) => f.categorias.includes(l.categoria)));
  const ativo = FILTROS.find((f) => f.id === filtro);
  const lista = ativo ? lugares.filter((l) => ativo.categorias.includes(l.categoria)) : lugares;
  const trilho = useTrilho(lista.length);

  const escolher = (id: string | null) => {
    setFiltro(id);
    trilho.ref.current?.scrollTo({ left: 0 });
  };
  const chip = (ligado: boolean) =>
    `toque h-9 shrink-0 rounded-full px-3.5 text-[13px] font-semibold ${ligado ? "bg-cacau text-white" : "bg-card text-ink hover:bg-surface"}`;

  return (
    <section
      aria-labelledby="t-lugares"
      className="mt-10 rounded-[32px] bg-sand py-8 lg:mt-0 lg:grid lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:gap-10 lg:p-8"
    >
      {/* coluna do nome e da explicação: no celular fica em cima */}
      <div className="px-5 lg:px-0">
        <div className="flex items-start justify-between gap-3">
          <h2 id="t-lugares" className="font-display text-[26px] font-normal leading-tight text-cacau lg:text-[30px]">
            {t("turistaRecomendados")}
          </h2>
          <button
            onClick={aoAbrirMapa}
            className="toque flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-card px-3.5 text-[13px] font-semibold text-cacau shadow-1 lg:hidden"
          >
            <Map size={15} strokeWidth={2.4} />
            {t("mapa")}
          </button>
        </div>
        <p className="mt-1.5 max-w-[42ch] text-[15px] leading-snug text-ink-2">{t("turistaRecomendadosSub")}</p>
        <SobreSelo />
      </div>

      <div className="mt-5 min-w-0 lg:mt-0">
        <div className="mb-3 flex items-center justify-between gap-3 px-5 lg:px-0">
          {disponiveis.length > 1 ? (
            <div role="group" aria-label={t("turistaRecomendados")} className="sem-barra -my-1 flex gap-2 overflow-x-auto py-1">
              <button onClick={() => escolher(null)} aria-pressed={!filtro} className={chip(!filtro)}>
                {t("filtroTodos")}
              </button>
              {disponiveis.map((f) => (
                <button key={f.id} onClick={() => escolher(f.id)} aria-pressed={filtro === f.id} className={chip(filtro === f.id)}>
                  {t(f.chave)}
                </button>
              ))}
            </div>
          ) : (
            <span />
          )}
          <SetasTrilho trilho={trilho} />
        </div>
        {lista.length === 0 ? (
          <p className="mx-5 rounded-[20px] bg-card p-4 text-[15px] text-ink-2 lg:mx-0">{t("semLugares")}</p>
        ) : (
          <ul ref={trilho.ref} className={CLASSE_TRILHO}>
            {lista.map((l) => (
              // a coluna dos cartões é mais estreita que a página: dois por vez no desktop, três nas telas largas
              <li key={l.id} className="flex w-[264px] shrink-0 snap-start lg:w-[calc((100%-1rem)/2)] xl:w-[calc((100%-2rem)/3)]">
                <CartaoLugar lugar={l} de={de} className="w-full" aoAbrir={aoAbrirLugar ? () => aoAbrirLugar(l) : undefined} />
              </li>
            ))}
          </ul>
        )}
      </div>

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
