"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { lerPostoSalvo, postoValido, salvarPosto, type Posto } from "@/lib/central/servicos";
import { RepositorioProvider } from "@/components/turista/RepositorioContext";
import { EscolhaPosto } from "./EscolhaPosto";
import { PainelCentral } from "./PainelCentral";
import { destravarSom } from "./som";

/** Posto pela URL (?posto=policia) ou o último escolhido neste navegador; sem nenhum, a escolha do turno. */
export function AppCentral() {
  const params = useSearchParams();
  const router = useRouter();
  const [posto, setPosto] = useState<Posto | null | undefined>(undefined);

  useEffect(() => {
    setPosto(postoValido(params.get("posto")) ?? lerPostoSalvo());
  }, [params]);

  if (posto === undefined) return <div className="central fixed inset-0" aria-busy />;

  return (
    <RepositorioProvider>
      {posto ? (
        <PainelCentral
          posto={posto}
          aoTrocarPosto={() => {
            salvarPosto(null);
            setPosto(null);
            router.replace("/central");
          }}
        />
      ) : (
        <EscolhaPosto
          aoEscolher={(p) => {
            destravarSom(); // o clique de início de turno libera o som de chamado novo
            salvarPosto(p);
            setPosto(p);
            router.replace(`/central?posto=${p}`);
          }}
        />
      )}
    </RepositorioProvider>
  );
}
