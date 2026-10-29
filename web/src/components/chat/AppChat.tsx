"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Idioma } from "@/data/tipos";
import { detectarIdioma, IdiomaProvider, lerIdiomaSalvo } from "@/lib/idioma";
import { RepositorioProvider } from "@/components/turista/RepositorioContext";
import { TelaChat } from "./TelaChat";

/** Mesmo esquema da tela do turista: idioma e origem chegam pela URL, renderiza só no cliente. */
export function AppChat() {
  const params = useSearchParams();
  const [idioma, setIdioma] = useState<Idioma | null>(null);

  useEffect(() => {
    setIdioma(detectarIdioma({ param: params.get("lang"), salvo: lerIdiomaSalvo(), navegador: navigator.languages }));
  }, [params]);

  if (!idioma) return <div className="min-h-dvh bg-field" aria-busy />;

  return (
    <RepositorioProvider>
      <IdiomaProvider inicial={idioma}>
        <TelaChat origemSlug={params.get("origem")} />
      </IdiomaProvider>
    </RepositorioProvider>
  );
}
