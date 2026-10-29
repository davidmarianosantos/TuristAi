"use client";

import { useEffect, useState } from "react";
import { repositorio, type Ensaio, type Repositorio } from "@/data/repositorio";
import type { Alerta, Idioma, Municipio, SessoesEEntregas, Severidade } from "@/data/tipos";
import { calcularAlcance, formatarTempo } from "./alcance";
import { AlertasAtivos } from "./AlertasAtivos";
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
      <p className="text-[14px] text-ink-2">
        Nenhuma Sessão aberta hoje em {municipio} · {tempo}
      </p>
    );
  const idiomas = IDIOMAS.filter((i) => r.porIdioma[i] > 0).map((i) => `${i.toUpperCase()} ${r.porIdioma[i]}`);
  return (
    <div className="text-[14px]">
      <p>
        <b>
          Alcance: {r.alcancadas} de {r.abertas} Sessões abertas hoje ({Math.round((r.alcancadas / r.abertas) * 100)}%)
        </b>
        {idiomas.length > 0 && <span className="text-ink-2"> · {idiomas.join(" · ")}</span>}
      </p>
      <p className="text-ink-2">{tempo}</p>
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
  const [dados, setDados] = useState<SessoesEEntregas>({ sessoes: [], entregas: [] });
  const [agora, setAgora] = useState(() => new Date());

  // Sessões e Entregas ao vivo; o relógio anda a cada 30 s para a virada do dia
  useEffect(() => {
    if (!repo) return;
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
      if (!vivo) return;
      setMunicipios(lista);
      await carregar();
      if (vivo) parar = lista.map((m) => repo.aoMudarAlertas(m.id, () => void carregar()));
    })();
    return () => {
      vivo = false;
      parar.forEach((f) => f());
    };
  }, [repo]);

  if (!repo) return <div className="painel-gestao min-h-dvh bg-ground" aria-busy />;

  return (
    <main className="painel-gestao mx-auto flex min-h-dvh max-w-[960px] flex-col gap-5 bg-ground px-4 py-6">
      <header>
        <h1 className="text-[28px] font-extrabold tracking-[-0.03em]">Painel da gestão</h1>
        <p className="text-[15px] text-ink-2">Costa do Cacau</p>
      </header>
      <PublicarAlerta praias={praias} aoPublicar={(a) => repo.publicarAlerta(a)} />
      <AlertasAtivos
        alertas={alertas}
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
    </main>
  );
}
