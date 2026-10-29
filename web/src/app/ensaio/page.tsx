"use client";

import { useEffect, useState } from "react";
import { repositorio } from "@/data/repositorio";
import { alertaDemoConcha } from "@/data/seed";
import type { ChamadoSOS } from "@/data/tipos";

/** Só para ensaiar a demo num computador. Será substituída por /gestao e /central. */
export default function Ensaio() {
  const [ultimo, setUltimo] = useState<ChamadoSOS | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const repo = typeof window !== "undefined" ? repositorio() : null;

  useEffect(() => {
    if (!repo) return;
    setUltimo(repo.ultimoChamado());
    return repo.aoQualquerChamado((c) => {
      setUltimo(c);
      setLog((l) => [`${new Date().toLocaleTimeString()} · SOS ${c.urgencia}: ${c.mensagemPt}`, ...l]);
    });
  }, [repo]);

  const registrar = (s: string) => setLog((l) => [`${new Date().toLocaleTimeString()} · ${s}`, ...l]);

  const botao = "toque h-14 px-5 text-left text-[16px] font-semibold";

  return (
    <main className="mx-auto flex max-w-[560px] flex-col gap-3 p-6">
      <h1 className="text-[28px] font-extrabold tracking-[-0.03em]">Ensaio da demo</h1>
      <p className="text-[15px] text-ink-2">
        Abra a tela do turista em outra aba deste navegador (<code>/?origem=pousada-mare&amp;lang=es</code>). Os botões
        abaixo chegam lá na hora.
      </p>
      <button
        className={`${botao} bg-danger text-white`}
        onClick={() => {
          repo?.publicarAlerta(alertaDemoConcha());
          registrar("Alerta publicado: bandeira vermelha – Praia da Concha");
        }}
      >
        Publicar bandeira vermelha – Praia da Concha
      </button>
      <button
        className={`${botao} bg-ink text-white disabled:opacity-40`}
        disabled={!ultimo || ultimo.status !== "enviado"}
        onClick={() => {
          if (!ultimo) return;
          repo?.mudarStatusChamado(ultimo.id, "em_atendimento");
          setUltimo({ ...ultimo, status: "em_atendimento" });
          registrar(`Chamado ${ultimo.id} em atendimento`);
        }}
      >
        Último chamado: Em atendimento
      </button>
      <button
        className={`${botao} bg-surface`}
        onClick={() => {
          repo?.limparAlertas();
          registrar("Alertas limpos");
        }}
      >
        Limpar alertas
      </button>
      {ultimo && (
        <section className="mt-4 bg-surface p-4 text-[15px]">
          <h2 className="mb-1 font-extrabold">Último SOS</h2>
          <p>
            <b>{ultimo.mensagemPt}</b> ({ultimo.urgencia}) · status: {ultimo.status}
          </p>
          <p className="text-ink-2">Original: “{ultimo.mensagemOriginal}” [{ultimo.idiomaOriginal}]</p>
          {ultimo.lat && (
            <p className="text-ink-2">
              Local: {ultimo.lat.toFixed(4)}, {ultimo.lng?.toFixed(4)}
            </p>
          )}
        </section>
      )}
      <ol className="mt-2 flex flex-col gap-1 text-[13px] text-ink-2">
        {log.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ol>
    </main>
  );
}
