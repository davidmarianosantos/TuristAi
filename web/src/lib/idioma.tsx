"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Idioma, Traduzido } from "@/data/tipos";
import { DICIONARIOS, type Chave } from "@/i18n/textos";

const IDIOMAS: Idioma[] = ["pt", "es", "en"];
const CHAVE = "costa-cacau:idioma";

const valido = (x?: string | null): Idioma | null => {
  const base = x?.toLowerCase().slice(0, 2);
  return IDIOMAS.includes(base as Idioma) ? (base as Idioma) : null;
};

/** URL → escolha salva → idiomas do navegador → português. */
export function detectarIdioma(e: { param?: string | null; salvo?: string | null; navegador?: readonly string[] }): Idioma {
  return (
    valido(e.param) ??
    valido(e.salvo) ??
    (e.navegador ?? []).map(valido).find((x): x is Idioma => !!x) ??
    "pt"
  );
}

export function lerIdiomaSalvo(): string | null {
  try {
    return localStorage.getItem(CHAVE);
  } catch {
    return null;
  }
}

export function salvarIdioma(i: Idioma) {
  try {
    localStorage.setItem(CHAVE, i);
  } catch {}
}

type Ctx = {
  idioma: Idioma;
  setIdioma(i: Idioma): void;
  t(c: Chave, vars?: Record<string, string | number>): string;
  tr(x: Traduzido): string;
};

const IdiomaCtx = createContext<Ctx | null>(null);

export function IdiomaProvider({ inicial, children }: { inicial: Idioma; children: React.ReactNode }) {
  const [idioma, setIdiomaEstado] = useState<Idioma>(inicial);

  useEffect(() => {
    document.documentElement.lang = idioma === "pt" ? "pt-BR" : idioma;
  }, [idioma]);

  const setIdioma = useCallback((i: Idioma) => {
    setIdiomaEstado(i);
    salvarIdioma(i);
  }, []);

  const valor = useMemo<Ctx>(
    () => ({
      idioma,
      setIdioma,
      t: (c, vars) =>
        DICIONARIOS[idioma][c].replace(/\{(\w+)\}/g, (_, k: string) => String(vars?.[k] ?? `{${k}}`)),
      tr: (x) => x[idioma] || x.pt,
    }),
    [idioma, setIdioma],
  );

  return <IdiomaCtx.Provider value={valor}>{children}</IdiomaCtx.Provider>;
}

export function useIdioma() {
  const c = useContext(IdiomaCtx);
  if (!c) throw new Error("useIdioma fora do IdiomaProvider");
  return c;
}

/** Preço sempre como "R$ 89", em qualquer idioma: é o que o turista vê no cardápio. */
export const formatarReais = (v: number, idioma: Idioma) =>
  `R$ ${new Intl.NumberFormat(idioma === "pt" ? "pt-BR" : idioma, { maximumFractionDigits: 2 }).format(v)}`;
