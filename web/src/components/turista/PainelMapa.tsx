"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type { Estabelecimento, PraiaHoje } from "@/data/tipos";
import type { Chave } from "@/i18n/textos";
import { useIdioma } from "@/lib/idioma";
import { montarPinos, type Filtro } from "@/lib/mapa";
import { CartaoLugar } from "./Lugares";
import { ListaPraias } from "./Praias";

const Mapa = dynamic(() => import("./Mapa"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-surface" />,
});

const FILTROS: [Filtro, Chave][] = [
  ["todos", "filtroTodos"],
  ["comer", "filtroComer"],
  ["praias", "filtroPraias"],
  ["hospedagem", "filtroHospedagem"],
  ["transporte", "filtroTransporte"],
];

/** Mapa com filtros e cartão do pino. Serve à folha do celular e à coluna do desktop. */
export function PainelMapa({
  lugares,
  praias,
  centro,
  de,
}: {
  lugares: Estabelecimento[];
  praias: PraiaHoje[];
  centro: { lat: number; lng: number };
  de?: { lat: number; lng: number };
}) {
  const { t } = useIdioma();
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [sel, setSel] = useState<string | null>(null);
  const pinos = useMemo(() => montarPinos(lugares, praias, filtro), [lugares, praias, filtro]);
  const pino = pinos.find((p) => p.id === sel);

  return (
    <div className="relative isolate flex h-full min-h-0 flex-col">
      <div role="toolbar" aria-label={t("mapa")} className="sem-barra absolute inset-x-0 top-0 z-[500] flex gap-2 overflow-x-auto px-4 py-3">
        {FILTROS.map(([f, c]) => (
          <button
            key={f}
            onClick={() => {
              setFiltro(f);
              setSel(null);
            }}
            aria-pressed={filtro === f}
            className={`toque h-10 shrink-0 rounded-full px-4 text-[14px] font-semibold shadow-[0_2px_8px_rgba(14,32,135,0.18)] ${
              filtro === f ? "bg-ink text-white" : "bg-ground text-ink"
            }`}
          >
            {t(c)}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1">
        <Mapa pinos={pinos} centro={centro} selecionado={sel} aoTocarPino={setSel} />
      </div>
      {pino && (
        <div className="aparece absolute inset-x-3 bottom-3 z-[500] shadow-[0_8px_28px_rgba(14,32,135,0.28)]">
          <button
            onClick={() => setSel(null)}
            aria-label={t("fechar")}
            className="absolute right-2 top-2 z-10 flex size-9 items-center justify-center rounded-full bg-white/90 text-ink"
          >
            <svg width="14" height="14" viewBox="0 0 18 18" aria-hidden>
              <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
            </svg>
          </button>
          {pino.tipo === "lugar" ? <CartaoLugar lugar={pino.lugar} de={de} compacto className="w-full" /> : <ListaPraias praias={[pino.praia]} />}
        </div>
      )}
    </div>
  );
}
