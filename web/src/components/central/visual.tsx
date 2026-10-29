"use client";

// Peças visuais pequenas da Central: ícone do serviço, relógio de espera e o anel da meta.
import { Ambulance, CircleHelp, Flame, Info, RadioTower, Shield, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { Servico } from "@/data/tipos";
import { formatarDuracao, META_ATENDIMENTO_S, tomEspera } from "@/lib/central/fila";
import { corPosto, type Posto } from "@/lib/central/servicos";

const ICONE: Record<Posto, LucideIcon> = {
  coordenacao: RadioTower,
  policia: Shield,
  samu: Ambulance,
  bombeiros: Flame,
  turismo: Info,
};

/** Ícone num quadrado com a cor do serviço; sem serviço = "a definir". */
export function IconeServico({ servico, tamanho = 40 }: { servico?: Posto | Servico; tamanho?: number }) {
  const Icone = servico ? ICONE[servico] : CircleHelp;
  const cor = servico ? corPosto(servico) : "#c9d1d7";
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-[12px]"
      style={{ width: tamanho, height: tamanho, background: `${cor}22`, color: cor, boxShadow: servico ? undefined : `inset 0 0 0 1.5px ${cor}66` }}
    >
      <Icone size={tamanho * 0.5} strokeWidth={2.2} />
    </span>
  );
}

/** Relógio que anda sozinho (1 s). Um só por tela, passado para baixo como `agora`. */
export function useAgora(intervalo = 1000) {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), intervalo);
    return () => clearInterval(id);
  }, [intervalo]);
  return agora;
}

const COR_TOM = { ok: "var(--c-texto-2)", atencao: "var(--c-atencao)", atrasado: "var(--c-urgente)" } as const;

/** Tempo de espera na fila. Passou da meta: vira uma pílula vermelha que pulsa. */
export function Espera({ segundos, aguardando }: { segundos: number; aguardando: boolean }) {
  const tom = aguardando ? tomEspera(segundos) : "ok";
  if (tom === "atrasado") {
    return (
      <span className="relative inline-flex h-6 items-center rounded-full bg-c-urgente px-2 text-[12px] font-bold tabular-nums text-[#1a0606]">
        <span aria-hidden className="pulso absolute inset-0 rounded-full text-c-urgente" />
        <span className="relative">{formatarDuracao(segundos)}</span>
      </span>
    );
  }
  return (
    <span className="text-[13px] font-semibold tabular-nums" style={{ color: COR_TOM[tom] }}>
      {formatarDuracao(segundos)}
    </span>
  );
}

/**
 * Anel do tempo até atendimento: enche em direção à meta enquanto o chamado espera;
 * depois de assumido, congela e mostra quanto tempo levou.
 */
export function AnelEspera({ segundos, congelado }: { segundos: number; congelado: boolean }) {
  const tom = tomEspera(segundos);
  const cor = congelado ? (segundos <= META_ATENDIMENTO_S ? "var(--c-ok)" : "var(--c-atencao)") : COR_TOM[tom];
  const r = 34;
  const volta = 2 * Math.PI * r;
  const fracao = Math.min(1, segundos / META_ATENDIMENTO_S);
  return (
    <div className="relative size-[92px] shrink-0">
      <svg viewBox="0 0 80 80" className="size-full -rotate-90" aria-hidden>
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--c-painel-3)" strokeWidth="6" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke={cor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={volta}
          strokeDashoffset={volta * (1 - fracao)}
          style={{ transition: "stroke-dashoffset 900ms linear, stroke 300ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[19px] font-bold tabular-nums leading-none" style={{ color: cor }}>
          {formatarDuracao(segundos)}
        </span>
        <span className="mt-1 text-[11px] font-medium text-c-texto-3">
          {congelado ? "até assumir" : `meta ${META_ATENDIMENTO_S / 60} min`}
        </span>
      </div>
    </div>
  );
}
