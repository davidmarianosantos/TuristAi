"use client";

import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRepositorio } from "@/components/turista/RepositorioContext";
import type { Estabelecimento, PraiaHoje } from "@/data/tipos";
import { chamarAgente } from "@/lib/agente/cliente";
import type { MensagemAgente } from "@/lib/agente/tipos";
import { responder } from "@/lib/assistente";
import { useIdioma } from "@/lib/idioma";
import { Folha } from "@/components/ui/Folha";
import { CartaoLugar, Seta } from "./Lugares";
import { ListaPraias } from "./Praias";

type Msg =
  | { id: number; de: "turista"; texto: string }
  | {
      id: number;
      de: "assistente";
      etapas: string[];
      texto: string;
      lugares: Estabelecimento[];
      praias: PraiaHoje[];
      sos: boolean;
      pronto: boolean;
    };
type MsgAgente = Extract<Msg, { de: "assistente" }>;

function useSugestoes() {
  const { t } = useIdioma();
  return [t("sug1"), t("sug2"), t("sug3")];
}

function BotaoEnviar({ rotulo }: { rotulo: string }) {
  return (
    <button
      type="submit"
      aria-label={rotulo}
      className="toque flex size-11 shrink-0 items-center justify-center rounded-full bg-ink text-white"
    >
      <Seta />
    </button>
  );
}

/**
 * Campo do assistente: perguntar abre a folha da conversa.
 * "cartao" é o bloco azul da coluna do celular; "busca" é a barra de pergunta dentro da foto do topo, no desktop.
 * `sufixo` separa os ids quando o campo aparece duas vezes na mesma página.
 */
export function AssistenteCampo({
  aoPerguntar,
  sufixo = "",
  variante = "cartao",
}: {
  aoPerguntar(p?: string): void;
  sufixo?: string;
  variante?: "cartao" | "busca";
}) {
  const { t } = useIdioma();
  const sugestoes = useSugestoes();
  const [texto, setTexto] = useState("");
  const busca = variante === "busca";

  const formulario = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        aoPerguntar(texto.trim() || undefined);
        setTexto("");
      }}
      className={`flex items-center gap-2 rounded-full bg-card py-1 pl-5 pr-1 shadow-2 transition-shadow focus-within:ring-2 focus-within:ring-white/70 ${busca ? "h-14" : "mt-4"}`}
    >
      <label htmlFor={`pergunta${sufixo}`} className="sr-only">
        {t("oQueQuerSaber")}
      </label>
      <input
        id={`pergunta${sufixo}`}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={busca ? `${t("oQueQuerSaber")} ${t("escrevaAqui")}` : t("escrevaAqui")}
        className="h-11 min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-ink-2"
        autoComplete="off"
      />
      <BotaoEnviar rotulo={t("enviar")} />
    </form>
  );

  const chips = (
    <div className={`sem-barra flex gap-2 overflow-x-auto ${busca ? "mt-3 flex-wrap" : "-mx-5 mt-3 px-5"}`}>
      {sugestoes.map((s) => (
        <button
          key={s}
          onClick={() => aoPerguntar(s)}
          className="toque h-10 shrink-0 rounded-full border border-white/25 bg-white/10 px-4 text-[14px] font-semibold text-white backdrop-blur-sm hover:bg-white/20"
        >
          {s}
        </button>
      ))}
    </div>
  );

  if (busca) {
    return (
      <section aria-labelledby={`t-assist${sufixo}`}>
        <h2 id={`t-assist${sufixo}`} className="sr-only">
          {t("oQueQuerSaber")}
        </h2>
        {formulario}
        {chips}
      </section>
    );
  }

  return (
    <section aria-labelledby={`t-assist${sufixo}`} className="px-4 pt-10 lg:px-0">
      <div className="relative overflow-hidden rounded-[28px] bg-field p-5 text-white shadow-2">
        <h2 id={`t-assist${sufixo}`} className="font-display text-[26px] font-normal leading-tight">
          {t("oQueQuerSaber")}
        </h2>
        {formulario}
        {chips}
      </div>
    </section>
  );
}

/** O "raciocínio" do agente, discreto: cada etapa vira uma linha pequena; a última pisca enquanto trabalha. */
export function EtapasAgente({ etapas, pronto }: { etapas: string[]; pronto: boolean }) {
  if (!etapas.length) return null;
  return (
    <ol aria-label="etapas" className="flex flex-col gap-0.5 pl-1 text-[12px] leading-snug text-ink-2">
      {etapas.map((e, i) => {
        const ativa = !pronto && i === etapas.length - 1;
        return (
          <li key={i} className="aparece flex items-center gap-1.5">
            {ativa ? (
              <span aria-hidden className="size-1.5 shrink-0 animate-pulse rounded-full bg-blue" />
            ) : (
              <Check size={12} strokeWidth={3} className="shrink-0 text-ok" aria-hidden />
            )}
            {e}
          </li>
        );
      })}
    </ol>
  );
}

export function FolhaAssistente({
  aberta,
  perguntaInicial,
  municipioId,
  origemId,
  aoFechar,
  aoPedirSOS,
}: {
  aberta: boolean;
  perguntaInicial?: { texto: string; n: number };
  municipioId: string;
  origemId?: string;
  aoFechar(): void;
  aoPedirSOS(): void;
}) {
  const { t, tr, idioma } = useIdioma();
  const repo = useRepositorio();
  const sugestoes = useSugestoes();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [texto, setTexto] = useState("");
  const pensando = msgs.some((m) => m.de === "assistente" && !m.pronto);
  const fim = useRef<HTMLDivElement>(null);
  const n = useRef(0);

  const perguntar = async (p: string) => {
    const idTurista = ++n.current;
    const id = ++n.current;
    const historico: MensagemAgente[] = [
      ...msgs.map((m) => ({ papel: m.de === "turista" ? ("turista" as const) : ("agente" as const), texto: m.texto })),
      { papel: "turista", texto: p },
    ];
    setMsgs((m) => [
      ...m,
      { id: idTurista, de: "turista", texto: p },
      { id, de: "assistente", etapas: [], texto: "", lugares: [], praias: [], sos: false, pronto: false },
    ]);
    const mudar = (f: (m: MsgAgente) => MsgAgente) => setMsgs((lista) => lista.map((m) => (m.id === id && m.de === "assistente" ? f(m) : m)));

    try {
      await chamarAgente(
        "guia",
        { mensagens: historico, idioma, municipioId, alertas: await repo.alertasAtivos(municipioId), origemId },
        (e) => {
          if (e.tipo === "etapa") mudar((m) => ({ ...m, etapas: [...m.etapas, e.texto] }));
          if (e.tipo === "texto") mudar((m) => ({ ...m, texto: m.texto + e.delta }));
          if (e.tipo === "sos") mudar((m) => ({ ...m, sos: true }));
          if (e.tipo === "fim") mudar((m) => ({ ...m, pronto: true }));
          if (e.tipo === "lugares")
            void Promise.all(e.ids.map((x) => repo.estabelecimentoPorId(x))).then((l) =>
              mudar((m) => ({ ...m, lugares: l.filter((x): x is Estabelecimento => !!x) })),
            );
          if (e.tipo === "praias")
            void repo.praiasHoje(municipioId).then((todas) => mudar((m) => ({ ...m, praias: todas.filter((x) => e.ids.includes(x.id)) })));
        },
      );
    } catch {
      // sem rede ou rota fora do ar: as regras locais respondem, a conversa não trava
      const r = await responder(p, { repo, municipioId });
      mudar((m) => ({
        ...m,
        texto: m.texto || tr(r.texto),
        lugares: r.lugares ?? [],
        praias: r.praias ?? [],
        sos: !!r.abrirSOS,
        pronto: true,
      }));
    }
  };

  useEffect(() => {
    if (aberta && perguntaInicial) void perguntar(perguntaInicial.texto);
    // só quando chega uma pergunta nova
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perguntaInicial?.n]);

  useEffect(() => {
    fim.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs]);

  return (
    <Folha aberta={aberta} aoFechar={aoFechar} titulo={t("assistente")} rotuloFechar={t("fechar")} telaCheia>
      <div className="sem-barra min-h-0 flex-auto overflow-y-auto overscroll-contain px-5 pb-4">
        {msgs.length === 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {sugestoes.map((s) => (
              <button key={s} onClick={() => perguntar(s)} className="toque min-h-11 rounded-full bg-surface px-4 text-[14px] font-semibold text-ink">
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="flex flex-col gap-3 pt-2">
          {msgs.map((m) =>
            m.de === "turista" ? (
              <p key={m.id} className="aparece max-w-[82%] self-end rounded-[20px] rounded-br-[6px] bg-ink px-4 py-2.5 text-[15px] text-white">
                {m.texto}
              </p>
            ) : (
              <div key={m.id} className="aparece flex flex-col gap-2.5">
                <EtapasAgente etapas={m.etapas} pronto={m.pronto} />
                {m.texto ? (
                  <p aria-live="polite" className="max-w-[90%] whitespace-pre-line rounded-[20px] rounded-bl-[6px] bg-surface px-4 py-3 text-[15px]">
                    {m.texto}
                  </p>
                ) : (
                  !m.pronto && (
                    <p className="flex w-16 gap-1.5 rounded-[20px] rounded-bl-[6px] bg-surface px-4 py-4" aria-label="…">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="size-2 animate-pulse rounded-full bg-ink-2" style={{ animationDelay: `${i * 160}ms` }} />
                      ))}
                    </p>
                  )
                )}
                {m.sos && (
                  <button onClick={aoPedirSOS} className="toque h-12 self-start rounded-full border-2 border-danger px-6 text-[15px] font-extrabold text-danger-ink">
                    {t("abrirSOS")}
                  </button>
                )}
                {m.lugares.length > 0 && (
                  <div className="sem-barra -mx-5 flex snap-x gap-3 overflow-x-auto scroll-px-5 px-5">
                    {m.lugares.map((l) => (
                      <CartaoLugar key={l.id} lugar={l} />
                    ))}
                  </div>
                )}
                {m.praias.length > 0 && <ListaPraias praias={m.praias} />}
              </div>
            ),
          )}
          <div ref={fim} />
        </div>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!texto.trim() || pensando) return;
          void perguntar(texto.trim());
          setTexto("");
        }}
        className="flex items-center gap-2 border-t border-line px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]"
      >
        <label htmlFor="pergunta-folha" className="sr-only">
          {t("oQueQuerSaber")}
        </label>
        <input
          id="pergunta-folha"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={t("escrevaAqui")}
          className="h-12 min-w-0 flex-1 rounded-full bg-surface px-5 text-[16px] outline-none transition-shadow placeholder:text-ink-2 focus:bg-card focus:ring-2 focus:ring-line"
          autoComplete="off"
        />
        <BotaoEnviar rotulo={t("enviar")} />
      </form>
    </Folha>
  );
}
