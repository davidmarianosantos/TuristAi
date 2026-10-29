"use client";

import type { Alerta, ChamadoSOS, Estabelecimento, SessoesEEntregas } from "@/data/tipos";
import { calcularIndicadores, formatarDuracao, META_ATENDIMENTO_S } from "@/lib/central/fila";
import type { Posto } from "@/lib/central/servicos";
import { calcularAlcance } from "./alcance";
import { Cartao, Vazio } from "./Cartao";

// a Coordenação enxerga todos os chamados de todos os serviços
const POSTO: Posto = "coordenacao";

const pct = (a: number, b: number) => Math.round((a / b) * 100);

function Detalhes({ itens }: { itens: (string | false)[] }) {
  const lista = itens.filter(Boolean) as string[];
  return (
    <ul className="mt-3 flex flex-col gap-1 border-t border-(--ba-linha-2) pt-3 text-[13px] text-(--ba-texto-2)">
      {lista.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}

/** Alcance do último Alerta publicado no escopo: % das Sessões abertas hoje que tiveram Entrega dele. */
export function IndicadorAlcance({
  alerta,
  dados,
  agora,
  nomeEscopo,
  noEscopo,
  nomeMunicipio,
}: {
  alerta: Alerta | null;
  dados: SessoesEEntregas;
  agora: Date;
  nomeEscopo: string;
  /** "na Costa do Cacau" ou "em Itacaré" */
  noEscopo: string;
  nomeMunicipio: (id: string) => string;
}) {
  const r = alerta ? calcularAlcance(alerta, dados, agora) : null;
  return (
    <Cartao
      titulo="Alcance"
      contexto={alerta ? `Último Alerta: ${alerta.titulo.pt}` : "Sessões que receberam o Alerta oficial no idioma delas"}
      className="border-t-4 border-(--ba-azul)"
    >
      {!alerta || !r ? (
        <Vazio titulo={`Nenhum Alerta ativo ${noEscopo}`} detalhe="O Alcance aparece quando a gestão publicar um Alerta." />
      ) : r.abertas === 0 ? (
        <Vazio
          titulo={`Sem Sessões abertas hoje em ${nomeMunicipio(alerta.municipioId)}`}
          detalhe="O número sai das Sessões abertas pelo QR. Nenhuma foi aberta hoje neste município."
        />
      ) : (
        <>
          <p className="text-[48px] font-semibold leading-none tracking-[-0.02em]">
            {pct(r.alcancadas, r.abertas)}
            <span className="ml-0.5 text-[28px] font-medium">%</span>
          </p>
          <p className="mt-2 text-[14px]">
            {r.alcancadas} de {r.abertas} {r.abertas === 1 ? "Sessão aberta" : "Sessões abertas"} hoje em{" "}
            {nomeMunicipio(alerta.municipioId)}
          </p>
          <Detalhes itens={[`PT ${r.porIdioma.pt} · ES ${r.porIdioma.es} · EN ${r.porIdioma.en}`]} />
        </>
      )}
    </Cartao>
  );
}

/** Tempo médio entre o SOS e o atendimento, calculado como na Central (lib/central/fila). */
export function IndicadorSeguranca({ chamados, agoraMs }: { chamados: ChamadoSOS[]; agoraMs: number }) {
  const i = calcularIndicadores(chamados, POSTO, agoraMs);
  const fila = [
    i.aguardando > 0 &&
      `${i.aguardando} aguardando na fila${i.urgentesAguardando ? ` (${i.urgentesAguardando} urgente${i.urgentesAguardando > 1 ? "s" : ""})` : ""}`,
    i.emAtendimento > 0 && `${i.emAtendimento} em atendimento`,
    i.resolvidosIA > 0 && `${i.resolvidosIA} resolvido${i.resolvidosIA > 1 ? "s" : ""} pela IA hoje, sem entrar na fila urgente`,
  ];
  return (
    <Cartao titulo="Segurança" contexto="Tempo médio entre o SOS e o atendimento · Central Integrada, região">
      {i.tempoMedioS == null ? (
        <>
          <Vazio titulo="Nenhum SOS atendido hoje" detalhe="O tempo é medido quando a Central assume um chamado." />
          {fila.some(Boolean) && <Detalhes itens={fila} />}
        </>
      ) : (
        <>
          <p className="text-[40px] font-semibold leading-none tracking-[-0.02em]">
            {formatarDuracao(i.tempoMedioS)}
            <span className="ml-1.5 text-[16px] font-medium text-(--ba-texto-2)">min:s</span>
          </p>
          <p className="mt-2 text-[14px]">
            {i.atendidosHoje} {i.atendidosHoje === 1 ? "chamado atendido" : "chamados atendidos"} hoje ·{" "}
            {i.dentroDaMeta} dentro da meta de {META_ATENDIMENTO_S / 60} min
          </p>
          {fila.some(Boolean) && <Detalhes itens={fila} />}
        </>
      )}
    </Cartao>
  );
}

/** Estabelecimentos com Selo e, entre eles, Cadastur e em formalização (docs/adr/0001). */
export function IndicadorEconomia({
  comSelo,
  nomeEscopo,
  noEscopo,
  implantado,
}: {
  comSelo: Estabelecimento[];
  nomeEscopo: string;
  noEscopo: string;
  implantado: boolean;
}) {
  const comCadastur = comSelo.filter((e) => e.cadastur).length;
  return (
    <Cartao titulo="Economia" contexto={`Estabelecimentos com Selo · ${nomeEscopo}`}>
      {comSelo.length === 0 ? (
        <Vazio
          titulo={implantado ? `Nenhum Estabelecimento com Selo ${noEscopo}` : `Aguardando implantação ${noEscopo}`}
          detalhe={implantado ? undefined : "O município entra numa próxima onda de implantação."}
        />
      ) : (
        <>
          <p className="text-[40px] font-semibold leading-none tracking-[-0.02em]">{comSelo.length}</p>
          <p className="mt-2 text-[14px]">{comSelo.length === 1 ? "Estabelecimento com Selo" : "Estabelecimentos com Selo"}</p>
          <Detalhes
            itens={[
              `${comCadastur} com Cadastur (${pct(comCadastur, comSelo.length)}%)`,
              `${comSelo.length - comCadastur} em formalização: Selo sem Cadastur`,
            ]}
          />
        </>
      )}
    </Cartao>
  );
}
