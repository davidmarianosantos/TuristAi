"use client";

import Image from "next/image";
import { Check, Clock, Footprints, Landmark, MapPin, Navigation, Sailboat, Sprout, Sunset, Waves, type LucideIcon } from "lucide-react";
import { useState } from "react";
import type { Atrativo, TipoAtrativo, Traduzido } from "@/data/tipos";
import { useIdioma } from "@/lib/idioma";
import { distanciaKm, formatarDistancia } from "@/lib/mapa";
import { Folha } from "@/components/ui/Folha";
import { Titulo } from "./Praias";
import { CLASSE_TRILHO, ITEM_TRILHO, SetasTrilho, useTrilho } from "./Trilho";

type Ponto = { lat: number; lng: number };

export const TIPO_ATRATIVO: Record<TipoAtrativo, { nome: Traduzido; icone: LucideIcon }> = {
  trilha: { nome: { pt: "Trilha", es: "Sendero", en: "Trail" }, icone: Footprints },
  mirante: { nome: { pt: "Mirante", es: "Mirador", en: "Viewpoint" }, icone: Sunset },
  passeio: { nome: { pt: "Passeio", es: "Paseo", en: "Tour" }, icone: Sailboat },
  aventura: { nome: { pt: "Aventura", es: "Aventura", en: "Adventure" }, icone: Waves },
  cultura: { nome: { pt: "Cultura", es: "Cultura", en: "Culture" }, icone: Landmark },
  cacau: { nome: { pt: "Cacau", es: "Cacao", en: "Cacao" }, icone: Sprout },
};

function useDistancia(a: Atrativo | null, de?: Ponto) {
  const { idioma } = useIdioma();
  if (!a || !de || a.lat == null || a.lng == null) return null;
  return formatarDistancia(distanciaKm(de, { lat: a.lat, lng: a.lng }), idioma);
}

function CartaoAtrativo({ a, de, aoAbrir }: { a: Atrativo; de?: Ponto; aoAbrir(): void }) {
  const { tr } = useIdioma();
  const dist = useDistancia(a, de);
  const tipo = TIPO_ATRATIVO[a.tipo];
  const Icone = tipo.icone;
  return (
    <button
      onClick={aoAbrir}
      className="group toque relative isolate flex aspect-[4/5] w-full flex-col justify-between overflow-hidden rounded-[24px] bg-field p-3.5 text-left text-white"
    >
      <Image
        src={a.foto}
        alt=""
        fill
        sizes="(min-width: 1280px) 300px, (min-width: 1024px) 31vw, 272px"
        className="-z-10 object-cover transition-transform duration-700 ease-[var(--ease-out)] group-hover:scale-[1.04]"
      />
      {/* véu: o topo segura as etiquetas e a base, o nome */}
      <span
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{ background: "linear-gradient(180deg, rgba(6,32,44,0.38) 0%, rgba(6,32,44,0) 26%, rgba(6,32,44,0) 42%, rgba(6,32,44,0.9) 100%)" }}
      />
      <span className="flex items-start justify-between gap-2">
        <span className="flex h-8 items-center gap-1.5 rounded-full bg-[rgba(6,32,44,0.55)] px-3 text-[12.5px] font-semibold">
          <Icone size={14} strokeWidth={2.4} aria-hidden />
          {tr(tipo.nome)}
        </span>
        {dist && (
          <span className="flex h-8 items-center gap-1 rounded-full bg-[rgba(6,32,44,0.55)] px-2.5 text-[12px] font-semibold tabular-nums">
            <MapPin size={12} strokeWidth={2.6} aria-hidden />
            {dist}
          </span>
        )}
      </span>
      <span>
        <span className="block text-balance text-[21px] font-bold leading-[1.12] tracking-[-0.02em]">{a.nome}</span>
        <span className="mt-1.5 line-clamp-2 block text-[14px] leading-snug text-white/85">{tr(a.resumo)}</span>
      </span>
    </button>
  );
}

/** Passeios e pontos turísticos: a parte da página que convida a sair do hotel. */
export function Atrativos({ atrativos, de, aoAbrir }: { atrativos: Atrativo[]; de?: Ponto; aoAbrir(a: Atrativo): void }) {
  const { t } = useIdioma();
  const trilho = useTrilho(atrativos.length);
  if (atrativos.length === 0) return null;
  return (
    <section aria-labelledby="t-fazer" className="pt-10 lg:pt-14">
      <Titulo id="t-fazer" descoberta extra={<SetasTrilho trilho={trilho} />}>
        {t("turistaOQueFazer")}
      </Titulo>
      <ul ref={trilho.ref} className={CLASSE_TRILHO}>
        {atrativos.map((a) => (
          <li key={a.id} className={`w-[272px] ${ITEM_TRILHO}`}>
            <CartaoAtrativo a={a} de={de} aoAbrir={() => aoAbrir(a)} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Etiqueta({ icone: Icone, children }: { icone: LucideIcon; children: React.ReactNode }) {
  return (
    <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-sand px-3 text-[13px] font-semibold text-ink">
      <Icone size={14} strokeWidth={2.4} className="text-cacau" aria-hidden />
      {children}
    </span>
  );
}

export function FolhaAtrativo({
  atrativo,
  de,
  cidade,
  aoFechar,
}: {
  atrativo: Atrativo | null;
  de?: Ponto;
  cidade: string;
  aoFechar(): void;
}) {
  const { t, tr } = useIdioma();
  // guarda o último aberto para a folha não esvaziar enquanto fecha
  const [ultimo, setUltimo] = useState(atrativo);
  if (atrativo && atrativo !== ultimo) setUltimo(atrativo);
  const a = atrativo ?? ultimo;
  const dist = useDistancia(a, de);
  const tipo = a ? TIPO_ATRATIVO[a.tipo] : null;

  return (
    <Folha aberta={!!atrativo} aoFechar={aoFechar} titulo={a?.nome ?? ""} rotuloFechar={t("fechar")}>
      {a && tipo && (
        <div className="sem-barra min-h-0 flex-auto overflow-y-auto px-5 pb-[max(20px,env(safe-area-inset-bottom))]">
          <div className="relative aspect-[16/10] overflow-hidden rounded-[20px] bg-field">
            <Image src={a.foto} alt="" fill sizes="(min-width: 1024px) 440px, 100vw" className="object-cover" />
          </div>
          <p className="mt-4 flex flex-wrap gap-2">
            <Etiqueta icone={tipo.icone}>{tr(tipo.nome)}</Etiqueta>
            {a.duracao && <Etiqueta icone={Clock}>{tr(a.duracao)}</Etiqueta>}
            {dist && <Etiqueta icone={MapPin}>{dist}</Etiqueta>}
          </p>
          <p className="mt-4 max-w-[60ch] text-[16px] leading-relaxed">{tr(a.descricao)}</p>
          <h3 className="mt-6 text-[16px] font-bold">{t("turistaAntesDeIr")}</h3>
          <ul className="mt-2.5 flex flex-col gap-2.5">
            {a.dicas.map((d) => (
              <li key={d.pt} className="flex items-start gap-2.5 text-[15px] leading-snug">
                <Check size={18} strokeWidth={2.6} className="mt-px shrink-0 text-ok" aria-hidden />
                {tr(d)}
              </li>
            ))}
          </ul>
          {/* rota pelo nome do lugar: o mapa acha a entrada certa melhor que as nossas coordenadas aproximadas */}
          {a.lat != null && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${a.nome}, ${cidade}, Bahia`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="toque mt-7 flex h-[54px] w-full items-center justify-center gap-2 rounded-full bg-cacau px-6 text-[15px] font-semibold text-white shadow-2"
            >
              <Navigation size={18} strokeWidth={2.2} aria-hidden />
              {t("turistaComoChegar")}
            </a>
          )}
        </div>
      )}
    </Folha>
  );
}
