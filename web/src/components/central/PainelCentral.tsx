"use client";

import Image from "next/image";
import { ArrowRightLeft, Volume2, VolumeX, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChamadoSOS, Estabelecimento, PraiaHoje } from "@/data/tipos";
import { assumir } from "@/lib/central/acoes";
import { calcularIndicadores, formatarDuracao, META_ATENDIMENTO_S, montarFila } from "@/lib/central/fila";
import { nomePosto, SERVICOS, servicoDe, visivelNoPosto, type Posto } from "@/lib/central/servicos";
import { useRepositorio } from "@/components/turista/RepositorioContext";
import { Detalhe } from "./Detalhe";
import { Fila, resumo } from "./Fila";
import { destravarSom, somDestravado, tocarAlerta } from "./som";
import { Visao } from "./Visao";
import { IconeServico, useAgora } from "./visual";
import mascote from "../../../public/img/mascote.png";

function Indicador({ rotulo, valor, tom = "normal", dica }: { rotulo: string; valor: string; tom?: "normal" | "alerta" | "ok"; dica?: string }) {
  const cor = tom === "alerta" ? "text-c-urgente" : tom === "ok" ? "text-c-ok" : "text-c-texto";
  return (
    <div className="flex shrink-0 flex-col justify-center rounded-[14px] bg-c-painel-2 px-3.5 py-2" title={dica}>
      <span className={`text-[20px] font-bold tabular-nums leading-tight ${cor}`}>{valor}</span>
      <span className="text-[12px] text-c-texto-2">{rotulo}</span>
    </div>
  );
}

export function PainelCentral({ posto, aoTrocarPosto }: { posto: Posto; aoTrocarPosto(): void }) {
  const repo = useRepositorio();
  const agora = useAgora(1000);

  const [lista, setLista] = useState<ChamadoSOS[]>([]);
  const [carregou, setCarregou] = useState(false);
  const [origens, setOrigens] = useState<Record<string, Estabelecimento>>({});
  const [municipios, setMunicipios] = useState<Record<string, string>>({});
  const [praias, setPraias] = useState<PraiaHoje[]>([]);
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [novos, setNovos] = useState<Set<string>>(new Set());
  const [aviso, setAviso] = useState<ChamadoSOS | null>(null);
  const [som, setSom] = useState(false);
  const conhecidos = useRef<Set<string> | null>(null);
  const somRef = useRef(som);
  somRef.current = som;

  // chamados: carga inicial e tempo real (outras abas, via repositório)
  useEffect(() => {
    let vivo = true;
    setSom(somDestravado());
    repo.chamados().then((l) => {
      if (!vivo) return;
      conhecidos.current = new Set(l.map((c) => c.id));
      setLista(l);
      setCarregou(true);
    });
    const parar = repo.aoMudarChamados((l) => setLista(l));
    return () => {
      vivo = false;
      parar();
    };
  }, [repo]);

  // chamado novo que é deste posto: destaque na fila, aviso e som
  useEffect(() => {
    if (!conhecidos.current) return;
    const chegaram = lista.filter((c) => !conhecidos.current!.has(c.id));
    chegaram.forEach((c) => conhecidos.current!.add(c.id));
    const meus = chegaram.filter((c) => c.status === "enviado" && visivelNoPosto(c, posto));
    if (!meus.length) return;
    setNovos((s) => new Set([...s, ...meus.map((c) => c.id)]));
    setAviso(meus.at(-1)!);
    if (somRef.current) tocarAlerta(meus.some((c) => c.urgencia === "urgente"));
    // o destaque some sozinho; não depende de a lista mudar de novo
    setTimeout(() => {
      setNovos((s) => {
        const n = new Set(s);
        meus.forEach((c) => n.delete(c.id));
        return n;
      });
    }, 8000);
  }, [lista, posto]);

  useEffect(() => {
    if (!aviso) return;
    const id = setTimeout(() => setAviso(null), 7000);
    return () => clearTimeout(id);
  }, [aviso]);

  // hospedagens e municípios citados nos chamados
  useEffect(() => {
    const faltam = [...new Set(lista.map((c) => c.origemId).filter((x): x is string => !!x && !origens[x]))];
    if (!faltam.length) return;
    Promise.all(faltam.map((id) => repo.estabelecimentoPorId(id))).then(async (es) => {
      const novosOrig: Record<string, Estabelecimento> = {};
      const novosMun: Record<string, string> = {};
      for (const e of es) {
        if (!e) continue;
        novosOrig[e.id] = e;
        if (!municipios[e.municipioId]) novosMun[e.municipioId] = (await repo.municipio(e.municipioId)).nome;
      }
      setOrigens((o) => ({ ...o, ...novosOrig }));
      setMunicipios((m) => ({ ...m, ...novosMun }));
    });
  }, [lista, origens, municipios, repo]);

  // praias com a bandeira do dia, para o mapa da operação
  useEffect(() => {
    let vivo = true;
    const carregar = () =>
      Promise.all([repo.praiasHoje("itacare"), repo.praiasHoje("ilheus")]).then(([a, b]) => vivo && setPraias([...a, ...b]));
    void carregar();
    const parar = [repo.aoMudarAlertas("itacare", carregar), repo.aoMudarAlertas("ilheus", carregar)];
    return () => {
      vivo = false;
      parar.forEach((p) => p());
    };
  }, [repo]);

  const dia = new Date(agora).toDateString();
  const fila = useMemo(() => montarFila(lista, posto, Date.now()), [lista, posto, dia]); // eslint-disable-line react-hooks/exhaustive-deps
  const ind = calcularIndicadores(lista, posto, agora);
  // chamados abertos de outros serviços: não aparecem neste posto, mas o atendente sabe que existem
  const ocultos = lista.filter((c) => (c.status === "enviado" || c.status === "em_atendimento") && !visivelNoPosto(c, posto));
  const selecionado = lista.find((c) => c.id === selecionadoId) ?? null;

  // título da aba conta os urgentes esperando: dá para ver de outra aba
  useEffect(() => {
    document.title = ind.urgentesAguardando ? `(${ind.urgentesAguardando}) Central · TuristAí` : "Central · TuristAí";
  }, [ind.urgentesAguardando]);
  useEffect(() => () => void (document.title = "TuristAí · Costa do Cacau"), []);

  // atalhos de teclado do console: ↑ ↓ navegam, A assume, Esc fecha
  useEffect(() => {
    const navegaveis = [...fila.aguardando, ...fila.emAtendimento];
    const teclado = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement;
      if (alvo.closest("input, textarea, select, [contenteditable]") || e.metaKey || e.ctrlKey || e.altKey) return;
      const i = navegaveis.findIndex((c) => c.id === selecionadoId);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (!navegaveis.length) return;
        e.preventDefault();
        const prox = e.key === "ArrowDown" ? Math.min(navegaveis.length - 1, i + 1) : Math.max(0, i === -1 ? 0 : i - 1);
        setSelecionadoId(navegaveis[prox].id);
      } else if (e.key.toLowerCase() === "a" && selecionado?.status === "enviado") {
        e.preventDefault();
        void assumir(repo, selecionado, posto);
      } else if (e.key === "Escape") {
        setSelecionadoId(null);
      }
    };
    window.addEventListener("keydown", teclado);
    return () => window.removeEventListener("keydown", teclado);
  }, [fila, selecionadoId, selecionado, repo, posto]);

  const alternarSom = () => {
    if (!somDestravado()) {
      destravarSom();
      setSom(true);
      tocarAlerta(false);
    } else setSom((s) => !s);
  };

  const indicadores = (
    <>
      <Indicador
        rotulo={ind.urgentesAguardando ? `aguardando, ${ind.urgentesAguardando} urgente${ind.urgentesAguardando > 1 ? "s" : ""}` : "aguardando"}
        valor={String(ind.aguardando)}
        tom={ind.urgentesAguardando ? "alerta" : "normal"}
      />
      <Indicador rotulo="em atendimento" valor={String(ind.emAtendimento)} />
      <Indicador
        rotulo={`até assumir, média de hoje (meta ${META_ATENDIMENTO_S / 60} min)`}
        valor={ind.tempoMedioS == null ? "—" : formatarDuracao(ind.tempoMedioS)}
        tom={ind.tempoMedioS == null ? "normal" : ind.tempoMedioS <= META_ATENDIMENTO_S ? "ok" : "alerta"}
        dica={ind.atendidosHoje ? `${ind.dentroDaMeta} de ${ind.atendidosHoje} assumidos dentro da meta` : undefined}
      />
      {(posto === "coordenacao" || posto === "turismo") && <Indicador rotulo="resolvidos pela IA hoje" valor={String(ind.resolvidosIA)} />}
      <Indicador rotulo="encerrados hoje" valor={String(ind.encerrados)} />
    </>
  );

  return (
    <div className="central fixed inset-0 flex flex-col">
      <header className="border-b border-c-linha bg-c-painel">
        <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
          <Image src={mascote} alt="" aria-hidden priority className="h-9 w-auto shrink-0" />
          {/* no celular o nome sai e o posto ganha o espaço */}
          <div className="min-w-0 max-sm:sr-only">
            <h1 className="truncate text-[17px] font-bold leading-tight">Central Integrada</h1>
            <p className="truncate text-[12.5px] text-c-texto-2">Costa do Cacau</p>
          </div>
          <button
            onClick={aoTrocarPosto}
            title="Trocar de posto"
            className="toque ml-1 flex h-11 min-w-0 items-center gap-2 rounded-full bg-c-painel-2 pl-1.5 pr-3.5 hover:bg-c-painel-3"
          >
            <IconeServico servico={posto} tamanho={32} />
            <span className="truncate text-[14px] font-semibold">
              {nomePosto(posto)}
              {posto !== "coordenacao" && SERVICOS[posto].numero && <span className="ml-1.5 text-c-texto-3">{SERVICOS[posto].numero}</span>}
            </span>
            <ArrowRightLeft size={14} className="shrink-0 text-c-texto-3" aria-hidden />
          </button>

          <div className="ml-auto hidden items-stretch gap-2 xl:flex">{indicadores}</div>

          <span className="ml-auto hidden text-[15px] font-semibold tabular-nums text-c-texto-2 sm:block xl:ml-3">
            {new Date(agora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </span>
          <button
            onClick={alternarSom}
            aria-pressed={som}
            aria-label={som ? "Desligar som de chamado novo" : "Ligar som de chamado novo"}
            title={som ? "Som ligado" : "Ligar som de chamado novo"}
            className={`toque flex size-11 shrink-0 items-center justify-center rounded-full ${som ? "bg-c-painel-2 text-c-texto" : "bg-c-atencao/15 text-c-atencao"} hover:bg-c-painel-3 max-sm:ml-auto`}
          >
            {som ? <Volume2 size={19} /> : <VolumeX size={19} />}
          </button>
        </div>
        <div className="sem-barra flex gap-2 overflow-x-auto px-4 pb-3 xl:hidden">{indicadores}</div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside
          aria-label="Fila de chamados"
          className={`${selecionado ? "hidden lg:flex" : "flex"} min-h-0 w-full flex-col border-c-linha bg-c-fundo lg:w-[400px] lg:shrink-0 lg:border-r`}
        >
          <div className="sem-barra min-h-0 flex-1 overflow-y-auto p-3">
            {carregou ? (
              <Fila
                fila={fila}
                agora={agora}
                posto={posto}
                selecionadoId={selecionadoId}
                novos={novos}
                origens={origens}
                ocultos={ocultos}
                aoSelecionar={(id) => setSelecionadoId((x) => (x === id ? null : id))}
              />
            ) : (
              <div aria-hidden className="flex flex-col gap-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-[68px] animate-pulse rounded-[16px] bg-c-painel" />
                ))}
              </div>
            )}
          </div>
          <p className="hidden border-t border-c-linha px-4 py-2.5 text-[12px] text-c-texto-3 lg:block">
            Teclado: <kbd className="rounded bg-c-painel-3 px-1">↑</kbd> <kbd className="rounded bg-c-painel-3 px-1">↓</kbd> navegam,{" "}
            <kbd className="rounded bg-c-painel-3 px-1">A</kbd> assume, <kbd className="rounded bg-c-painel-3 px-1">Esc</kbd> fecha
          </p>
        </aside>

        <main className={`${selecionado ? "flex" : "hidden lg:flex"} min-w-0 flex-1 flex-col`}>
          {selecionado ? (
            <Detalhe
              key={selecionado.id}
              c={selecionado}
              agora={agora}
              posto={posto}
              origem={selecionado.origemId ? origens[selecionado.origemId] : undefined}
              municipio={selecionado.origemId ? municipios[origens[selecionado.origemId]?.municipioId] : undefined}
              aoVoltar={() => setSelecionadoId(null)}
            />
          ) : (
            <Visao fila={fila} todos={lista} praias={praias} posto={posto} agora={agora} aoSelecionar={setSelecionadoId} />
          )}
        </main>
      </div>

      {aviso && aviso.id !== selecionadoId && (
        <div
          role="alert"
          className="aparece fixed bottom-4 right-4 z-30 flex max-w-[min(420px,calc(100vw-32px))] items-center gap-3 rounded-[18px] border border-c-urgente/40 bg-c-painel-3 p-3 pr-2 shadow-3"
        >
          <IconeServico servico={servicoDe(aviso)} tamanho={40} />
          <button onClick={() => (setSelecionadoId(aviso.id), setAviso(null))} className="min-w-0 flex-1 text-left">
            <span className="block text-[12.5px] font-semibold text-c-urgente">{aviso.urgencia === "urgente" ? "Chamado urgente novo" : "Pedido novo"}</span>
            <span className="block truncate text-[15px] font-bold">{resumo(aviso)}</span>
            <span className="block text-[12.5px] text-c-texto-2">Toque para abrir</span>
          </button>
          <button onClick={() => setAviso(null)} aria-label="Dispensar aviso" className="toque flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-c-painel-2">
            <X size={17} />
          </button>
        </div>
      )}
    </div>
  );
}
