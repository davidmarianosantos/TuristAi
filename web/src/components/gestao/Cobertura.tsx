"use client";

import type { Municipio } from "@/data/tipos";
import { Cartao } from "./Cartao";

export type SituacaoMunicipio = { municipio: Municipio; praias: number; selos: number; alertas: number };

// recorte da Costa do Cacau; longitude corrigida por cos(15°) para o mapa não esticar
const LAT = { norte: -14.12, sul: -15.82 };
const LNG = { oeste: -39.86, leste: -38.7 };
const PX_GRAU = 300;
const K = Math.cos((15 * Math.PI) / 180);
const LARGURA = (LNG.leste - LNG.oeste) * K * PX_GRAU;
const ALTURA = (LAT.norte - LAT.sul) * PX_GRAU;
const x = (lng: number) => (lng - LNG.oeste) * K * PX_GRAU;
const y = (lat: number) => (LAT.norte - lat) * PX_GRAU;

const ativo = (s: SituacaoMunicipio) => s.praias > 0 || s.selos > 0;
const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/**
 * Os 8 municípios nas coordenadas da sede, com quem já está implantado (tem dados no repositório)
 * e quem aguarda a próxima onda. Clicar escolhe o município no seletor do cabeçalho.
 */
export function Cobertura({
  situacoes,
  escopo,
  aoEscolher,
}: {
  situacoes: SituacaoMunicipio[];
  escopo: string;
  aoEscolher: (id: string) => void;
}) {
  const ativos = situacoes.filter(ativo);
  const aguardando = situacoes.filter((s) => !ativo(s));
  const linhasLat = [-14.5, -15, -15.5];
  const linhasLng = [-39.5, -39];

  return (
    <Cartao
      titulo="Cobertura regional"
      contexto={`${ativos.length} de ${situacoes.length} municípios implantados · implantação em ondas`}
    >
      {/* em tela larga as duas listas ficam lado a lado do mapa: esticar uma só deixava
          o nome do município e os números separados por um vão de mil pixels */}
      <div className="grid gap-6 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)_minmax(0,1fr)]">
        <figure className="m-0">
          <svg
            viewBox={`0 0 ${LARGURA} ${ALTURA}`}
            className="h-auto w-full max-w-[320px]"
            role="img"
            aria-label={`Mapa da Costa do Cacau: ${ativos.map((s) => s.municipio.nome).join(" e ")} implantados; ${aguardando.length} aguardando implantação`}
          >
            <rect width={LARGURA} height={ALTURA} rx="4" fill="var(--ba-fundo)" />
            {linhasLat.map((l) => (
              <g key={l}>
                <line x1="0" x2={LARGURA} y1={y(l)} y2={y(l)} stroke="var(--ba-linha)" strokeWidth="1" />
                <text x="4" y={y(l) - 4} fontSize="9" fill="var(--ba-texto-2)">
                  {Math.abs(l).toFixed(1).replace(".", ",")}° S
                </text>
              </g>
            ))}
            {linhasLng.map((l) => (
              <g key={l}>
                <line y1="0" y2={ALTURA} x1={x(l)} x2={x(l)} stroke="var(--ba-linha)" strokeWidth="1" />
                <text x={x(l) + 4} y={ALTURA - 6} fontSize="9" fill="var(--ba-texto-2)">
                  {Math.abs(l).toFixed(1).replace(".", ",")}° O
                </text>
              </g>
            ))}
            <text x={LARGURA - 8} y="18" fontSize="11" fontWeight="600" textAnchor="end" fill="var(--ba-texto-2)">
              N ↑
            </text>
            {situacoes.map((s) => {
              const on = ativo(s);
              const escolhido = escopo === s.municipio.id;
              const cx = x(s.municipio.lng);
              const cy = y(s.municipio.lat);
              // perto da borda leste o rótulo vai para a esquerda do ponto, para não ser cortado
              const aEsquerda = cx > LARGURA - 80;
              return (
                <g
                  key={s.municipio.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${s.municipio.nome}: ${on ? "implantado" : "aguardando implantação"}`}
                  aria-pressed={escolhido}
                  onClick={() => aoEscolher(s.municipio.id)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), aoEscolher(s.municipio.id))}
                  className="cursor-pointer outline-none"
                >
                  {/* alvo de clique maior que o ponto */}
                  <circle cx={cx} cy={cy} r="14" fill="transparent" />
                  {escolhido && <circle cx={cx} cy={cy} r="11" fill="none" stroke="var(--ba-azul)" strokeWidth="2" />}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={on ? 6 : 5}
                    fill={on ? "var(--ba-azul)" : "var(--ba-card)"}
                    stroke={on ? "var(--ba-card)" : "var(--ba-texto-2)"}
                    strokeWidth="2"
                  />
                  <text
                    x={aEsquerda ? cx - 10 : cx + 10}
                    y={cy + 4}
                    textAnchor={aEsquerda ? "end" : "start"}
                    fontSize="12"
                    fontWeight={on ? 600 : 400}
                    fill={on ? "var(--ba-texto)" : "var(--ba-texto-2)"}
                    paintOrder="stroke"
                    stroke="var(--ba-fundo)"
                    strokeWidth="3"
                  >
                    {s.municipio.nome}
                  </text>
                </g>
              );
            })}
          </svg>
          <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-(--ba-texto-2)">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-(--ba-azul)" aria-hidden /> Implantado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full border-2 border-(--ba-texto-2) bg-white" aria-hidden /> Aguardando
              implantação
            </span>
            <span>Pontos na coordenada da sede municipal</span>
          </figcaption>
        </figure>

        <div className="flex min-w-0 flex-col gap-5 xl:contents">
          <div className="min-w-0">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-(--ba-texto-2)">
              Implantados · {ativos.length}
            </h3>
            <ul className="mt-2 divide-y divide-(--ba-linha-2) border-y border-(--ba-linha-2)">
              {ativos.map((s) => (
                <li key={s.municipio.id}>
                  <button
                    type="button"
                    onClick={() => aoEscolher(s.municipio.id)}
                    aria-pressed={escopo === s.municipio.id}
                    className={`flex w-full flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-2 py-2.5 text-left hover:bg-(--ba-fundo) ${
                      escopo === s.municipio.id ? "bg-(--ba-azul-trilho)" : ""
                    }`}
                  >
                    <span className="flex items-center gap-2 text-[15px] font-medium">
                      <span className="size-2.5 rounded-full bg-(--ba-azul)" aria-hidden />
                      {s.municipio.nome}
                    </span>
                    <span className="g-tabular text-[13px] text-(--ba-texto-2)">
                      {plural(s.praias, "praia", "praias")} · {plural(s.selos, "Selo", "Selos")} ·{" "}
                      {plural(s.alertas, "Alerta ativo", "Alertas ativos")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="min-w-0">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-(--ba-texto-2)">
              Aguardando implantação · {aguardando.length}
            </h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {aguardando.map((s) => (
                <li key={s.municipio.id}>
                  <button
                    type="button"
                    onClick={() => aoEscolher(s.municipio.id)}
                    aria-pressed={escopo === s.municipio.id}
                    className={`h-8 rounded-[4px] border px-3 text-[13px] hover:bg-(--ba-fundo) ${
                      escopo === s.municipio.id
                        ? "border-(--ba-azul) bg-(--ba-azul-trilho) text-(--ba-texto)"
                        : "border-(--ba-linha) text-(--ba-texto-2)"
                    }`}
                  >
                    {s.municipio.nome}
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[13px] text-(--ba-texto-2)">
              Sem praias nem Estabelecimentos cadastrados ainda. Entram nas próximas ondas do contrato regional.
            </p>
          </div>
        </div>
      </div>
    </Cartao>
  );
}
