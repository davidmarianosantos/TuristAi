"use client";

import Image from "next/image";
import { COORDENACAO, POSTOS, SERVICOS, type Posto } from "@/lib/central/servicos";
import { IconeServico } from "./visual";
import mascote from "../../../public/img/mascote.png";

/** Início do turno: cada atendente escolhe o posto em que vai trabalhar. Sem login no MVP. */
export function EscolhaPosto({ aoEscolher }: { aoEscolher(p: Posto): void }) {
  return (
    <div className="central fixed inset-0 overflow-y-auto">
      <div className="mx-auto flex min-h-full max-w-[1040px] flex-col px-5 py-10 lg:py-16">
        <div className="flex items-center gap-3">
          <Image src={mascote} alt="" aria-hidden priority className="h-11 w-auto shrink-0" />
          <p className="text-[15px] font-semibold text-c-texto-2">TuristAí · Costa do Cacau</p>
        </div>
        <h1 className="mt-8 text-[34px] font-bold leading-[1.1] tracking-[-0.02em] lg:text-[44px]">Central Integrada</h1>
        <p className="mt-3 max-w-[560px] text-[16px] leading-relaxed text-c-texto-2">
          Os pedidos de SOS dos turistas chegam aqui já traduzidos para o português e com uma triagem sugerida. Escolha o seu posto
          para iniciar o turno.
        </p>

        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {POSTOS.map((p) => {
            const info = p === "coordenacao" ? { nomePt: COORDENACAO.nomePt, recebe: COORDENACAO.recebe, numero: undefined } : SERVICOS[p];
            return (
              <li key={p} className={p === "coordenacao" ? "sm:col-span-2 lg:col-span-1" : ""}>
                <button
                  onClick={() => aoEscolher(p)}
                  className="toque group flex h-full w-full flex-col gap-4 rounded-[20px] border border-c-linha bg-c-painel p-5 text-left transition-colors hover:border-c-texto-3 hover:bg-c-painel-2"
                >
                  <span className="flex items-start justify-between">
                    <IconeServico servico={p} tamanho={48} />
                    {info.numero && <span className="text-[28px] font-bold tabular-nums leading-none text-c-texto-3">{info.numero}</span>}
                  </span>
                  <span>
                    <span className="block text-[19px] font-bold">{info.nomePt}</span>
                    <span className="mt-1 block text-[14px] leading-snug text-c-texto-2">{info.recebe}</span>
                  </span>
                  <span className="mt-auto text-[14px] font-semibold text-c-azul-claro group-hover:underline">Iniciar turno</span>
                </button>
              </li>
            );
          })}
        </ul>

        <p className="mt-8 text-[13px] text-c-texto-3">
          Sem login no MVP: o posto fica salvo neste navegador. A ligação direta para 190, 192 e 193 continua disponível para o turista o
          tempo todo; a Central é um canal a mais, não substitui o telefone.
        </p>
      </div>
    </div>
  );
}
