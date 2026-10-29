"use client";

import Image from "next/image";
import type { Municipio } from "@/data/tipos";

export const REGIAO = "regiao";

const data = (d: Date) =>
  d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const hora = (d: Date) => d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

/** Faixa azul institucional: título, relógio ao vivo e o seletor de município. */
export function Cabecalho({
  agora,
  municipios,
  escopo,
  aoMudarEscopo,
}: {
  /** null até montar no navegador, para o prerender não fixar uma hora */
  agora: Date | null;
  municipios: Municipio[];
  escopo: string;
  aoMudarEscopo: (id: string) => void;
}) {
  return (
    <header className="bg-(--ba-azul) text-white shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-white">
            <Image src="/img/logo-turistai.png" alt="" width={36} height={36} className="size-9 object-contain" />
          </span>
          <div className="min-w-0">
            <h1 className="text-[20px] font-semibold leading-tight sm:text-[22px]">
              Painel Regional de Turismo · Costa do Cacau
            </h1>
            <p className="text-[13px] text-white/80">TuristAí · Gestão pública dos 8 municípios</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <p className="text-[13px] leading-tight text-white/90" aria-live="off">
            {agora ? (
              <>
                <span className="block first-letter:uppercase">{data(agora)}</span>
                <span className="g-tabular text-[18px] font-semibold text-white">{hora(agora)}</span>
              </>
            ) : (
              <span className="block h-[38px] w-[200px]" aria-hidden />
            )}
          </p>
          <label className="flex flex-col gap-1 text-[12px] font-medium text-white/80">
            Município
            <select
              value={escopo}
              onChange={(e) => aoMudarEscopo(e.target.value)}
              className="h-10 min-w-[200px] rounded-[4px] border border-white/40 bg-white px-3 text-[15px] font-medium text-(--ba-texto)"
            >
              <option value={REGIAO}>Região (8 municípios)</option>
              {municipios.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </header>
  );
}
