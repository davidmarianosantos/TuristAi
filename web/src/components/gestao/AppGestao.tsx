"use client";

import { useEffect, useState } from "react";
import { repositorio, type Ensaio, type Repositorio } from "@/data/repositorio";
import type { Alerta, ChamadoSOS, Estabelecimento, Idioma, Municipio, SessoesEEntregas, Severidade } from "@/data/tipos";
import { calcularAlcance, formatarTempo } from "./alcance";
import { AlertasAtivos } from "./AlertasAtivos";
import { Cabecalho, REGIAO } from "./Cabecalho";
import { Cobertura } from "./Cobertura";
import { GraficoAlcanceIdioma, GraficoChamadosServico, GraficoSelosCategoria } from "./Graficos";
import { IndicadorAlcance, IndicadorEconomia, IndicadorSeguranca } from "./Indicadores";
import { PainelSOS } from "./PainelSOS";
import { PublicarAlerta, type PraiaDaRegiao } from "./PublicarAlerta";

type Repo = Repositorio & Ensaio;

// mais grave primeiro, como na tela do turista
const PESO: Record<Severidade, number> = { perigo: 0, atencao: 1, info: 2 };
const IDIOMAS: Idioma[] = ["pt", "es", "en"];

function LinhaAlcance({ alerta, dados, agora, municipio }: { alerta: Alerta; dados: SessoesEEntregas; agora: Date; municipio: string }) {
  const r = calcularAlcance(alerta, dados, agora);
  const tempo = `Tempo até chegar: ${
    r.primeiraMs == null ? "—" : `primeira ${formatarTempo(r.primeiraMs)} · mediana ${formatarTempo(r.medianaMs)}`
  }`;
  if (r.abertas === 0)
    return (
      <p className="text-[13px] text-(--ba-texto-2)">
        Nenhuma Sessão aberta hoje em {municipio} · {tempo}
      </p>
    );
  const idiomas = IDIOMAS.filter((i) => r.porIdioma[i] > 0).map((i) => `${i.toUpperCase()} ${r.porIdioma[i]}`);
  return (
    <div className="text-[13px]">
      <p>
        <b className="font-semibold">
          Alcance: {r.alcancadas} de {r.abertas} Sessões abertas hoje ({Math.round((r.alcancadas / r.abertas) * 100)}%)
        </b>
        {idiomas.length > 0 && <span className="text-(--ba-texto-2)"> · {idiomas.join(" · ")}</span>}
      </p>
      <p className="text-(--ba-texto-2)">{tempo}</p>
    </div>
  );
}

/** Painel regional da gestão: publica Alertas e acompanha o Alcance deles. */
export function AppGestao() {
  // o mock lê o localStorage: só nasce no navegador
  const [repo, setRepo] = useState<Repo | null>(null);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [praias, setPraias] = useState<PraiaDaRegiao[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [comSelo, setComSelo] = useState<Estabelecimento[]>([]);
  const [dados, setDados] = useState<SessoesEEntregas>({ sessoes: [], entregas: [] });
  // valor fixo no prerender (o Next não aceita new Date() aqui); a hora certa chega no efeito abaixo
  const [agora, setAgora] = useState(() => new Date(0));
  // relógio do cabeçalho: null no prerender, depois anda a cada 15 s
  const [relogio, setRelogio] = useState<Date | null>(null);
  const [escopo, setEscopo] = useState(REGIAO);
  const [chamados, setChamados] = useState<ChamadoSOS[]>([]);

  const [origens, setOrigens] = useState<Record<string, Estabelecimento>>({});

  // SOS da região inteira, ao vivo (o mesmo estado que a Central lê)
  useEffect(() => {
    if (!repo) return;
    void repo.chamados().then(setChamados);
    return repo.aoMudarChamados(setChamados);
  }, [repo]);

  // nome do estabelecimento que gerou o QR de cada chamado; busca só os ids que ainda faltam
  useEffect(() => {
    if (!repo) return;
    const faltam = [...new Set(chamados.map((c) => c.origemId).filter((id): id is string => !!id && !origens[id]))];
    if (!faltam.length) return;
    let vivo = true;
    void Promise.all(faltam.map((id) => repo.estabelecimentoPorId(id))).then((lista) => {
      if (!vivo) return;
      const novos = Object.fromEntries(lista.filter((e): e is Estabelecimento => !!e).map((e) => [e.id, e]));
      if (Object.keys(novos).length) setOrigens((a) => ({ ...a, ...novos }));
    });
    return () => {
      vivo = false;
    };
  }, [repo, chamados, origens]);

  useEffect(() => {
    setRelogio(new Date());
    const id = setInterval(() => setRelogio(new Date()), 15_000);
    return () => clearInterval(id);
  }, []);

  // Sessões e Entregas ao vivo; o relógio anda a cada 30 s para a virada do dia
  useEffect(() => {
    if (!repo) return;
    setAgora(new Date());
    void repo.sessoesEEntregas().then(setDados);
    const parar = repo.aoMudarSessoesEEntregas((d) => {
      setDados(d);
      setAgora(new Date());
    });
    const relogio = setInterval(() => setAgora(new Date()), 30_000);
    return () => {
      parar();
      clearInterval(relogio);
    };
  }, [repo]);

  useEffect(() => {
    const r = repositorio();
    setRepo(r);
    // para os passos de verificação pelo console (não há framework de teste)
    if (process.env.NODE_ENV === "development") (window as unknown as { repoGestao: Repo }).repoGestao = r;
  }, []);

  useEffect(() => {
    if (!repo) return;
    let vivo = true;
    let parar: (() => void)[] = [];
    (async () => {
      const lista = await repo.municipios();
      // praias e Alertas ativos da região inteira, recarregados a cada aviso de qualquer município
      const carregar = async () => {
        const [porMunicipio, ativos] = await Promise.all([
          Promise.all(
            lista.map(async (municipio) => (await repo.praiasHoje(municipio.id)).map((praia) => ({ municipio, praia }))),
          ),
          Promise.all(lista.map((m) => repo.alertasAtivos(m.id))),
        ]);
        if (!vivo) return;
        setPraias(porMunicipio.flat());
        setAlertas(
          ativos.flat().sort((a, b) => PESO[a.severidade] - PESO[b.severidade] || b.criadoEm.localeCompare(a.criadoEm)),
        );
      };
      const comSelo = (await Promise.all(lista.map((m) => repo.estabelecimentosComSelo(m.id)))).flat();
      if (!vivo) return;
      setMunicipios(lista);
      setComSelo(comSelo);
      await carregar();
      if (vivo) parar = lista.map((m) => repo.aoMudarAlertas(m.id, () => void carregar()));
    })();
    return () => {
      vivo = false;
      parar.forEach((f) => f());
    };
  }, [repo]);

  if (!repo) return <div className="min-h-dvh" aria-busy />;

  // o seletor do cabeçalho filtra Alertas e trade; a Central é regional e não muda com ele
  const naRegiao = escopo === REGIAO;
  const nomeMunicipio = (id: string) => municipios.find((m) => m.id === id)?.nome ?? id;
  const nomeEscopo = naRegiao ? "Costa do Cacau" : nomeMunicipio(escopo);
  const noEscopo = naRegiao ? "na Costa do Cacau" : `em ${nomeEscopo}`;
  const alertasEscopo = naRegiao ? alertas : alertas.filter((a) => a.municipioId === escopo);
  const ultimoAlerta = alertasEscopo.reduce<Alerta | null>((u, a) => (!u || a.criadoEm > u.criadoEm ? a : u), null);
  const seloEscopo = naRegiao ? comSelo : comSelo.filter((e) => e.municipioId === escopo);
  // implantado = já tem dados no repositório (praias do dia ou Estabelecimentos com Selo)
  const implantado = naRegiao || praias.some((p) => p.municipio.id === escopo) || seloEscopo.length > 0;
  const agoraMs = relogio?.getTime() ?? 0;
  const situacoes = municipios.map((municipio) => ({
    municipio,
    praias: praias.filter((p) => p.municipio.id === municipio.id).length,
    selos: comSelo.filter((e) => e.municipioId === municipio.id).length,
    alertas: alertas.filter((a) => a.municipioId === municipio.id).length,
  }));

  return (
    <>
      <Cabecalho
        agora={relogio}
        municipios={municipios}
        escopo={escopo}
        aoMudarEscopo={setEscopo}
      />
      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6">
        {/* o SOS fica numa coluna própria, sempre visível: é o que a banca precisa ver acontecendo */}
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
          <div className="grid min-w-0 gap-4">
            <section aria-label="Indicadores" className="grid items-stretch gap-4 lg:grid-cols-3">
              <IndicadorAlcance
                alerta={ultimoAlerta}
                dados={dados}
                agora={agora}
                nomeEscopo={nomeEscopo}
                noEscopo={noEscopo}
                nomeMunicipio={nomeMunicipio}
              />
              <IndicadorSeguranca chamados={chamados} agoraMs={agoraMs} />
              <IndicadorEconomia
                comSelo={seloEscopo}
                nomeEscopo={nomeEscopo}
                noEscopo={noEscopo}
                implantado={implantado}
              />
            </section>
            <section aria-label="Operação" className="grid items-start gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              <PublicarAlerta praias={praias} aoPublicar={(a) => repo.publicarAlerta(a)} />
              <AlertasAtivos
                alertas={alertasEscopo}
                noEscopo={noEscopo}
                municipios={municipios}
                aoEncerrar={(id) => void repo.encerrarAlerta(id)}
                alcance={(a) => (
                  <LinhaAlcance
                    alerta={a}
                    dados={dados}
                    agora={agora}
                    municipio={municipios.find((m) => m.id === a.municipioId)?.nome ?? a.municipioId}
                  />
                )}
              />
            </section>
            <section aria-label="Gráficos" className="grid items-stretch gap-4 lg:grid-cols-3">
              <GraficoAlcanceIdioma
                alerta={ultimoAlerta}
                dados={dados}
                agora={agora}
                nomeEscopo={nomeEscopo}
                noEscopo={noEscopo}
                nomeMunicipio={nomeMunicipio}
              />
              <GraficoChamadosServico chamados={chamados} agora={relogio ?? agora} />
              <GraficoSelosCategoria
                comSelo={seloEscopo}
                nomeEscopo={nomeEscopo}
                noEscopo={noEscopo}
                implantado={implantado}
              />
            </section>
              <Cobertura situacoes={situacoes} escopo={escopo} aoEscolher={setEscopo} />
          </div>
          <PainelSOS chamados={chamados} origens={origens} agoraMs={agoraMs} />
        </div>
        <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-(--ba-linha) pt-4 text-[12px] text-(--ba-texto-2)">
          <p>
            Todos os números vêm do estado ao vivo da plataforma. Onde ainda não há dado, o painel mostra o vazio.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <span>Apaga as Sessões e Entregas gravadas neste navegador.</span>
            <button type="button" onClick={() => repo.limparSessoes()} className="g-botao g-botao-contorno h-8 px-3 text-[13px]">
              Zerar demo
            </button>
          </div>
        </footer>
      </main>
    </>
  );
}
