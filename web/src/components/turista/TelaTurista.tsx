"use client";

import { useEffect, useRef, useState } from "react";
import { MUNICIPIO_PADRAO } from "@/data/seed";
import type { Alerta, Estabelecimento, Municipio, PraiaHoje, Sessao } from "@/data/tipos";
import { useIdioma } from "@/lib/idioma";
import { distanciaKm } from "@/lib/mapa";
import { Folha } from "@/components/ui/Folha";
import { Alertas } from "./Alertas";
import { AssistenteCampo, FolhaAssistente } from "./Assistente";
import { Cabecalho } from "./Cabecalho";
import { Lugares } from "./Lugares";
import { PainelMapa } from "./PainelMapa";
import { Praias, Titulo } from "./Praias";
import { useRepositorio } from "./RepositorioContext";
import { FolhaSOS, RodapeSOS, Telefones } from "./SOS";
import { BotaoWhatsApp, ConviteWhatsApp, deveMostrarConvite, marcarConviteVisto } from "./WhatsApp";

type Dados = {
  municipio: Municipio;
  origem: Estabelecimento | null;
  sessao: Sessao;
  praias: PraiaHoje[];
  lugares: Estabelecimento[];
};

function Esqueleto() {
  return (
    <div aria-hidden className="flex flex-col gap-3 px-5 pt-6">
      {[64, 22, 56, 56, 56].map((h, i) => (
        <div key={i} className="animate-pulse bg-surface" style={{ height: h, width: i === 1 ? "40%" : "100%" }} />
      ))}
    </div>
  );
}

export function TelaTurista({ origemSlug, forcarConvite = false }: { origemSlug?: string | null; forcarConvite?: boolean }) {
  const repo = useRepositorio();
  const { t, idioma } = useIdioma();

  const [dados, setDados] = useState<Dados | null>(null);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [novos, setNovos] = useState<Set<string>>(new Set());
  const [pilula, setPilula] = useState(false);
  const [assistente, setAssistente] = useState<{ aberta: boolean; pergunta?: { texto: string; n: number } }>({ aberta: false });
  const [sos, setSos] = useState(false);
  const [mapa, setMapa] = useState(false);
  const [convite, setConvite] = useState(false);

  const secaoAlertas = useRef<HTMLElement>(null);
  const alertasVisiveis = useRef(true);
  const conhecidos = useRef<Set<string> | null>(null);

  // carrega tudo uma vez
  useEffect(() => {
    let vivo = true;
    (async () => {
      const origem = origemSlug ? await repo.estabelecimentoPorSlug(origemSlug) : null;
      const municipio = await repo.municipio(origem?.municipioId ?? MUNICIPIO_PADRAO);
      const [sessao, praias, lugares, ativos] = await Promise.all([
        repo.criarSessao({ idioma, canal: "qr", origemId: origem?.id }),
        repo.praiasHoje(municipio.id),
        repo.estabelecimentosComSelo(municipio.id),
        repo.alertasAtivos(municipio.id),
      ]);
      if (!vivo) return;
      conhecidos.current = new Set(ativos.map((a) => a.id));
      setAlertas(ativos);
      // o próprio hotel de origem não entra na vitrine; o resto vem do mais perto ao mais longe
      const de = origem ?? municipio;
      const vitrine = lugares
        .filter((l) => l.id !== origem?.id)
        .sort((a, b) => distanciaKm(de, a) - distanciaKm(de, b));
      setDados({ municipio, origem, sessao, praias, lugares: vitrine });
      // convite para o WhatsApp: logo depois de a tela aparecer, uma vez por sessão
      if (deveMostrarConvite(forcarConvite)) {
        setTimeout(() => {
          if (!vivo) return;
          marcarConviteVisto(); // só conta como visto quando aparece de fato
          setConvite(true);
        }, 700);
      }
    })();
    return () => {
      vivo = false;
    };
    // a sessão é criada com o idioma do primeiro acesso
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repo, origemSlug]);

  // alertas ao vivo
  const municipioId = dados?.municipio.id;
  useEffect(() => {
    if (!municipioId) return;
    return repo.aoMudarAlertas(municipioId, async (lista) => {
      const vistos = conhecidos.current ?? new Set<string>();
      const chegaram = lista.filter((a) => !vistos.has(a.id)).map((a) => a.id);
      conhecidos.current = new Set(lista.map((a) => a.id));
      setAlertas(lista);
      const praias = await repo.praiasHoje(municipioId);
      setDados((d) => (d ? { ...d, praias } : d));
      if (chegaram.length) {
        setNovos(new Set(chegaram));
        if (!alertasVisiveis.current) setPilula(true);
      }
    });
  }, [repo, municipioId]);

  // a pílula só aparece se a seção de alertas estiver fora da tela
  useEffect(() => {
    const el = secaoAlertas.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      alertasVisiveis.current = e.isIntersecting;
      if (e.isIntersecting) setPilula(false);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [dados]);

  const abrirAssistente = (p?: string) =>
    setAssistente((a) => ({ aberta: true, pergunta: p ? { texto: p, n: (a.pergunta?.n ?? 0) + 1 } : a.pergunta }));

  const de = dados ? (dados.origem ?? dados.municipio) : undefined;

  return (
    <div className="min-h-dvh">

      {pilula && (
        <button
          onClick={() => {
            secaoAlertas.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            setPilula(false);
          }}
          className="aparece toque fixed left-1/2 top-[max(12px,env(safe-area-inset-top))] z-30 flex h-11 -translate-x-1/2 items-center gap-2 rounded-full bg-danger px-5 text-[14px] font-extrabold text-white shadow-[0_6px_20px_rgba(200,32,26,0.35)] lg:left-[calc((100%-min(40vw,560px))/2)]"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
            <path d="M6 11V1M1.5 5.5L6 1l4.5 4.5" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
          {t("novoAlerta")}
        </button>
      )}

      <div className="lg:flex lg:items-start">
        <main className="min-w-0 flex-1 pb-[calc(160px+env(safe-area-inset-bottom))]">
          {!dados ? (
            <>
              <div className="min-h-[440px] rounded-b-[32px] bg-field lg:m-4 lg:rounded-[32px]" />
              <Esqueleto />
            </>
          ) : (
            <>
              <Cabecalho
                cidade={dados.municipio.nome}
                origem={dados.origem?.nome}
                praias={dados.praias}
                comFoto={dados.municipio.id === "itacare"}
              />
              <div className="mx-auto max-w-[640px] lg:max-w-[760px] lg:px-10">
                <Alertas ref={secaoAlertas} alertas={alertas} novos={novos} />
                <Praias praias={dados.praias} />
                <AssistenteCampo aoPerguntar={abrirAssistente} />
                <Lugares lugares={dados.lugares} de={de} aoAbrirMapa={() => setMapa(true)} />
                <section aria-labelledby="t-tel" className="pt-10">
                  <Titulo id="t-tel">{t("telefones")}</Titulo>
                  <div className="px-4 lg:px-0">
                    <Telefones />
                  </div>
                </section>
                <p className="px-5 pt-8 text-[12px] text-ink-2 lg:px-0">{t("creditoFoto")}</p>
              </div>
            </>
          )}
        </main>

        {dados && (
          <aside aria-label={t("mapa")} className="sticky top-0 hidden h-svh w-[min(40vw,560px)] shrink-0 py-4 pr-4 lg:block">
            <div className="h-full overflow-hidden rounded-[32px] shadow-2">
              <PainelMapa lugares={dados.lugares} praias={dados.praias} centro={dados.municipio} de={de} />
            </div>
          </aside>
        )}
      </div>

      <BotaoWhatsApp origemSlug={origemSlug} />
      <RodapeSOS aoAbrir={() => setSos(true)} />

      {dados && (
        <>
          <FolhaAssistente
            aberta={assistente.aberta}
            perguntaInicial={assistente.pergunta}
            municipioId={dados.municipio.id}
            aoFechar={() => setAssistente((a) => ({ ...a, aberta: false }))}
            aoPedirSOS={() => {
              setAssistente((a) => ({ ...a, aberta: false }));
              setSos(true);
            }}
          />
          <ConviteWhatsApp aberto={convite} aoFechar={() => setConvite(false)} origemSlug={origemSlug} />
          <FolhaSOS aberta={sos} aoFechar={() => setSos(false)} sessao={dados.sessao} origem={dados.origem} />
          <Folha aberta={mapa} aoFechar={() => setMapa(false)} titulo={t("mapa")} rotuloFechar={t("voltar")} telaCheia>
            {mapa && <PainelMapa lugares={dados.lugares} praias={dados.praias} centro={dados.municipio} de={de} />}
          </Folha>
        </>
      )}
    </div>
  );
}
