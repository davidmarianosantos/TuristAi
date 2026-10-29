"use client";

import { useEffect, useState } from "react";
import type { Alerta, Idioma, Municipio, PraiaHoje } from "@/data/tipos";
import { Cartao } from "./Cartao";
import { criarAlerta, MODELOS_ALERTA, type ModeloAlerta } from "./modelos";

export type PraiaDaRegiao = { municipio: Municipio; praia: PraiaHoje };

const IDIOMAS: { id: Idioma; rotulo: string }[] = [
  { id: "pt", rotulo: "PT" },
  { id: "es", rotulo: "ES" },
  { id: "en", rotulo: "EN" },
];

/** Escolhe a praia e o Modelo de alerta; o texto já sai nos 3 idiomas. */
export function PublicarAlerta({ praias, aoPublicar }: { praias: PraiaDaRegiao[]; aoPublicar: (a: Alerta) => void }) {
  const [praiaId, setPraiaId] = useState("");
  const [modelo, setModelo] = useState<ModeloAlerta | null>(null);
  const [publicadoEm, setPublicadoEm] = useState<Date | null>(null);
  const [travado, setTravado] = useState(false);

  // trava o botão por 2 s depois de publicar, para um clique duplo não publicar dois Alertas
  useEffect(() => {
    if (!travado) return;
    const id = setTimeout(() => setTravado(false), 2000);
    return () => clearTimeout(id);
  }, [travado]);

  const escolhida = praias.find((p) => p.praia.id === praiaId);
  const municipios = [...new Map(praias.map((p) => [p.municipio.id, p.municipio])).values()];

  const publicar = () => {
    if (!escolhida || !modelo) return;
    aoPublicar(criarAlerta(modelo, escolhida.praia, escolhida.municipio));
    setPublicadoEm(new Date());
    setTravado(true);
  };

  return (
    <Cartao titulo="Publicar alerta" contexto="Modelo de alerta já traduzido para PT, ES e EN">
      <label className="block text-[13px] font-medium text-(--ba-texto-2)" htmlFor="gestao-praia">
        Praia
      </label>
      <select
        id="gestao-praia"
        className="g-campo mt-1"
        value={praiaId}
        onChange={(e) => setPraiaId(e.target.value)}
      >
        <option value="">Escolha a praia</option>
        {municipios.map((m) => (
          <optgroup key={m.id} label={m.nome}>
            {praias
              .filter((p) => p.municipio.id === m.id)
              .map(({ praia }) => (
                <option key={praia.id} value={praia.id}>
                  {praia.nome}
                </option>
              ))}
          </optgroup>
        ))}
      </select>

      <p className="mt-4 text-[13px] font-medium text-(--ba-texto-2)">Modelo de alerta</p>
      <div className="mt-1 flex flex-wrap gap-2" role="group" aria-label="Modelo de alerta">
        {MODELOS_ALERTA.map((m) => (
          <button
            key={m.id}
            type="button"
            aria-pressed={modelo?.id === m.id}
            onClick={() => setModelo(m)}
            className={`g-botao border ${
              modelo?.id === m.id
                ? "border-(--ba-azul) bg-(--ba-azul) text-white"
                : "border-(--ba-linha) bg-(--ba-card) text-(--ba-texto) hover:bg-(--ba-fundo)"
            }`}
          >
            {m.nome}
          </button>
        ))}
      </div>

      {escolhida && modelo && (
        <div className="mt-4 space-y-2 rounded-[4px] border border-(--ba-linha-2) bg-(--ba-fundo) p-3 text-[14px]">
          {IDIOMAS.map(({ id, rotulo }) => (
            <p key={id}>
              <span className="mr-2 inline-block w-6 text-[11px] font-semibold text-(--ba-texto-2)">{rotulo}</span>
              <b>{modelo.titulo(escolhida.praia.nome)[id]}</b> · {modelo.texto[id]}
            </p>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!escolhida || !modelo || travado}
          onClick={publicar}
          className="g-botao g-botao-primario h-11 px-5 text-[15px]"
        >
          Publicar alerta
        </button>
        {publicadoEm && (
          <span className="text-[13px] text-(--ba-texto-2)" role="status">
            Publicado às {publicadoEm.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} em PT, ES e EN.
          </span>
        )}
      </div>
    </Cartao>
  );
}
