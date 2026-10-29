/** Uma série (ou pedaço de uma barra empilhada) de um gráfico de barras. */
export type Segmento = { valor: number; cor: string };

export type LinhaBarra = {
  id: string;
  rotulo: string;
  segmentos: Segmento[];
  /** texto na ponta da barra (sempre visível: o gráfico também é a tabela) */
  valor: string;
  /** frase completa mostrada no hover e no foco do teclado */
  dica: string;
};

/**
 * Barras horizontais em divs, nas medidas da skill dataviz: barra de 16 px, ponta arredondada de 4 px
 * e base reta, 2 px de branco entre segmentos, eixo em linha fina. `escala` é o valor da barra cheia.
 * `trilho` pinta o fundo da pista quando a escala é um total real (ex.: Sessões abertas).
 */
export function Barras({ linhas, escala, trilho = false }: { linhas: LinhaBarra[]; escala: number; trilho?: boolean }) {
  return (
    <ul className="flex flex-col gap-1">
      {linhas.map((l) => {
        const visiveis = l.segmentos.filter((s) => s.valor > 0);
        return (
          <li
            key={l.id}
            tabIndex={0}
            aria-label={l.dica}
            className="group relative grid grid-cols-[minmax(0,10.5rem)_minmax(0,1fr)_3.5rem] items-center gap-3 rounded-[4px] px-1 py-1.5 outline-none hover:bg-(--ba-fundo) focus-visible:bg-(--ba-fundo)"
          >
            <span className="truncate text-[13px] text-(--ba-texto)">{l.rotulo}</span>
            <span
              className={`flex h-4 items-stretch gap-[2px] border-l border-(--ba-linha) ${trilho ? "bg-(--ba-azul-trilho)" : ""}`}
              aria-hidden
            >
              {visiveis.map((s, i) => (
                <span
                  key={i}
                  className={i === visiveis.length - 1 ? "rounded-r-[4px]" : ""}
                  style={{ width: `${escala ? (s.valor / escala) * 100 : 0}%`, background: s.cor, minWidth: 3 }}
                />
              ))}
            </span>
            <span className="g-tabular text-right text-[13px] font-medium text-(--ba-texto)">{l.valor}</span>
            <span
              role="tooltip"
              className="pointer-events-none absolute bottom-full left-[10.5rem] z-10 mb-1 hidden w-max max-w-[260px] rounded-[4px] bg-(--ba-texto) px-2.5 py-1.5 text-[12px] text-white shadow-md group-hover:block group-focus-visible:block"
            >
              {l.dica}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Legenda de séries: amostra colorida ao lado de texto em tinta de texto. */
export function Legenda({ itens }: { itens: { nome: string; cor: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-(--ba-texto-2)">
      {itens.map((i) => (
        <li key={i.nome} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[2px]" style={{ background: i.cor }} aria-hidden />
          {i.nome}
        </li>
      ))}
    </ul>
  );
}
