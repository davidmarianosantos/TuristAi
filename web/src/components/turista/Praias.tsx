"use client";

import type { PraiaHoje, Situacao } from "@/data/tipos";
import { useIdioma } from "@/lib/idioma";
import type { Chave } from "@/i18n/textos";
import { Bandeira } from "@/components/ui/Bandeira";

const SITUACAO: Record<Situacao, { chave: Chave; pill: string; fundo: string }> = {
  propria: { chave: "propria", pill: "bg-ok text-white", fundo: "bg-ok-bg" },
  precaucao: { chave: "precaucao", pill: "bg-warn text-ink", fundo: "bg-warn-bg" },
  impropria: { chave: "impropria", pill: "bg-danger text-white", fundo: "bg-danger-bg" },
  sem_dados: { chave: "semDados", pill: "bg-surface-2 text-ink-2", fundo: "bg-surface" },
};

/** Título de seção. `descoberta` usa a serifa da linha privada; o padrão é a Inter do serviço público. */
export function Titulo({
  id,
  children,
  extra,
  descoberta = false,
}: {
  id: string;
  children: React.ReactNode;
  extra?: React.ReactNode;
  descoberta?: boolean;
}) {
  return (
    <div className="mb-3.5 flex items-end justify-between gap-3 px-5 lg:px-0">
      <h2
        id={id}
        className={
          descoberta
            ? "font-display text-[26px] font-normal leading-tight text-cacau"
            : "font-display text-[24px] font-normal leading-tight"
        }
      >
        {children}
      </h2>
      {extra}
    </div>
  );
}

/** Lista compacta (usada no assistente e no cartão do mapa). */
export function ListaPraias({ praias }: { praias: PraiaHoje[] }) {
  const { t, tr } = useIdioma();
  return (
    <ul className="flex flex-col gap-2">
      {praias.map((p) => {
        const s = SITUACAO[p.condicao.situacao];
        return (
          <li key={p.id} className="flex items-center gap-3 rounded-[16px] border border-line bg-card px-4 py-3">
            <Bandeira cor={p.condicao.bandeira} tamanho={30} mastro="var(--ink)" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[16px] font-bold tracking-[-0.01em]">{p.nome}</p>
              <p className="truncate text-[13px] text-ink-2">{tr(p.condicao.detalhe)}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-bold ${s.pill}`}>{t(s.chave)}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function Praias({ praias }: { praias: PraiaHoje[] }) {
  const { t, tr } = useIdioma();
  return (
    <section aria-labelledby="t-praias" className="pt-10 lg:pt-14">
      <Titulo id="t-praias">{t("praiasHoje")}</Titulo>
      {/* A linha da costa: cada praia é a bandeira do dia fincada na areia, com o mar batendo embaixo. */}
      <div className="relative mx-4 overflow-hidden rounded-[28px] bg-sand lg:mx-0">
        <ul className="sem-barra relative z-10 flex snap-x gap-2 overflow-x-auto scroll-px-5 px-5 pt-6 pb-[72px] lg:justify-around lg:px-8 lg:pt-8">
          {praias.map((p) => {
            const s = SITUACAO[p.condicao.situacao];
            return (
              <li key={p.id} className="flex w-[104px] shrink-0 snap-start flex-col items-center text-center">
                <span className="relative flex h-[76px] items-end">
                  <Bandeira cor={p.condicao.bandeira} tamanho={68} mastro="var(--cacau)" titulo={t(s.chave)} />
                  <span aria-hidden className="absolute -bottom-1 left-0 h-2 w-6 rounded-[50%] bg-cacau/20" />
                </span>
                <h3 className="mt-3 text-[16px] font-bold leading-tight">{p.nome}</h3>
                <span className={`mt-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-bold ${s.pill}`}>{t(s.chave)}</span>
                <p className="mt-1.5 text-[12px] leading-snug text-ink-2">{tr(p.condicao.detalhe)}</p>
              </li>
            );
          })}
        </ul>
        <svg aria-hidden className="mar absolute inset-x-0 bottom-0 h-[64px] w-[200%]" viewBox="0 0 800 64" preserveAspectRatio="none">
          <path d="M0 22c50-14 100-14 150 0s100 14 150 0 100-14 150 0 100 14 150 0 100-14 150 0v42H0z" fill="#a8d8e2" />
          <path d="M0 36c50-12 100-12 150 0s100 12 150 0 100-12 150 0 100 12 150 0 100-12 150 0v28H0z" fill="#0b4f6c" fillOpacity=".55" />
          <path d="M0 22c50-14 100-14 150 0s100 14 150 0 100-14 150 0 100 14 150 0 100-14 150 0" fill="none" stroke="#fff" strokeOpacity=".8" strokeWidth="2" />
        </svg>
      </div>
    </section>
  );
}
