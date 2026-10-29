"use client";

import { useEffect, useState } from "react";
import type { Alerta, Municipio, Severidade } from "@/data/tipos";
import { Cartao, Vazio } from "./Cartao";

// severidade sempre com rótulo, nunca só a cor (bandeira vermelha/amarela do projeto)
const SEVERIDADE: Record<Severidade, { rotulo: string; cor: string }> = {
  perigo: { rotulo: "Perigo", cor: "var(--ba-vermelho)" },
  atencao: { rotulo: "Atenção", cor: "var(--ba-amarelo)" },
  info: { rotulo: "Informativo", cor: "var(--ba-azul)" },
};
const hora = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

/** Alertas ativos da região, com encerrar e, em cada linha, o espaço do Alcance. */
export function AlertasAtivos({
  alertas,
  municipios,
  aoEncerrar,
  alcance,
  noEscopo,
}: {
  alertas: Alerta[];
  /** "na Costa do Cacau" ou "em Itacaré" */
  noEscopo: string;
  municipios: Municipio[];
  aoEncerrar: (id: string) => void;
  alcance?: (a: Alerta) => React.ReactNode;
}) {
  // encerrar pede confirmação na própria linha, por 12 s (tempo de palco para quem apresenta)
  const [confirmando, setConfirmando] = useState<string | null>(null);
  useEffect(() => {
    if (!confirmando) return;
    const id = setTimeout(() => setConfirmando(null), 12_000);
    return () => clearTimeout(id);
  }, [confirmando]);

  const nomeMunicipio = (id: string) => municipios.find((m) => m.id === id)?.nome ?? id;

  return (
    <Cartao
      titulo="Alertas ativos"
      contexto={`${alertas.length} ${alertas.length === 1 ? "Alerta" : "Alertas"} ${noEscopo}, com Alcance e Tempo até chegar`}
    >
      {alertas.length === 0 ? (
        <Vazio titulo={`Nenhum Alerta ativo ${noEscopo}`} detalhe="Ao publicar um Modelo de alerta, ele chega às Sessões abertas em PT, ES e EN." />
      ) : (
        <ul className="flex flex-col gap-3">
          {alertas.map((a) => (
            <li key={a.id} className="flex gap-3 rounded-[4px] border border-(--ba-linha) p-3">
              <span className="w-1 shrink-0 rounded-[2px]" style={{ background: SEVERIDADE[a.severidade].cor }} aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2">
                      <span
                        className="rounded-[4px] border px-1.5 py-px text-[11px] font-semibold uppercase tracking-[0.04em]"
                        style={{ borderColor: SEVERIDADE[a.severidade].cor }}
                      >
                        {SEVERIDADE[a.severidade].rotulo}
                      </span>
                      <span className="text-[15px] font-semibold">{a.titulo.pt}</span>
                    </p>
                    <p className="mt-0.5 text-[13px] text-(--ba-texto-2)">
                      {nomeMunicipio(a.municipioId)} · {a.origem} · publicado às {hora(a.criadoEm)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirmando === a.id) {
                        setConfirmando(null);
                        aoEncerrar(a.id);
                      } else setConfirmando(a.id);
                    }}
                    className={`g-botao shrink-0 ${confirmando === a.id ? "g-botao-perigo" : "g-botao-contorno"}`}
                  >
                    {confirmando === a.id ? "Confirmar encerramento" : "Encerrar"}
                  </button>
                </div>
                {alcance && <div className="mt-2 border-t border-(--ba-linha-2) pt-2">{alcance(a)}</div>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Cartao>
  );
}
