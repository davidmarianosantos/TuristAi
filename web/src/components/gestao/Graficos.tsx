"use client";

import type { Alerta, Categoria, ChamadoSOS, Estabelecimento, Idioma, Servico, SessoesEEntregas } from "@/data/tipos";
import { SERVICOS, servicoDe } from "@/lib/central/servicos";
import { calcularAlcance } from "./alcance";
import { Barras, Legenda, type LinhaBarra } from "./Barras";
import { Cartao, Vazio } from "./Cartao";

// série única = slot 1; série dupla = dois passos da rampa do azul (ver gestao.css)
const AZUL = "var(--ba-azul)";
const AZUL_CLARO = "var(--ba-azul-claro)";

const IDIOMAS: { id: Idioma; nome: string }[] = [
  { id: "pt", nome: "Português" },
  { id: "es", nome: "Espanhol" },
  { id: "en", nome: "Inglês" },
];

const SERVICOS_ORDEM: Servico[] = ["policia", "samu", "bombeiros", "turismo"];

const CATEGORIAS: Record<Categoria, string> = {
  hotel: "Hotel",
  pousada: "Pousada",
  receptivo: "Receptivo",
  condutor: "Condutor",
  restaurante: "Restaurante",
  barraca: "Barraca de praia",
  comercio: "Comércio",
  vida_noturna: "Vida noturna",
  transporte: "Transporte",
};

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;
const ehHoje = (iso: string, agora: Date) => new Date(iso).toDateString() === agora.toDateString();

/** Entregas do último Alerta por idioma; a barra cheia é o total de Sessões abertas hoje no município. */
export function GraficoAlcanceIdioma({
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
  const municipio = alerta ? nomeMunicipio(alerta.municipioId) : nomeEscopo;
  return (
    <Cartao
      titulo="Alcance por idioma"
      contexto={r && r.abertas > 0 ? `Barra cheia = ${plural(r.abertas, "Sessão aberta", "Sessões abertas")} hoje em ${municipio}` : "Entregas do último Alerta, pelo idioma da tela"}
    >
      {!r ? (
        <Vazio titulo={`Nenhum Alerta ativo ${noEscopo}`} />
      ) : r.abertas === 0 ? (
        <Vazio titulo={`Sem Sessões abertas hoje em ${municipio}`} />
      ) : (
        <Barras
          trilho
          escala={r.abertas}
          linhas={IDIOMAS.map(({ id, nome }) => ({
            id,
            rotulo: `${nome} (${id.toUpperCase()})`,
            segmentos: [{ valor: r.porIdioma[id], cor: AZUL }],
            valor: `${r.porIdioma[id]} de ${r.abertas}`,
            dica: `${nome}: ${plural(r.porIdioma[id], "Sessão recebeu", "Sessões receberam")} o Alerta em ${id.toUpperCase()}`,
          }))}
        />
      )}
    </Cartao>
  );
}

/** SOS abertos hoje, pelo serviço responsável (a mesma regra de roteamento da Central). */
export function GraficoChamadosServico({
  chamados,
  agora,
  className,
}: {
  chamados: ChamadoSOS[];
  agora: Date;
  /** o painel usa para o cartão fechar junto com a coluna da esquerda */
  className?: string;
}) {
  const hoje = chamados.filter((c) => ehHoje(c.criadoEm, agora));
  const contar = (s: Servico | undefined) => hoje.filter((c) => servicoDe(c) === s).length;
  const linhas: LinhaBarra[] = SERVICOS_ORDEM.map((s) => {
    const n = contar(s);
    const info = SERVICOS[s];
    return {
      id: s,
      rotulo: info.numero ? `${info.nomePt} · ${info.numero}` : info.nomePt,
      segmentos: [{ valor: n, cor: AZUL }],
      valor: String(n),
      dica: `${info.nomePt}: ${plural(n, "chamado", "chamados")} hoje`,
    };
  });
  const aDefinir = contar(undefined);
  if (aDefinir > 0)
    linhas.push({
      id: "a-definir",
      rotulo: "A definir",
      segmentos: [{ valor: aDefinir, cor: AZUL }],
      valor: String(aDefinir),
      dica: `${plural(aDefinir, "chamado", "chamados")} sem serviço definido pela triagem: vão para a triagem humana`,
    });
  return (
    <Cartao
      titulo="Chamados por serviço"
      contexto={`SOS de hoje · ${plural(hoje.length, "chamado", "chamados")} na região`}
      className={className}
    >
      {hoje.length === 0 ? (
        <Vazio titulo="Nenhum SOS hoje na região" detalhe="Os chamados chegam da tela do turista e do WhatsApp à Central Integrada." />
      ) : (
        <Barras linhas={linhas} escala={Math.max(...linhas.map((l) => l.segmentos[0].valor))} />
      )}
    </Cartao>
  );
}

/** Selos por categoria do trade, empilhando com Cadastur e em formalização. */
export function GraficoSelosCategoria({
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
  const porCategoria = new Map<Categoria, { com: number; sem: number }>();
  for (const e of comSelo) {
    const c = porCategoria.get(e.categoria) ?? { com: 0, sem: 0 };
    if (e.cadastur) c.com++;
    else c.sem++;
    porCategoria.set(e.categoria, c);
  }
  const linhas: LinhaBarra[] = [...porCategoria.entries()]
    .sort(([a, x], [b, y]) => y.com + y.sem - (x.com + x.sem) || CATEGORIAS[a].localeCompare(CATEGORIAS[b]))
    .map(([cat, { com, sem }]) => ({
      id: cat,
      rotulo: CATEGORIAS[cat],
      segmentos: [
        { valor: com, cor: AZUL },
        { valor: sem, cor: AZUL_CLARO },
      ],
      valor: String(com + sem),
      dica: `${CATEGORIAS[cat]}: ${com} com Cadastur · ${sem} em formalização`,
    }));
  return (
    <Cartao titulo="Selos por categoria do trade" contexto={`Estabelecimentos com Selo · ${nomeEscopo}`}>
      {linhas.length === 0 ? (
        <Vazio titulo={implantado ? `Nenhum Selo ${noEscopo}` : `Aguardando implantação ${noEscopo}`} />
      ) : (
        <>
          <Barras linhas={linhas} escala={Math.max(...linhas.map((l) => l.segmentos[0].valor + l.segmentos[1].valor))} />
          <div className="mt-3">
            <Legenda
              itens={[
                { nome: "Com Cadastur", cor: AZUL },
                { nome: "Em formalização", cor: AZUL_CLARO },
              ]}
            />
          </div>
        </>
      )}
    </Cartao>
  );
}
