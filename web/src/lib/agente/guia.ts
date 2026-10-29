// Agente guia turístico: conversa em PT/ES/EN e responde só com o que as ferramentas
// trazem dos dados mocados (alertas, praias, lugares com Selo, passeios).
// Sem chave ou com a API fora do ar, cai no guia simulado, que usa os mesmos dados.
import { isStepCount, streamText, tool, type LanguageModel, type ModelMessage } from "ai";
import { z } from "zod";
import { TEMPO_DEMO } from "@/data/seed";
import type { Idioma, PraiaHoje } from "@/data/tipos";
import { classificar, normalizar } from "@/lib/assistente";
import { formatarDistancia } from "@/lib/mapa";
import { CATEGORIA_PT } from "./categorias";
import * as dados from "./dados";
import { espera, ETAPA, etapaAlertas, etapaLugares, etapaPraias, NOME_IDIOMA, pedacos, SITUACAO, t } from "./falas";
import { modeloDoAgente, TEMPO_MAXIMO_MS } from "./provedor";
import type { EventoAgente, PedidoGuia } from "./tipos";

const GRUPOS = Object.keys(dados.GRUPOS) as [dados.Grupo, ...dados.Grupo[]];

function descreverPraia(p: PraiaHoje, idioma: Idioma) {
  return { id: p.id, nome: p.nome, situacao: SITUACAO[p.condicao.situacao][idioma], bandeira: p.condicao.bandeira, detalhe: p.condicao.detalhe[idioma] };
}

function praiasPedidas(p: PedidoGuia, nome?: string) {
  const todas = dados.praiasHoje(p.municipioId, p.alertas);
  if (!nome) return todas;
  const alvo = normalizar(nome).replace(/^(praia|playa|beach) (da |do |de )?/, "");
  const achadas = todas.filter((x) => normalizar(x.nome).includes(alvo) || alvo.includes(normalizar(x.nome)));
  return achadas.length ? achadas : todas;
}

function lugaresPedidos(p: PedidoGuia, grupo?: dados.Grupo) {
  const de = dados.estabelecimento(p.origemId) ?? dados.municipio(p.municipioId);
  return dados.lugaresComSelo(p.municipioId, grupo, p.origemId).slice(0, 4).map(({ e, km }) => ({
    id: e.id,
    nome: e.nome,
    categoria: CATEGORIA_PT[e.categoria],
    onde: e.local,
    descricao: e.descricao[p.idioma],
    nota: e.avaliacao.nota,
    avaliacoes: e.avaliacao.total,
    cadastur: e.cadastur,
    distancia: formatarDistancia(km, p.idioma),
    referenciaDistancia: de.nome,
  }));
}

function ferramentas(p: PedidoGuia) {
  return {
    consultarAlertas: tool({
      description: "Alertas oficiais ativos hoje no município (bandeira vermelha, mar agitado, interdições).",
      inputSchema: z.object({}),
      execute: async () => ({
        alertas: dados.alertasAtivos(p.municipioId, p.alertas).map((a) => ({
          titulo: a.titulo[p.idioma],
          texto: a.texto[p.idioma],
          severidade: a.severidade,
          origem: a.origem,
        })),
      }),
    }),
    consultarPraias: tool({
      description: "Situação de hoje das praias do município (própria, com cuidado ou imprópria, e a bandeira). Já considera os alertas ativos.",
      inputSchema: z.object({ praia: z.string().optional().describe("nome da praia, se o turista perguntou de uma específica") }),
      execute: async ({ praia }) => {
        const lista = praiasPedidas(p, praia);
        return { praias: lista.map((x) => descreverPraia(x, p.idioma)), ids: lista.map((x) => x.id) };
      },
    }),
    buscarLugares: tool({
      description:
        "Estabelecimentos com o Selo TuristAí (cadastro verificado), do mais perto ao mais longe. Os únicos lugares que você pode recomendar.",
      inputSchema: z.object({
        grupo: z.enum(GRUPOS).optional().describe("comer, hospedagem, passeios (guias e agências), transporte, compras ou noite"),
      }),
      execute: async ({ grupo }) => {
        const lugares = lugaresPedidos(p, grupo);
        return { lugares, ids: lugares.map((l) => l.id) };
      },
    }),
    consultarAtrativos: tool({
      description: "Pontos turísticos e passeios do município (trilhas, mirantes, passeios de barco, cultura).",
      inputSchema: z.object({}),
      execute: async () => ({
        atrativos: dados.atrativos(p.municipioId).map((a) => ({
          nome: a.nome,
          tipo: a.tipo,
          resumo: a.resumo[p.idioma],
          duracao: a.duracao?.[p.idioma],
          dicas: a.dicas.map((d) => d[p.idioma]),
        })),
      }),
    }),
    pedirSOS: tool({
      description: "Use quando o turista descrever uma emergência (perigo, roubo, ferimento, afogamento, alguém perdido). A tela mostra o botão de SOS.",
      inputSchema: z.object({ motivo: z.string().describe("o que aconteceu, em português") }),
      execute: async () => ({ ok: true, instrucao: "Diga ao turista para tocar em SOS agora ou ligar 190 (polícia), 192 (SAMU) ou 193 (bombeiros)." }),
    }),
  };
}

function instrucoes(p: PedidoGuia) {
  const cidade = dados.municipio(p.municipioId).nome;
  const hotel = dados.estabelecimento(p.origemId)?.nome;
  const hoje = new Intl.DateTimeFormat("pt-BR", { dateStyle: "full", timeZone: "America/Bahia" }).format(new Date());
  return `Você é o assistente do TuristAí, guia turístico da Costa do Cacau (Bahia), conversando pelo celular.
Hoje é ${hoje}. O turista está em ${cidade}${hotel ? `, hospedado na ${hotel}` : ""}. Clima de hoje: ${TEMPO_DEMO.temperatura}°, ensolarado; maré alta às ${TEMPO_DEMO.mareAlta}.

Responda SEMPRE em ${NOME_IDIOMA[p.idioma]}, que é o idioma do turista.

Regras:
- Para alertas, praias, lugares e passeios, consulte as ferramentas antes de responder. Nunca invente lugares, dados, preços, horários ou telefones.
- Só recomende estabelecimentos devolvidos por buscarLugares: todos têm o Selo TuristAí. Se nenhum servir, diga que ainda não há lugar com Selo para isso.
- Não fale de preços.
- Se o turista descrever uma emergência, chame pedirSOS e diga para tocar em SOS ou ligar 190 (polícia), 192 (SAMU) ou 193 (bombeiros).
- Assuntos fora de turismo na região: responda em uma frase que você ajuda com praias, alertas, onde comer, passeios e transporte.
- Respostas curtas, tom de conversa: no máximo 4 frases, ou uma lista curta com "•". Sem markdown (nada de **, # ou tabelas).
- Os cartões dos lugares e das praias aparecem sozinhos abaixo da sua resposta: cite os nomes, sem repetir todos os detalhes.`;
}

async function* guiaComModelo(modelo: LanguageModel, p: PedidoGuia): AsyncGenerator<EventoAgente> {
  const mensagens: ModelMessage[] = p.mensagens.map((m) => ({ role: m.papel === "turista" ? "user" : "assistant", content: m.texto }));
  const r = streamText({
    model: modelo,
    system: instrucoes(p),
    messages: mensagens,
    tools: ferramentas(p),
    stopWhen: isStepCount(4),
    temperature: 0.3,
    abortSignal: AbortSignal.timeout(TEMPO_MAXIMO_MS),
  });
  for await (const parte of r.fullStream) {
    switch (parte.type) {
      case "text-delta":
        if (parte.text) yield { tipo: "texto", delta: parte.text };
        break;
      case "tool-call":
        if (parte.toolName === "consultarAlertas") yield { tipo: "etapa", texto: ETAPA.alertas[p.idioma] };
        if (parte.toolName === "consultarPraias") yield { tipo: "etapa", texto: ETAPA.praias[p.idioma] };
        if (parte.toolName === "buscarLugares") yield { tipo: "etapa", texto: ETAPA.lugares[p.idioma] };
        if (parte.toolName === "consultarAtrativos") yield { tipo: "etapa", texto: ETAPA.atrativos[p.idioma] };
        if (parte.toolName === "pedirSOS") {
          yield { tipo: "etapa", texto: ETAPA.sos[p.idioma] };
          yield { tipo: "sos" };
        }
        break;
      case "tool-result": {
        const saida = parte.output as { ids?: string[]; alertas?: unknown[]; praias?: { situacao: string }[] };
        if (parte.toolName === "consultarAlertas") yield { tipo: "etapa", texto: etapaAlertas(saida.alertas?.length ?? 0, p.idioma) };
        if (parte.toolName === "consultarPraias" && saida.ids) {
          const aptas = saida.praias?.filter((x) => x.situacao === SITUACAO.propria[p.idioma]).length ?? 0;
          yield { tipo: "etapa", texto: etapaPraias(aptas, saida.ids.length, p.idioma) };
          yield { tipo: "praias", ids: saida.ids };
        }
        if (parte.toolName === "buscarLugares" && saida.ids) {
          yield { tipo: "etapa", texto: etapaLugares(saida.ids.length, p.idioma) };
          yield { tipo: "lugares", ids: saida.ids };
        }
        break;
      }
      case "error":
        throw parte.error;
    }
  }
}

// ---------- reserva: mesmas fontes de dados, frases prontas ----------

const PALAVRAS_ALERTA = ["alerta", "alertas", "aviso", "avisos", "alert", "alerts", "warning", "warnings", "perigo hoje"];
const PALAVRAS_PASSEIO = ["passeio", "passeios", "paseo", "paseos", "tour", "tours", "trilha", "trilhas", "sendero", "trail", "o que fazer", "que hacer", "things to do", "atrativo", "visitar", "visit"];
const PALAVRAS_HOSPEDAGEM = ["hotel", "pousada", "posada", "hospedagem", "alojamiento", "dormir", "stay", "inn", "hostel"];

function contem(m: string, palavras: string[]) {
  const p = ` ${m} `;
  return palavras.some((w) => p.includes(` ${w} `));
}

async function* escrever(texto: string): AsyncGenerator<EventoAgente> {
  for (const pedaco of pedacos(texto)) {
    yield { tipo: "texto", delta: pedaco };
    await espera(35);
  }
}

async function* guiaSimulado(p: PedidoGuia): AsyncGenerator<EventoAgente> {
  const pergunta = [...p.mensagens].reverse().find((m) => m.papel === "turista")?.texto ?? "";
  const m = normalizar(pergunta);
  const intencao = classificar(pergunta);
  const i = p.idioma;
  await espera(350);

  if (intencao === "emergencia") {
    yield { tipo: "etapa", texto: ETAPA.sos[i] };
    yield { tipo: "sos" };
    yield* escrever(
      t(
        "Parece uma emergência. Toque em SOS para avisar a Central agora, ou ligue 190 (polícia), 192 (SAMU) ou 193 (bombeiros).",
        "Parece una emergencia. Toca SOS para avisar a la Central ahora, o llama al 190 (policía), 192 (ambulancia) o 193 (bomberos).",
        "This sounds like an emergency. Tap SOS to alert the Central now, or call 190 (police), 192 (ambulance) or 193 (fire and rescue).",
      )[i],
    );
    return yield { tipo: "fim", modo: "simulado" };
  }

  if (contem(m, PALAVRAS_ALERTA)) {
    yield { tipo: "etapa", texto: ETAPA.alertas[i] };
    const ativos = dados.alertasAtivos(p.municipioId, p.alertas);
    await espera(300);
    yield { tipo: "etapa", texto: etapaAlertas(ativos.length, i) };
    yield* escrever(
      ativos.length
        ? ativos.map((a) => `• ${a.titulo[i]}: ${a.texto[i]}`).join("\n")
        : t(
            "Hoje não há alertas oficiais ativos. Mesmo assim, respeite as bandeiras dos salva-vidas.",
            "Hoy no hay alertas oficiales activos. Aun así, respeta las banderas de los socorristas.",
            "There are no active official alerts today. Still, follow the lifeguards' flags.",
          )[i],
    );
    return yield { tipo: "fim", modo: "simulado" };
  }

  // citar o nome de uma praia ("a Concha está boa?") já conta como pergunta de praia
  const todas = dados.praiasHoje(p.municipioId, p.alertas);
  const citadas = todas.filter((x) => m.includes(normalizar(x.nome).replace(/^praia (do |dos |da )?/, "")));
  if (intencao === "praia_segura" || citadas.length) {
    yield { tipo: "etapa", texto: ETAPA.praias[i] };
    const lista = citadas.length ? citadas : todas;
    await espera(300);
    yield { tipo: "etapa", texto: etapaPraias(lista.filter((x) => x.condicao.situacao === "propria").length, lista.length, i) };
    yield { tipo: "praias", ids: lista.map((x) => x.id) };
    yield* escrever(lista.map((x) => `• ${x.nome}: ${SITUACAO[x.condicao.situacao][i]} (${x.condicao.detalhe[i]})`).join("\n"));
    return yield { tipo: "fim", modo: "simulado" };
  }

  if (contem(m, PALAVRAS_PASSEIO)) {
    yield { tipo: "etapa", texto: ETAPA.atrativos[i] };
    const lista = dados.atrativos(p.municipioId).slice(0, 4);
    await espera(300);
    yield* escrever(
      `${t("Alguns passeios por aqui:", "Algunos paseos por aquí:", "A few things to do here:")[i]}\n${lista.map((a) => `• ${a.nome}: ${a.resumo[i]}`).join("\n")}`,
    );
    return yield { tipo: "fim", modo: "simulado" };
  }

  const grupo: dados.Grupo | null =
    intencao === "comer" ? "comer" : intencao === "transporte" ? "transporte" : contem(m, PALAVRAS_HOSPEDAGEM) ? "hospedagem" : null;
  if (grupo) {
    yield { tipo: "etapa", texto: ETAPA.lugares[i] };
    const lugares = dados.lugaresComSelo(p.municipioId, grupo, p.origemId).slice(0, 4);
    await espera(300);
    yield { tipo: "etapa", texto: etapaLugares(lugares.length, i) };
    if (lugares.length) yield { tipo: "lugares", ids: lugares.map((l) => l.e.id) };
    yield* escrever(
      lugares.length
        ? `${t("Estes têm o Selo TuristAí, do mais perto ao mais longe:", "Estos tienen el Sello TuristAí, del más cerca al más lejos:", "These have the TuristAí Seal, nearest first:")[i]}\n${lugares
            .map(({ e, km }) => `• ${e.nome} (${e.local}, ${formatarDistancia(km, i)})`)
            .join("\n")}`
        : t("Ainda não há lugar com Selo para isso aqui.", "Todavía no hay lugares con Sello para eso aquí.", "There is no place with the Seal for that here yet.")[i],
    );
    return yield { tipo: "fim", modo: "simulado" };
  }

  if (intencao === "mare_clima") {
    yield* escrever(
      t(
        `Hoje faz ${TEMPO_DEMO.temperatura}° com sol. A maré alta é às ${TEMPO_DEMO.mareAlta}; a baixa, cerca de 6 horas depois.`,
        `Hoy hace ${TEMPO_DEMO.temperatura}° y sol. La marea alta es a las ${TEMPO_DEMO.mareAlta}; la baja, unas 6 horas después.`,
        `Today it's ${TEMPO_DEMO.temperatura}° and sunny. High tide is at ${TEMPO_DEMO.mareAlta}; low tide about 6 hours later.`,
      )[i],
    );
    return yield { tipo: "fim", modo: "simulado" };
  }

  if (intencao === "saude") {
    yield* escrever(
      t(
        "Para urgência médica, ligue 192 (SAMU). Em outros casos, a recepção da sua hospedagem indica a farmácia mais próxima.",
        "Para una urgencia médica, llama al 192 (SAMU). En otros casos, la recepción de tu alojamiento te indica la farmacia más cercana.",
        "For a medical emergency, call 192 (ambulance). Otherwise, your hotel's front desk can point you to the nearest pharmacy.",
      )[i],
    );
    return yield { tipo: "fim", modo: "simulado" };
  }

  yield* escrever(
    t(
      "Posso ajudar com praias de hoje, alertas, onde comer, passeios e transporte. Por exemplo: “a Concha está boa hoje?”",
      "Puedo ayudarte con las playas de hoy, alertas, dónde comer, paseos y transporte. Por ejemplo: “¿la Concha está bien hoy?”",
      "I can help with today's beaches, alerts, where to eat, tours and transport. For example: “is Concha OK today?”",
    )[i],
  );
  yield { tipo: "fim", modo: "simulado" };
}

/** Roda o guia com o modelo; se faltar a chave ou a API falhar antes de responder, usa a reserva. */
export async function* rodarGuia(p: PedidoGuia): AsyncGenerator<EventoAgente> {
  yield { tipo: "etapa", texto: ETAPA.lendo[p.idioma] };
  const modelo = modeloDoAgente();
  if (modelo) {
    let escreveu = false;
    try {
      for await (const e of guiaComModelo(modelo, p)) {
        if (e.tipo === "texto") escreveu = true;
        yield e;
      }
      if (escreveu) return yield { tipo: "fim", modo: "ia" };
    } catch (erro) {
      console.error("[agente/guia] modelo falhou, usando a reserva:", erro instanceof Error ? erro.message : erro);
      if (escreveu) return yield { tipo: "fim", modo: "ia" };
    }
  }
  yield* guiaSimulado(p);
}
