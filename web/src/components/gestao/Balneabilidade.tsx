"use client";

import type { Situacao } from "@/data/tipos";
import { Cartao, Vazio } from "./Cartao";
import type { PraiaDaRegiao } from "./PublicarAlerta";

const SITUACAO: Record<Situacao, { rotulo: string; cor: string }> = {
  propria: { rotulo: "Própria", cor: "var(--ba-verde)" },
  precaucao: { rotulo: "Precaução", cor: "var(--ba-amarelo)" },
  impropria: { rotulo: "Imprópria", cor: "var(--ba-vermelho)" },
  sem_dados: { rotulo: "Sem dados", cor: "rgba(0,0,0,0.38)" },
};

// pior primeiro: é o que a gestão precisa ver sem rolar
const PESO: Record<Situacao, number> = { impropria: 0, precaucao: 1, propria: 2, sem_dados: 3 };

/**
 * Boletim do dia, praia a praia, com a fonte de cada leitura (CLAUDE.md §5).
 * Só lê o repositório: é o mesmo dado que o turista vê no cartão da praia.
 */
export function Balneabilidade({ praias, nomeEscopo }: { praias: PraiaDaRegiao[]; nomeEscopo: string }) {
  const lista = [...praias].sort(
    (a, b) =>
      PESO[a.praia.condicao.situacao] - PESO[b.praia.condicao.situacao] ||
      a.praia.nome.localeCompare(b.praia.nome, "pt-BR"),
  );
  const fontes = [...new Set(lista.map((p) => p.praia.condicao.fonte))];
  const impropriasOuAtencao = lista.filter((p) => p.praia.condicao.situacao !== "propria").length;

  return (
    <Cartao
      titulo="Balneabilidade hoje"
      contexto={
        lista.length
          ? `${lista.length} praias monitoradas · ${nomeEscopo}${fontes.length ? ` · ${fontes.join(" e ")}` : ""}`
          : `Praias monitoradas · ${nomeEscopo}`
      }
      lateral={
        impropriasOuAtencao > 0 && (
          <span className="g-tabular text-[22px] font-bold leading-none text-(--ba-vermelho)">
            {impropriasOuAtencao}
          </span>
        )
      }
    >
      {lista.length === 0 ? (
        <Vazio
          titulo="Nenhuma praia monitorada"
          detalhe="As leituras chegam das fontes oficiais quando o município entra em operação."
        />
      ) : (
        <ul className="flex flex-col">
          {lista.map(({ municipio, praia }, i) => {
            const s = SITUACAO[praia.condicao.situacao];
            return (
              <li
                key={praia.id}
                className={`flex items-start gap-2.5 py-2 ${i > 0 ? "border-t border-(--ba-linha-2)" : ""}`}
              >
                <span
                  aria-hidden
                  className="mt-1 size-2.5 shrink-0 rounded-full"
                  style={{ background: s.cor }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[14px] font-medium">{praia.nome}</span>
                    <span className="shrink-0 text-[12px] font-semibold" style={{ color: s.cor }}>
                      {s.rotulo}
                    </span>
                  </div>
                  <p className="text-[12px] leading-snug text-(--ba-texto-2)">
                    {municipio.nome} · {praia.condicao.detalhe.pt} · {praia.condicao.fonte}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Cartao>
  );
}
