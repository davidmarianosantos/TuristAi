"use client";

import { useEffect, useState } from "react";
import { repositorio } from "@/data/repositorio";
import { alertaDemoConcha } from "@/data/seed";
import type { ChamadoSOS, Idioma, TipoSOS } from "@/data/tipos";
import { triarSOS } from "@/lib/triagem";

// Chamados de exemplo para encher a Central na apresentação: um de cada serviço,
// um resolvido pela IA e um que a triagem não soube classificar (vai para triagem humana).
const EXEMPLOS: { tipo: TipoSOS; texto: string; idioma: Idioma; origem: string; lat?: number; lng?: number }[] = [
  { tipo: "roubo", texto: "Me robaron", idioma: "es", origem: "pousada-mare", lat: -14.2833, lng: -38.9912 },
  { tipo: "outro", texto: "My friend is drowning near the rocks", idioma: "en", origem: "pousada-mare", lat: -14.2958, lng: -38.9925 },
  { tipo: "medica", texto: "Emergência médica", idioma: "pt", origem: "hotel-orla", lat: -14.7975, lng: -39.0382 },
  { tipo: "outro", texto: "Hay un hombre que nos sigue desde la playa", idioma: "es", origem: "hotel-orla", lat: -14.7969, lng: -39.0371 },
  { tipo: "documentos", texto: "Perdí mis documentos", idioma: "es", origem: "pousada-mare" },
  { tipo: "outro", texto: "Socorro, preciso de ajuda", idioma: "pt", origem: "pousada-mare", lat: -14.2801, lng: -38.9969 },
];

/** Só para ensaiar a demo num computador: prepara e reinicia a apresentação. */
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

  const gerarExemplos = async () => {
    if (!repo) return;
    for (const ex of EXEMPLOS) {
      const tri = triarSOS(ex.tipo, ex.tipo === "outro" ? ex.texto : null, ex.idioma);
      const origem = await repo.estabelecimentoPorSlug(ex.origem);
      await repo.enviarSOS({
        sessaoId: `demo-${Math.random().toString(36).slice(2, 8)}`,
        tipo: ex.tipo,
        urgencia: tri.urgencia,
        mensagemOriginal: ex.texto,
        mensagemPt: tri.mensagemPt,
        idiomaOriginal: ex.idioma,
        origemId: origem?.id,
        servico: tri.servico,
        motivoTriagem: tri.motivo,
        ...(ex.lat != null ? { lat: ex.lat, lng: ex.lng } : {}),
      });
      await new Promise((r) => setTimeout(r, 1200)); // chegam um a um, como na vida real
    }
    registrar(`${EXEMPLOS.length} chamados de exemplo enviados à Central`);
  };

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

      <h2 className="mt-6 text-[20px] font-extrabold">Central Integrada</h2>
      <p className="text-[15px] text-ink-2">
        Abra a <a className="font-semibold text-blue underline" href="/central" target="_blank">Central</a> em outra aba e escolha um posto.
      </p>
      <button className={`${botao} bg-field text-white`} onClick={() => void gerarExemplos()}>
        Gerar chamados de exemplo
      </button>
      <button
        className={`${botao} bg-surface`}
        onClick={() => {
          repo?.limparChamados();
          setUltimo(null);
          registrar("Chamados limpos");
        }}
      >
        Limpar chamados
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
