"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useIdioma } from "@/lib/idioma";

/** Fileira que rola de lado: no celular, com o dedo; no desktop, uma linha só, com setas no título da seção. */
export const CLASSE_TRILHO =
  "sem-barra flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 pb-3 pt-1 lg:gap-4 lg:scroll-px-0 lg:px-0";

/** Largura de cada item: fixa no celular; no desktop, três por vez (quatro nas telas largas). */
export const ITEM_TRILHO = "shrink-0 snap-start lg:w-[calc((100%-2rem)/3)] xl:w-[calc((100%-3rem)/4)]";

export function useTrilho(itens: number) {
  const ref = useRef<HTMLUListElement>(null);
  const [pontas, setPontas] = useState({ inicio: true, fim: true });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () =>
      setPontas({ inicio: el.scrollLeft <= 4, fim: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
    medir();
    el.addEventListener("scroll", medir, { passive: true });
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", medir);
      ro.disconnect();
    };
  }, [itens]);

  // avança uma "página" da fileira; o scroll-snap alinha no próximo cartão
  const rolar = useCallback((sentido: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: sentido * el.clientWidth, behavior: suave ? "smooth" : "auto" });
  }, []);

  return { ref, ...pontas, rolar };
}

/** Setas do desktop. Somem quando tudo cabe numa linha. */
export function SetasTrilho({ trilho }: { trilho: ReturnType<typeof useTrilho> }) {
  const { t } = useIdioma();
  if (trilho.inicio && trilho.fim) return null;
  const botao =
    "toque flex size-10 items-center justify-center rounded-full bg-card text-ink shadow-1 transition-opacity hover:bg-surface disabled:cursor-default disabled:opacity-35 disabled:hover:bg-card";
  return (
    <div className="hidden shrink-0 gap-2 lg:flex">
      <button onClick={() => trilho.rolar(-1)} disabled={trilho.inicio} aria-label={t("turistaAnteriores")} className={botao}>
        <ChevronLeft size={20} strokeWidth={2.4} aria-hidden />
      </button>
      <button onClick={() => trilho.rolar(1)} disabled={trilho.fim} aria-label={t("turistaProximos")} className={botao}>
        <ChevronRight size={20} strokeWidth={2.4} aria-hidden />
      </button>
    </div>
  );
}
