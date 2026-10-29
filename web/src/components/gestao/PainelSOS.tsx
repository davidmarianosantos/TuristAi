"use client";

import type { ChamadoSOS, Estabelecimento, Idioma, StatusChamado } from "@/data/tipos";
import { SERVICOS, servicoDe } from "@/lib/central/servicos";
import { Vazio } from "./Cartao";

const IDIOMA_PT: Record<Idioma, string> = { pt: "Português", es: "Espanhol", en: "Inglês" };

const STATUS: Record<StatusChamado, { rotulo: string; cor: string }> = {
  enviado: { rotulo: "Aguardando", cor: "var(--ba-erro)" },
  em_atendimento: { rotulo: "Em atendimento", cor: "var(--ba-azul)" },
  resolvido_ia: { rotulo: "Resolvido pela IA", cor: "var(--ba-verde)" },
  encerrado: { rotulo: "Encerrado", cor: "rgba(0,0,0,0.38)" },
};

// aguardando primeiro, depois em atendimento, e o que já saiu da fila por último
const PESO: Record<StatusChamado, number> = { enviado: 0, em_atendimento: 1, resolvido_ia: 2, encerrado: 3 };

const ehHoje = (iso: string, agoraMs: number) =>
  new Date(iso).toDateString() === new Date(agoraMs || Date.now()).toDateString();

// Sem chave de LLM, a triagem por regras devolve o texto original prefixado (lib/triagem.ts).
// O prefixo é um sinal para o atendente da Central; aqui ele vira o rótulo do selo, não texto da tela.
const SEM_TRADUCAO = /^\[texto original em \w+, sem tradução automática\]\s*/;

function desde(iso: string, agoraMs: number) {
  const s = Math.max(0, Math.floor((agoraMs - new Date(iso).getTime()) / 1000));
  if (s < 60) return `há ${s} s`;
  const m = Math.floor(s / 60);
  return m < 60 ? `há ${m} min` : `há ${Math.floor(m / 60)} h ${m % 60} min`;
}

/** Um chamado: o que o turista escreveu, em que idioma, e para quem foi. */
function Chamado({ c, origem, agoraMs }: { c: ChamadoSOS; origem?: Estabelecimento; agoraMs: number }) {
  const servico = servicoDe(c);
  const status = STATUS[c.status];
  const estrangeiro = c.idiomaOriginal !== "pt";
  const semTraducao = SEM_TRADUCAO.test(c.mensagemPt);
  const resumo = c.mensagemPt.replace(SEM_TRADUCAO, "");
  // só repete o original quando ele acrescenta algo: traduzido de verdade, e não a mesma frase
  const mostrarOriginal = estrangeiro && !semTraducao && c.mensagemOriginal.trim() !== resumo.trim();
  return (
    <li
      className="rounded-[4px] border border-(--ba-linha-2) bg-(--ba-card) p-3"
      style={{ borderLeft: `4px solid ${status.cor}` }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: status.cor }}>
          {status.rotulo}
        </span>
        <span className="g-tabular shrink-0 text-[12px] text-(--ba-texto-2)">{desde(c.criadoEm, agoraMs)}</span>
      </div>

      <p className="mt-1 text-[14px] font-medium leading-snug">{resumo}</p>

      {mostrarOriginal && (
        <p className="mt-1 text-[13px] italic leading-snug text-(--ba-texto-2)">“{c.mensagemOriginal}”</p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
        <span
          className="rounded-[3px] px-1.5 py-0.5 font-semibold"
          style={{ background: "var(--ba-azul-trilho)", color: "var(--ba-azul)" }}
        >
          {!estrangeiro
            ? "Português"
            : semTraducao
              ? `${IDIOMA_PT[c.idiomaOriginal]} · aguardando tradução`
              : `${IDIOMA_PT[c.idiomaOriginal]} → Português`}
        </span>
        {servico ? (
          <span
            className="rounded-[3px] px-1.5 py-0.5 font-medium text-(--ba-texto)"
            style={{ background: `${SERVICOS[servico].cor}40` }}
          >
            {SERVICOS[servico].nomePt}
            {SERVICOS[servico].numero ? ` · ${SERVICOS[servico].numero}` : ""}
          </span>
        ) : (
          <span className="rounded-[3px] bg-(--ba-fundo) px-1.5 py-0.5 font-medium text-(--ba-texto-2)">
            Serviço a definir
          </span>
        )}
        {c.urgencia === "urgente" && (
          <span className="rounded-[3px] px-1.5 py-0.5 font-semibold text-white" style={{ background: "var(--ba-erro)" }}>
            Urgente
          </span>
        )}
      </div>

      {origem && <p className="mt-2 text-[12px] text-(--ba-texto-2)">Origem do QR: {origem.nome}</p>}
    </li>
  );
}

/**
 * Coluna permanente de SOS: os chamados de hoje na região, ao vivo, no mesmo estado que a Central lê.
 * A Central é quem atende; aqui a gestão só acompanha, por isso não há ação nos cartões.
 */
export function PainelSOS({
  chamados,
  origens,
  agoraMs,
}: {
  chamados: ChamadoSOS[];
  origens: Record<string, Estabelecimento>;
  agoraMs: number;
}) {
  // o relógio do painel nasce em 0 no prerender; aqui já estamos no navegador
  const ms = agoraMs || Date.now();
  const hoje = chamados
    .filter((c) => ehHoje(c.criadoEm, ms))
    .sort((a, b) => PESO[a.status] - PESO[b.status] || b.criadoEm.localeCompare(a.criadoEm));
  // "estrangeiros" é o que o dado sustenta; dizer "traduzidos pela IA" seria falso sem chave de LLM
  const estrangeiros = hoje.filter((c) => c.idiomaOriginal !== "pt").length;

  // o teto deixa a lista rolar por dentro em vez de empurrar os cartões de baixo
  return (
    <section
      aria-label="SOS ao vivo"
      className="g-cartao flex max-h-[620px] min-w-0 flex-col p-5"
    >
      <header>
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-[16px] font-semibold leading-snug">SOS ao vivo</h2>
          <span className="g-tabular shrink-0 text-[22px] font-bold leading-none text-(--ba-azul)">{hoje.length}</span>
        </div>
        <p className="mt-0.5 text-[13px] text-(--ba-texto-2)">
          Chamados de hoje na região · Central Integrada
          {estrangeiros > 0 && ` · ${estrangeiros} em outro idioma`}
        </p>
      </header>

      <div className="mt-4 flex min-h-0 flex-1 flex-col">
        {hoje.length === 0 ? (
          <Vazio
            titulo="Nenhum SOS hoje na região"
            detalhe="Os chamados chegam da tela do turista e do WhatsApp, já traduzidos para o português."
          />
        ) : (
          <ul className="flex min-h-0 flex-col gap-2 overflow-y-auto">
            {hoje.map((c) => (
              <Chamado key={c.id} c={c} origem={c.origemId ? origens[c.origemId] : undefined} agoraMs={ms} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
