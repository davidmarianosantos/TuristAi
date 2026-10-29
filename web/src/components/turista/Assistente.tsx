"use client";

import { useEffect, useRef, useState } from "react";
import { useRepositorio } from "@/components/turista/RepositorioContext";
import { responder, type Resposta } from "@/lib/assistente";
import { useIdioma } from "@/lib/idioma";
import { Folha } from "@/components/ui/Folha";
import { CartaoLugar, Seta } from "./Lugares";
import { ListaPraias } from "./Praias";

type Msg = { id: number; de: "turista" | "assistente"; texto?: string; resposta?: Resposta };

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

/** Campo na página: tocar ou enviar abre a folha da conversa. */
export function AssistenteCampo({ aoPerguntar }: { aoPerguntar(p?: string): void }) {
  const { t } = useIdioma();
  const sugestoes = useSugestoes();
  const [texto, setTexto] = useState("");
  return (
    <section aria-labelledby="t-assist" className="px-4 pt-10 lg:px-0">
      <div>
        <div className="relative overflow-hidden rounded-[28px] bg-field p-5 text-white shadow-2">
          <h2 id="t-assist" className="font-display text-[26px] font-normal leading-tight">
            {t("oQueQuerSaber")}
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              aoPerguntar(texto.trim() || undefined);
              setTexto("");
            }}
            className="mt-4 flex items-center gap-2 rounded-full bg-card py-1 pl-5 pr-1 shadow-2"
          >
            <label htmlFor="pergunta" className="sr-only">
              {t("oQueQuerSaber")}
            </label>
            <input
              id="pergunta"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder={t("escrevaAqui")}
              className="h-11 min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-ink-2"
              autoComplete="off"
            />
            <BotaoEnviar rotulo={t("enviar")} />
          </form>
          <div className="sem-barra -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
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
        </div>
      </div>
    </section>
  );
}

export function FolhaAssistente({
  aberta,
  perguntaInicial,
  municipioId,
  aoFechar,
  aoPedirSOS,
}: {
  aberta: boolean;
  perguntaInicial?: { texto: string; n: number };
  municipioId: string;
  aoFechar(): void;
  aoPedirSOS(): void;
}) {
  const { t, tr } = useIdioma();
  const repo = useRepositorio();
  const sugestoes = useSugestoes();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [texto, setTexto] = useState("");
  const [pensando, setPensando] = useState(false);
  const fim = useRef<HTMLDivElement>(null);
  const n = useRef(0);

  const perguntar = async (p: string) => {
    setMsgs((m) => [...m, { id: ++n.current, de: "turista", texto: p }]);
    setPensando(true);
    const resposta = await responder(p, { repo, municipioId });
    await new Promise((r) => setTimeout(r, 450)); // dá tempo de ler a pergunta
    setPensando(false);
    setMsgs((m) => [...m, { id: ++n.current, de: "assistente", resposta }]);
  };

  useEffect(() => {
    if (aberta && perguntaInicial) void perguntar(perguntaInicial.texto);
    // só quando chega uma pergunta nova
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perguntaInicial?.n]);

  useEffect(() => {
    fim.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, pensando]);

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
              <div key={m.id} className="aparece flex flex-col gap-3">
                <p className="max-w-[90%] rounded-[20px] rounded-bl-[6px] bg-surface px-4 py-3 text-[15px]">{m.resposta && tr(m.resposta.texto)}</p>
                {m.resposta?.abrirSOS && (
                  <button onClick={aoPedirSOS} className="toque h-12 self-start rounded-full border-2 border-danger px-6 text-[15px] font-extrabold text-danger-ink">
                    {t("abrirSOS")}
                  </button>
                )}
                {m.resposta?.lugares && m.resposta.lugares.length > 0 && (
                  <div className="sem-barra -mx-5 flex snap-x gap-3 overflow-x-auto scroll-px-5 px-5">
                    {m.resposta.lugares.map((l) => (
                      <CartaoLugar key={l.id} lugar={l} />
                    ))}
                  </div>
                )}
                {m.resposta?.praias && <ListaPraias praias={m.resposta.praias} />}
                {m.resposta?.intencao === "nao_entendi" && (
                  <div className="flex flex-wrap gap-2">
                    {sugestoes.map((s) => (
                      <button key={s} onClick={() => perguntar(s)} className="toque min-h-11 rounded-full bg-surface px-4 text-[14px] font-semibold text-ink">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ),
          )}
          {pensando && (
            <p className="flex w-16 gap-1.5 rounded-[20px] rounded-bl-[6px] bg-surface px-4 py-4" aria-label="…">
              {[0, 1, 2].map((i) => (
                <span key={i} className="size-2 animate-pulse rounded-full bg-ink-2" style={{ animationDelay: `${i * 160}ms` }} />
              ))}
            </p>
          )}
          <div ref={fim} />
        </div>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!texto.trim()) return;
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
          className="h-12 min-w-0 flex-1 rounded-full bg-surface px-5 text-[16px] outline-none placeholder:text-ink-2 focus-visible:outline-2 focus-visible:outline-blue"
          autoComplete="off"
        />
        <BotaoEnviar rotulo={t("enviar")} />
      </form>
    </Folha>
  );
}
