"use client";

import { useEffect, useState } from "react";
import type { Alerta, Municipio, Severidade } from "@/data/tipos";

const COR: Record<Severidade, string> = { perigo: "bg-danger", atencao: "bg-warn", info: "bg-blue" };
const hora = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

/** Alertas ativos da região, com encerrar e, em cada linha, o espaço do Alcance. */
export function AlertasAtivos({
  alertas,
  municipios,
  aoEncerrar,
  alcance,
}: {
  alertas: Alerta[];
  municipios: Municipio[];
  aoEncerrar: (id: string) => void;
  alcance?: (a: Alerta) => React.ReactNode;
}) {
  // encerrar pede confirmação na própria linha, por 4 s
  const [confirmando, setConfirmando] = useState<string | null>(null);
  useEffect(() => {
    if (!confirmando) return;
    const id = setTimeout(() => setConfirmando(null), 4000);
    return () => clearTimeout(id);
  }, [confirmando]);

  const nomeMunicipio = (id: string) => municipios.find((m) => m.id === id)?.nome ?? id;

  return (
    <section className="rounded-md bg-card p-5 shadow-1">
      <h2 className="text-[20px] font-extrabold">Alertas ativos</h2>
      {alertas.length === 0 ? (
        <p className="mt-3 text-[15px] text-ink-2">Nenhum Alerta ativo na Costa do Cacau.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {alertas.map((a) => (
            <li key={a.id} className="flex gap-3 rounded-sm border border-line p-3">
              <span className={`w-1.5 shrink-0 rounded-full ${COR[a.severidade]}`} aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[16px] font-bold">{a.titulo.pt}</p>
                    <p className="text-[14px] text-ink-2">
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
                    className={`toque h-10 shrink-0 rounded-sm px-4 text-[14px] font-semibold ${
                      confirmando === a.id ? "bg-danger text-white" : "bg-surface"
                    }`}
                  >
                    {confirmando === a.id ? "Confirmar encerramento" : "Encerrar"}
                  </button>
                </div>
                {alcance && <div className="mt-2">{alcance(a)}</div>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
