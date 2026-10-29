"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo } from "react";
import type { ChamadoSOS, PraiaHoje, Servico } from "@/data/tipos";
import { esperaDesde, formatarDuracao, type Fila } from "@/lib/central/fila";
import { SERVICOS, servicoDe, type Posto } from "@/lib/central/servicos";
import type { PontoMapa } from "./MapaCentral";
import { IconeServico } from "./visual";

const MapaCentral = dynamic(() => import("./MapaCentral"), { ssr: false, loading: () => <div className="size-full animate-pulse bg-c-painel-2" /> });

const COR_BANDEIRA = { verde: "#5ccf8a", amarela: "#e5a93c", vermelha: "#ff5d5d", cinza: "#7f8b94" } as const;

/** Visão da operação quando nenhum chamado está aberto: o mapa da região e o retrato de cada serviço. */
export function Visao({
  fila,
  todos,
  praias,
  posto,
  agora,
  aoSelecionar,
}: {
  fila: Fila;
  todos: ChamadoSOS[];
  praias: PraiaHoje[];
  posto: Posto;
  agora: number;
  aoSelecionar(id: string): void;
}) {
  const abertos = useMemo(() => [...fila.aguardando, ...fila.emAtendimento], [fila]);
  // memorizado: o relógio da tela anda a cada segundo e o mapa não pode reenquadrar junto
  const pontos = useMemo<PontoMapa[]>(() => [
    ...praias.map((p) => ({
      id: `p-${p.id}`,
      lat: p.lat,
      lng: p.lng,
      tipo: "praia" as const,
      cor: COR_BANDEIRA[p.condicao.bandeira],
      rotulo: `${p.nome}: ${p.condicao.detalhe.pt}`,
    })),
    ...abertos
      .filter((c) => c.lat != null && c.lng != null)
      .map((c) => {
        const s = servicoDe(c);
        return {
          id: c.id,
          lat: c.lat!,
          lng: c.lng!,
          tipo: "chamado" as const,
          cor: s ? SERVICOS[s].cor : "#c9d1d7",
          rotulo: c.mensagemPt.startsWith("[texto original") ? c.mensagemOriginal : c.mensagemPt,
          pulsar: c.status === "enviado",
        };
      }),
  ], [praias, abertos]);

  const servicos = (posto === "coordenacao" ? Object.keys(SERVICOS) : [posto]) as Servico[];
  const abertosDo = (s: Servico) => todos.filter((c) => servicoDe(c) === s && (c.status === "enviado" || c.status === "em_atendimento"));

  return (
    <div className="sem-barra flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 lg:p-6">
      <section aria-label="Mapa da operação" className="relative min-h-[320px] flex-1 overflow-hidden rounded-[20px] border border-c-linha">
        <MapaCentral pontos={pontos} aoTocar={aoSelecionar} zoomMax={13} />
        <div className="pointer-events-none absolute left-3 top-3 z-[500] rounded-[12px] bg-c-fundo/85 px-3 py-2 text-[12.5px] text-c-texto-2 backdrop-blur">
          <p className="font-semibold text-c-texto">Mapa da operação</p>
          <p>Chamados abertos com localização e a bandeira de hoje das praias</p>
        </div>
      </section>

      <section aria-label="Serviços" className={`grid gap-3 ${servicos.length > 1 ? "sm:grid-cols-2 xl:grid-cols-4" : ""}`}>
        {servicos.map((s) => {
          const lista = abertosDo(s);
          const esperando = lista.filter((c) => c.status === "enviado");
          const maisAntigo = esperando.length
            ? Math.max(...esperando.map((c) => (agora - new Date(esperaDesde(c)).getTime()) / 1000))
            : null;
          return (
            <div key={s} className="flex items-center gap-3 rounded-[18px] border border-c-linha bg-c-painel p-4">
              <IconeServico servico={s} tamanho={44} />
              <div className="min-w-0">
                <p className="truncate text-[15px] font-bold">{SERVICOS[s].nomePt}</p>
                <p className="text-[13px] text-c-texto-2">
                  {esperando.length} aguardando, {lista.length - esperando.length} em atendimento
                </p>
                {maisAntigo != null && <p className="text-[12.5px] text-c-atencao">Mais antigo esperando há {formatarDuracao(maisAntigo)}</p>}
              </div>
            </div>
          );
        })}
      </section>

      {abertos.length === 0 && (
        <p className="rounded-[18px] border border-dashed border-c-linha p-4 text-[14px] leading-relaxed text-c-texto-2">
          Tudo calmo por aqui. Para ver um chamado chegar, abra a{" "}
          <Link href="/?origem=pousada-mare&lang=es" target="_blank" className="font-semibold text-c-azul-claro underline underline-offset-2">
            tela do turista
          </Link>{" "}
          em outra aba deste navegador, <b className="font-semibold text-c-texto">no mesmo endereço ({typeof window !== "undefined" ? window.location.host : ""})</b>, e
          confirme um SOS, ou gere chamados de exemplo no{" "}
          <Link href="/ensaio" target="_blank" className="font-semibold text-c-azul-claro underline underline-offset-2">
            ensaio
          </Link>
          .
        </p>
      )}
    </div>
  );
}
