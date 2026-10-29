"use client";

import { useEffect, useState } from "react";
import { repositorio, type Ensaio, type Repositorio } from "@/data/repositorio";
import { PublicarAlerta, type PraiaDaRegiao } from "./PublicarAlerta";

type Repo = Repositorio & Ensaio;

/** Painel regional da gestão: publica Alertas e acompanha o Alcance deles. */
export function AppGestao() {
  // o mock lê o localStorage: só nasce no navegador
  const [repo, setRepo] = useState<Repo | null>(null);
  const [praias, setPraias] = useState<PraiaDaRegiao[]>([]);

  useEffect(() => {
    const r = repositorio();
    setRepo(r);
    // para os passos de verificação pelo console (não há framework de teste)
    if (process.env.NODE_ENV === "development") (window as unknown as { repoGestao: Repo }).repoGestao = r;
  }, []);

  useEffect(() => {
    if (!repo) return;
    let vivo = true;
    (async () => {
      const municipios = await repo.municipios();
      const porMunicipio = await Promise.all(
        municipios.map(async (municipio) => (await repo.praiasHoje(municipio.id)).map((praia) => ({ municipio, praia }))),
      );
      if (vivo) setPraias(porMunicipio.flat());
    })();
    return () => {
      vivo = false;
    };
  }, [repo]);

  if (!repo) return <div className="painel-gestao min-h-dvh bg-ground" aria-busy />;

  return (
    <main className="painel-gestao mx-auto flex min-h-dvh max-w-[960px] flex-col gap-5 bg-ground px-4 py-6">
      <header>
        <h1 className="text-[28px] font-extrabold tracking-[-0.03em]">Painel da gestão</h1>
        <p className="text-[15px] text-ink-2">Costa do Cacau</p>
      </header>
      <PublicarAlerta praias={praias} aoPublicar={(a) => repo.publicarAlerta(a)} />
    </main>
  );
}
