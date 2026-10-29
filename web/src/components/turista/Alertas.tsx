"use client";

import { ShieldCheck } from "lucide-react";
import { forwardRef, useEffect, useState } from "react";
import type { Alerta } from "@/data/tipos";
import { useIdioma } from "@/lib/idioma";
import { Bandeira } from "@/components/ui/Bandeira";

function useRelogio() {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  return agora;
}

const ESTILO = {
  perigo: { card: "bg-danger text-white", meta: "text-white/85", bandeira: "vermelha", ponto: "bg-white text-white" },
  atencao: { card: "bg-card text-ink", meta: "text-warn-ink", bandeira: "amarela", ponto: "bg-warn text-warn" },
  info: { card: "bg-card text-ink", meta: "text-blue", bandeira: "verde", ponto: "bg-blue text-blue" },
} as const;

export const Alertas = forwardRef<HTMLElement, { alertas: Alerta[]; novos: Set<string> }>(function Alertas(
  { alertas, novos },
  ref,
) {
  const { t, tr, idioma } = useIdioma();
  const agora = useRelogio();

  const quando = (iso: string) => {
    const min = Math.floor((agora - new Date(iso).getTime()) / 60_000);
    return min < 1 ? t("agora") : t("haMinutos", { n: min });
  };

  const rotulo = (a: Alerta) =>
    a.condicao?.bandeira === "vermelha"
      ? t("bandeiraVermelha")
      : a.condicao?.bandeira === "amarela"
        ? t("bandeiraAmarela")
        : t("alertasDeHoje");

  return (
    <section ref={ref} aria-labelledby="t-alertas" className="relative z-10 -mt-7 scroll-mt-20 px-4 lg:absolute lg:bottom-14 lg:right-[max(48px,calc((100%-1280px)/2+32px))] lg:mt-0 lg:w-[460px] lg:px-0 xl:w-[500px]">
      <h2 id="t-alertas" className="sr-only">
        {t("alertasDeHoje")}
      </h2>
      <div aria-live="polite" className="flex flex-col gap-3">
        {alertas.length === 0 ? (
          <p className="flex items-center gap-3 rounded-[22px] bg-card px-4 py-4 text-[15px] font-semibold text-ok-ink shadow-2">
            <span className="flex size-10 items-center justify-center rounded-full bg-ok-bg">
              <ShieldCheck size={20} strokeWidth={2.4} />
            </span>
            {t("semAlertas")}
          </p>
        ) : (
          alertas.map((a) => {
            const e = ESTILO[a.severidade];
            return (
              <article
                key={a.id}
                className={`${e.card} relative overflow-hidden rounded-[24px] p-5 shadow-3 ${novos.has(a.id) ? "entra-de-cima" : ""}`}
              >
                <div className="flex gap-3.5">
                  <span className="flex size-14 shrink-0 items-center justify-center rounded-[18px] bg-white">
                    <Bandeira cor={e.bandeira} tamanho={32} mastro="var(--ink)" titulo={rotulo(a)} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[22px] font-extrabold leading-[1.12] tracking-[-0.025em]">{tr(a.titulo)}</h3>
                    <p className="mt-1.5 text-[15px] leading-snug opacity-90">{tr(a.texto)}</p>
                  </div>
                </div>
                {/* quem avisou e quando, numa frase; o ponto pulsando diz que o aviso está valendo */}
                <p className={`mt-4 flex items-center gap-2 text-[13px] font-medium ${e.meta}`}>
                  <span aria-hidden className={`relative size-2 shrink-0 rounded-full ${e.ponto} pulso`} />
                  <span>
                    {a.origem}, {quando(a.criadoEm)}.{idioma !== "pt" && ` ${t("traduzido")}.`}
                  </span>
                </p>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
});
