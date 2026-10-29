"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Idioma } from "@/data/tipos";
import { detectarIdioma, IdiomaProvider, lerIdiomaSalvo } from "@/lib/idioma";
import { RepositorioProvider } from "./RepositorioContext";
import { TelaTurista } from "./TelaTurista";

/** Tudo da tela do turista depende do aparelho (idioma, dados locais): renderiza só no cliente. */
export function AppTurista() {
  const params = useSearchParams();
  const [idioma, setIdioma] = useState<Idioma | null>(null);

  useEffect(() => {
    setIdioma(
      detectarIdioma({ param: params.get("lang"), salvo: lerIdiomaSalvo(), navegador: navigator.languages }),
    );
  }, [params]);

  if (!idioma) return <div className="min-h-dvh bg-field" aria-busy />;

  return (
    <RepositorioProvider>
      <IdiomaProvider inicial={idioma}>
        <TelaTurista origemSlug={params.get("origem")} forcarConvite={params.get("whatsapp") === "1"} />
      </IdiomaProvider>
    </RepositorioProvider>
  );
}
