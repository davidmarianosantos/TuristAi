"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { ChamadoSOS, Estabelecimento } from "@/data/tipos";
import { esperaDesde, formatarDuracao, type Fila as FilaPosto } from "@/lib/central/fila";
import { SERVICOS, servicoDe, type Posto } from "@/lib/central/servicos";
import { Espera, IconeServico } from "./visual";

/** Texto curto do chamado: a tradução, ou o texto livre original quando não houve tradução. */
export function resumo(c: ChamadoSOS) {
  if (c.ficha?.resumoPt) return c.ficha.resumoPt;
  return c.mensagemPt.startsWith("[texto original") ? `“${c.mensagemOriginal}”` : c.mensagemPt;
}

const hora = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "");

function Item({
  c,
  agora,
  selecionado,
  novo,
  posto,
  origem,
  aoSelecionar,
}: {
  c: ChamadoSOS;
  agora: number;
  selecionado: boolean;
  novo: boolean;
  posto: Posto;
  origem?: Estabelecimento;
  aoSelecionar(): void;
}) {
  const servico = servicoDe(c);
  const espera = (agora - new Date(esperaDesde(c)).getTime()) / 1000;
  const emAtendimentoHa = c.atendidoEm ? (agora - new Date(c.atendidoEm).getTime()) / 1000 : 0;
  return (
    <li>
      <button
        onClick={aoSelecionar}
        aria-current={selecionado || undefined}
        className={`toque flex w-full items-center gap-3 rounded-[16px] p-3 text-left transition-colors ${
          selecionado ? "bg-c-painel-3 ring-1 ring-c-texto-3" : "hover:bg-c-painel-2"
        } ${novo ? "chegou" : ""}`}
      >
        <IconeServico servico={servico} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            {c.status === "enviado" && c.urgencia === "urgente" && <span aria-label="urgente" className="size-2 shrink-0 rounded-full bg-c-urgente" />}
            <span className="truncate text-[15px] font-semibold">{resumo(c)}</span>
          </span>
          <span className="mt-1 flex items-center gap-1.5 text-[12.5px] text-c-texto-2">
            <span className="rounded-[6px] bg-c-painel-3 px-1.5 py-px text-[11px] font-bold uppercase text-c-texto">{c.idiomaOriginal}</span>
            <span className="truncate">{origem?.nome ?? "Sem hospedagem"}</span>
            {(posto === "coordenacao" || !servico) && (
              <span
                className={`ml-auto shrink-0 rounded-full px-2 py-px text-[11px] font-semibold ${servico ? "" : "border border-dashed border-c-texto-3"}`}
                style={servico ? { background: `${SERVICOS[servico].cor}22`, color: SERVICOS[servico].cor } : undefined}
              >
                {servico ? SERVICOS[servico].nomePt : "A definir"}
              </span>
            )}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          {c.status === "enviado" && <Espera segundos={espera} aguardando />}
          {c.status === "em_atendimento" && <span className="text-[12.5px] tabular-nums text-c-texto-2">há {formatarDuracao(emAtendimentoHa)}</span>}
          {(c.status === "encerrado" || c.status === "resolvido_ia") && (
            <span className="text-[12.5px] tabular-nums text-c-texto-3">{hora(c.encerradoEm ?? c.criadoEm)}</span>
          )}
          {novo && <span className="rounded-full bg-c-urgente/20 px-1.5 text-[11px] font-bold text-c-urgente">novo</span>}
        </span>
      </button>
    </li>
  );
}

function Secao({
  titulo,
  quantos,
  recolhida,
  children,
}: {
  titulo: string;
  quantos: number;
  recolhida?: boolean;
  children: React.ReactNode;
}) {
  const [aberta, setAberta] = useState(!recolhida);
  const id = `fila-${titulo.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <section aria-labelledby={id} className="mt-5 first:mt-0">
      <h2 id={id}>
        <button
          onClick={() => setAberta((x) => !x)}
          aria-expanded={aberta}
          className="flex w-full items-center gap-2 px-2 py-1 text-left text-[13px] font-semibold text-c-texto-2 hover:text-c-texto"
        >
          {titulo}
          <span className="rounded-full bg-c-painel-3 px-2 text-[12px] tabular-nums text-c-texto">{quantos}</span>
          <ChevronDown size={15} className={`ml-auto transition-transform ${aberta ? "" : "-rotate-90"}`} aria-hidden />
        </button>
      </h2>
      {aberta && <ul className="mt-1.5 flex flex-col gap-1">{children}</ul>}
    </section>
  );
}

export function Fila({
  fila,
  agora,
  posto,
  selecionadoId,
  novos,
  origens,
  ocultos = [],
  aoSelecionar,
}: {
  fila: FilaPosto;
  ocultos?: ChamadoSOS[];
  agora: number;
  posto: Posto;
  selecionadoId: string | null;
  novos: Set<string>;
  origens: Record<string, Estabelecimento>;
  aoSelecionar(id: string): void;
}) {
  const item = (c: ChamadoSOS) => (
    <Item
      key={c.id}
      c={c}
      agora={agora}
      posto={posto}
      selecionado={c.id === selecionadoId}
      novo={novos.has(c.id)}
      origem={c.origemId ? origens[c.origemId] : undefined}
      aoSelecionar={() => aoSelecionar(c.id)}
    />
  );
  return (
    <div className="flex flex-col">
      <Secao titulo="Aguardando" quantos={fila.aguardando.length}>
        {fila.aguardando.length ? (
          fila.aguardando.map(item)
        ) : (
          <li className="rounded-[16px] border border-dashed border-c-linha p-4 text-[14px] leading-snug text-c-texto-2">
            Nenhum chamado aguardando. A fila se atualiza sozinha quando um turista confirmar um SOS.
          </li>
        )}
      </Secao>
      {ocultos.length > 0 && (
        <p className="mt-2 px-2 text-[12.5px] leading-snug text-c-texto-3">
          {ocultos.length} chamado{ocultos.length > 1 ? "s" : ""} aberto{ocultos.length > 1 ? "s" : ""} de outros serviços não aparece
          {ocultos.length > 1 ? "m" : ""} neste posto (
          {[...new Set(ocultos.map((c) => servicoDe(c)).filter(Boolean))].map((s) => SERVICOS[s!].nomePt).join(", ")}). A Coordenação vê todos.
        </p>
      )}
      {fila.emAtendimento.length > 0 && (
        <Secao titulo="Em atendimento" quantos={fila.emAtendimento.length}>
          {fila.emAtendimento.map(item)}
        </Secao>
      )}
      {fila.encerrados.length > 0 && (
        <Secao titulo="Encerrados hoje" quantos={fila.encerrados.length} recolhida>
          {fila.encerrados.map(item)}
        </Secao>
      )}
      {(posto === "turismo" || posto === "coordenacao") && fila.resolvidosIA.length > 0 && (
        <Secao titulo="Resolvidos pela IA hoje" quantos={fila.resolvidosIA.length} recolhida>
          {fila.resolvidosIA.map(item)}
        </Secao>
      )}
    </div>
  );
}
