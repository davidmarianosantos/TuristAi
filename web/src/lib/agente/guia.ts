// Agente guia turístico: entende a pergunta em PT/ES/EN por regras, consulta os dados mocados
// (alertas, praias, lugares com Selo, passeios) e responde no idioma do turista, com etapas
// visíveis e streaming. Nunca inventa: só fala do que está nos dados.
import { TEMPO_DEMO } from "@/data/seed";
import type { Atrativo, Idioma, PraiaHoje, Traduzido } from "@/data/tipos";
import { classificar, normalizar } from "@/lib/assistente";
import { formatarDistancia } from "@/lib/mapa";
import * as dados from "./dados";
import { espera, ETAPA, etapaAlertas, etapaLugares, etapaPraias, pedacos, SITUACAO, t } from "./falas";
import { triar } from "./sos";
import type { EventoAgente, PedidoGuia } from "./tipos";

type Tema =
  | "saudacao" | "agradecimento" | "ajuda" | "alertas" | "praias" | "atrativo" | "passeios" | "comer"
  | "hospedagem" | "transporte" | "compras" | "noite" | "clima" | "selo" | "preco";

const NOME_TEMA: Record<Tema, Traduzido> = {
  saudacao: t("saudação", "saludo", "greeting"),
  agradecimento: t("agradecimento", "agradecimiento", "thanks"),
  ajuda: t("pedido de ajuda", "pedido de ayuda", "help request"),
  alertas: t("alertas", "alertas", "alerts"),
  praias: t("praias", "playas", "beaches"),
  atrativo: t("passeio", "paseo", "tour"),
  passeios: t("o que fazer", "qué hacer", "things to do"),
  comer: t("onde comer", "dónde comer", "where to eat"),
  hospedagem: t("hospedagem", "alojamiento", "places to stay"),
  transporte: t("transporte", "transporte", "transport"),
  compras: t("compras", "compras", "shopping"),
  noite: t("vida noturna", "vida nocturna", "nightlife"),
  clima: t("clima e maré", "clima y marea", "weather and tide"),
  selo: t("Selo TuristAí", "Sello TuristAí", "TuristAí Seal"),
  preco: t("preços", "precios", "prices"),
};

// começos de palavra (ou expressões) que indicam cada tema, já sem acento
const PISTAS: [Tema, string[]][] = [
  ["agradecimento", ["obrigad", "brigad", "valeu", "gracias", "thanks", "thank you", "thx", "muito bom", "perfeito", "perfecto", "genial"]],
  ["alertas", ["alerta", "aviso", "alert", "warning", "interdi", "bandeira vermelha", "bandera roja", "red flag", "perigo hoje", "peligro hoy"]],
  ["praias", ["praia", "playa", "beach", "nadar", "swim", "banho", "bano", "surf", "onda", "ola ", "waves", "mergulh", "bucear", "snorkel"]],
  ["passeios", ["passeio", "paseo", "tour", "trilha", "sendero", "trail", "o que fazer", "que hacer", "what to do", "things to do", "visitar", "visit", "conhecer", "conocer", "atrac", "atrativ", "excurs", "roteiro", "itinerar", "aventura", "adventure", "natureza", "naturaleza", "nature", "cultura", "culture", "historia", "history", "turistico"]],
  ["comer", ["jantar", "cena", "cenar", "dinner", "almoc", "almuerzo", "almorzar", "lunch", "cafe da manha", "desayuno", "breakfast", "pizza", "massa", "pasta", "frutos do mar", "mariscos", "seafood", "peixe", "pescado", "fish", "moqueca", "acaraje", "lanche", "snack", "comer", "comida", "food", "eat", "restaurante", "restaurant", "fome", "hambre", "hungry"]],
  ["hospedagem", ["hotel", "pousada", "posada", "hospedagem", "hospedar", "alojamiento", "dormir", "stay", "inn ", "hostel", "quarto", "habitacion", "room"]],
  ["transporte", ["taxi", "uber", "transfer", "aeroporto", "aeropuerto", "airport", "onibus", "autobus", "bus ", "carro", "car ", "van ", "rodoviaria", "terminal", "como chego", "como llego", "how do i get"]],
  ["compras", ["comprar", "compras", "loja", "tienda", "shop", "souvenir", "lembranc", "recuerdo", "chocolate", "presente", "regalo", "gift"]],
  ["noite", ["bar ", "bares", "balada", "festa", "fiesta", "party", "noite", "noche", "night", "musica", "music", "beber", "drink", "cerveja", "cerveza", "beer", "forro", "show"]],
  ["clima", ["mare", "marea", "tide", "chuva", "chover", "lluvia", "llover", "rain", "clima", "tempo hoje", "weather", "sol ", "sun ", "calor", "frio", "temperatura"]],
  ["selo", ["selo", "sello", "seal", "confiavel", "confiable", "trust", "verificad", "verified", "cadastur", "seguro confiar"]],
  ["preco", ["preco", "precio", "price", "quanto custa", "cuanto cuesta", "how much", "caro", "barato", "cheap", "expensive", "valor"]],
];
const SAUDACOES = ["oi", "ola", "hola", "hi", "hello", "hey", "bom dia", "boa tarde", "boa noite", "buenos dias", "buenas", "buenas tardes", "buenas noches", "good morning", "good afternoon", "good evening"];

const tem = (m: string, termos: string[]) => termos.some((x) => ` ${m} `.includes(` ${x}`));

function praiasCitadas(m: string, praias: PraiaHoje[]) {
  return praias.filter((x) => ` ${m} `.includes(` ${normalizar(x.nome).replace(/^praia (do |dos |da )?/, "")}`));
}

type Leitura = { temas: Tema[]; praias: PraiaHoje[]; atrativos: Atrativo[]; m: string };

function entender(pergunta: string, p: PedidoGuia): Leitura {
  const m = normalizar(pergunta);
  const praias = praiasCitadas(m, dados.praiasHoje(p.municipioId, p.alertas));
  const atrativos = dados.atrativosCitados(m, p.municipioId);
  const temas = new Set<Tema>();
  if (praias.length || classificar(pergunta) === "praia_segura") temas.add("praias");
  if (atrativos.length) temas.add("atrativo");
  for (const [tema, termos] of PISTAS) if (tem(m, termos)) temas.add(tema);
  const intencao = classificar(pergunta);
  if (intencao === "comer") temas.add("comer");
  if (intencao === "transporte") temas.add("transporte");
  if (intencao === "mare_clima") temas.add("clima");
  // um passeio citado pelo nome já responde "o que fazer"; "cacau" de loja vira compras
  if (temas.has("atrativo")) temas.delete("passeios");
  if (temas.has("compras") && atrativos.every((a) => a.id === "fazenda-cacau") && !tem(m, ["fazenda", "hacienda", "farm", "visita"])) {
    temas.delete("atrativo");
  }
  if (!temas.size && m.split(" ").length <= 5 && tem(m, SAUDACOES)) temas.add("saudacao");
  return { temas: [...temas].filter((x) => x !== "agradecimento" || temas.size === 1).slice(0, 3), praias, atrativos, m };
}

// ---------- respostas ----------

type Bloco = { etapas: string[]; texto: string; lugares?: string[]; praias?: string[] };

function referencia(p: PedidoGuia) {
  const hotel = dados.estabelecimento(p.origemId);
  return hotel ? t(`da ${hotel.nome}`, `de ${hotel.nome}`, `from ${hotel.nome}`)[p.idioma] : t("do centro", "del centro", "from downtown")[p.idioma];
}

function responderLugares(p: PedidoGuia, grupo: dados.Grupo, m: string, vazio: Traduzido, abertura: Traduzido): Bloco {
  const i = p.idioma;
  let lista = dados.lugaresComSelo(p.municipioId, grupo, p.origemId);
  // o que a pessoa pediu primeiro: "pizza" põe a cantina na frente, "moqueca" o restaurante baiano
  const pedido = m.split(" ").filter((w) => w.length > 3);
  const pontua = (x: (typeof lista)[number]) =>
    pedido.filter((w) => normalizar(`${x.e.nome} ${x.e.descricao.pt} ${x.e.descricao.es} ${x.e.descricao.en} ${x.e.local}`).includes(w.slice(0, 5))).length;
  lista = [...lista].sort((a, b) => pontua(b) - pontua(a) || a.km - b.km).slice(0, 3);
  const etapas = [ETAPA.lugares[i], etapaLugares(lista.length, i)];
  if (!lista.length) return { etapas, texto: vazio[i] };
  const linhas = lista.map(({ e, km }) => `• ${e.nome}: ${e.descricao[i].charAt(0).toLowerCase()}${e.descricao[i].slice(1)} (${e.local}, ${formatarDistancia(km, i)})`);
  return { etapas, texto: `${abertura[i].replace("{ref}", referencia(p))}\n${linhas.join("\n")}`, lugares: lista.map((x) => x.e.id) };
}

function responderPraias(p: PedidoGuia, citadas: PraiaHoje[]): Bloco {
  const i = p.idioma;
  const todas = dados.praiasHoje(p.municipioId, p.alertas);
  const lista = citadas.length ? citadas : todas;
  const aptas = lista.filter((x) => x.condicao.situacao === "propria").length;
  const etapas = [ETAPA.praias[i], etapaPraias(aptas, lista.length, i)];
  const linhas = lista.map((x) => `• ${x.nome}: ${SITUACAO[x.condicao.situacao][i]} (${x.condicao.detalhe[i]})`);
  const ruins = citadas.filter((x) => x.condicao.situacao === "impropria");
  const boas = todas.filter((x) => x.condicao.situacao === "propria" && !citadas.includes(x)).map((x) => x.nome);
  let extra = "";
  if (ruins.length)
    extra = t(
      `Hoje não entre no mar na ${ruins.map((x) => x.nome).join(", ")}.${boas.length ? ` Boas opções: ${boas.join(", ")}.` : ""}`,
      `Hoy no entres al mar en ${ruins.map((x) => x.nome).join(", ")}.${boas.length ? ` Buenas opciones: ${boas.join(", ")}.` : ""}`,
      `Don't go into the sea at ${ruins.map((x) => x.nome).join(", ")} today.${boas.length ? ` Good options: ${boas.join(", ")}.` : ""}`,
    )[i];
  else if (lista.some((x) => x.condicao.situacao === "precaucao"))
    extra = t("Onde está “com cuidado”, nade só perto do salva-vidas.", "Donde dice “con precaución”, nada solo cerca del socorrista.", "Where it says “use caution”, swim only near a lifeguard.")[i];
  // pergunta sobre uma praia só: responde direto, antes da lista
  const uma = citadas.length === 1 ? citadas[0] : null;
  const direto = uma
    ? {
        propria: t(`Sim! A ${uma.nome} está própria para banho hoje.`, `¡Sí! ${uma.nome} está apta para el baño hoy.`, `Yes! ${uma.nome} is safe for swimming today.`),
        precaucao: t(`Dá para ir à ${uma.nome}, mas com cuidado hoje.`, `Puedes ir a ${uma.nome}, pero con precaución hoy.`, `You can go to ${uma.nome}, but with caution today.`),
        impropria: t(`Hoje não: a ${uma.nome} está imprópria.`, `Hoy no: ${uma.nome} no está apta.`, `Not today: ${uma.nome} is unsafe.`),
        sem_dados: t(`Ainda não tenho dados de hoje da ${uma.nome}.`, `Todavía no tengo datos de hoy de ${uma.nome}.`, `I don't have today's data for ${uma.nome} yet.`),
      }[uma.condicao.situacao][i]
    : "";
  return { etapas, texto: [direto, linhas.join("\n"), extra].filter(Boolean).join("\n"), praias: lista.map((x) => x.id) };
}

function responderAlertas(p: PedidoGuia): Bloco {
  const i = p.idioma;
  const ativos = dados.alertasAtivos(p.municipioId, p.alertas);
  return {
    etapas: [ETAPA.alertas[i], etapaAlertas(ativos.length, i)],
    texto: ativos.length
      ? `${t("Alertas oficiais de hoje:", "Alertas oficiales de hoy:", "Today's official alerts:")[i]}\n${ativos.map((a) => `• ${a.titulo[i]}: ${a.texto[i]} (${a.origem})`).join("\n")}`
      : t(
          "Hoje não há alertas oficiais ativos. Mesmo assim, respeite as bandeiras dos salva-vidas.",
          "Hoy no hay alertas oficiales activos. Aun así, respeta las banderas de los socorristas.",
          "There are no active official alerts today. Still, follow the lifeguards' flags.",
        )[i],
  };
}

function guiasComSelo(p: PedidoGuia) {
  return dados.lugaresComSelo(p.municipioId, "passeios", p.origemId).slice(0, 1).map((x) => x.e);
}

function responderAtrativos(p: PedidoGuia, citados: Atrativo[]): Bloco {
  const i = p.idioma;
  const de = dados.estabelecimento(p.origemId) ?? dados.municipio(p.municipioId);
  const linhas = citados.slice(0, 2).map((a) => {
    const dist = a.lat != null && a.lng != null ? ` ${t("Fica a", "Está a", "It's")[i]} ${formatarDistancia(dados.distancia(de, a), i)}${i === "en" ? " away" : ""}.` : "";
    const dur = a.duracao ? ` (${a.duracao[i]})` : "";
    return `${a.nomes[i]}${dur}: ${a.descricao[i]}${dist}\n${t("Antes de ir:", "Antes de ir:", "Before you go:")[i]} ${a.dicas.map((d) => d[i].toLowerCase()).join("; ")}.`;
  });
  const precisaGuia = citados.some((a) => ["trilha", "passeio", "aventura", "cacau"].includes(a.tipo));
  const guia = precisaGuia ? guiasComSelo(p)[0] : undefined;
  const dica = guia
    ? t(`Para ir com guia, a ${guia.nome} é recomendada pelo TuristAí.`, `Para ir con guía, ${guia.nome} está recomendada por TuristAí.`, `For a guide, ${guia.nome} is recommended by TuristAí.`)[i]
    : "";
  return { etapas: [ETAPA.atrativos[i]], texto: [...linhas, dica].filter(Boolean).join("\n\n"), lugares: guia ? [guia.id] : undefined };
}

function responderPasseios(p: PedidoGuia, m: string): Bloco {
  const i = p.idioma;
  const todos = dados.atrativos(p.municipioId);
  const filtro = tem(m, ["trilha", "sendero", "trail", "caminhada", "caminata", "hike"])
    ? ["trilha"]
    : tem(m, ["cultura", "culture", "historia", "history", "museu", "museo", "museum", "igreja", "iglesia"])
      ? ["cultura"]
      : tem(m, ["aventura", "adventure", "radical", "rafting"])
        ? ["aventura", "trilha"]
        : null;
  const lista = (filtro ? todos.filter((a) => filtro.includes(a.tipo)) : todos).slice(0, 4);
  const usados = lista.length ? lista : todos.slice(0, 4);
  if (!usados.length) return { etapas: [ETAPA.atrativos[i]], texto: t("Ainda não tenho passeios cadastrados aqui.", "Todavía no tengo paseos registrados aquí.", "I don't have tours listed here yet.")[i] };
  const guia = guiasComSelo(p)[0];
  return {
    etapas: [ETAPA.atrativos[i], t(`${usados.length} passeios na base`, `${usados.length} paseos en la base`, `${usados.length} tours found`)[i]],
    texto: [
      t("Boas pedidas por aqui:", "Buenas opciones por aquí:", "Good picks around here:")[i],
      ...usados.map((a) => `• ${a.nomes[i]}: ${a.resumo[i]}${a.duracao ? ` (${a.duracao[i]})` : ""}`),
      guia ? t(`Para trilhas e passeios com guia, a ${guia.nome} é recomendada pelo TuristAí.`, `Para senderos y paseos con guía, ${guia.nome} está recomendada por TuristAí.`, `For guided trails and tours, ${guia.nome} is recommended by TuristAí.`)[i] : "",
    ]
      .filter(Boolean)
      .join("\n"),
    lugares: guia ? [guia.id] : undefined,
  };
}

function responderClima(p: PedidoGuia): Bloco {
  const i = p.idioma;
  const praias = dados.praiasHoje(p.municipioId, p.alertas);
  const aptas = praias.filter((x) => x.condicao.situacao === "propria").length;
  return {
    etapas: [t("consultando clima e maré…", "consultando clima y marea…", "checking weather and tide…")[i]],
    texto: t(
      `Hoje faz ${TEMPO_DEMO.temperatura}° com sol. A maré alta é às ${TEMPO_DEMO.mareAlta}; a baixa, cerca de 6 horas depois, é a melhor hora para piscinas naturais. ${aptas} de ${praias.length} praias estão próprias.`,
      `Hoy hace ${TEMPO_DEMO.temperatura}° y sol. La marea alta es a las ${TEMPO_DEMO.mareAlta}; la baja, unas 6 horas después, es la mejor hora para las piscinas naturales. ${aptas} de ${praias.length} playas están aptas.`,
      `Today it's ${TEMPO_DEMO.temperatura}° and sunny. High tide is at ${TEMPO_DEMO.mareAlta}; low tide, about 6 hours later, is best for natural pools. ${aptas} of ${praias.length} beaches are safe.`,
    )[i],
  };
}

function responderAjuda(p: PedidoGuia, pergunta: string): Bloco | null {
  const ficha = triar({ texto: pergunta, idioma: p.idioma });
  if (ficha.urgencia === "urgente" || !ficha.passos.length) return null;
  return { etapas: [ETAPA.triando[p.idioma]], texto: `${ficha.orientacao}\n${ficha.passos.map((x, n) => `${n + 1}. ${x}`).join("\n")}` };
}

const TEXTOS = {
  saudacao: (p: PedidoGuia) => {
    const hotel = dados.estabelecimento(p.origemId)?.nome;
    return t(
      `Olá! Sou o Cacauzito, o assistente do TuristAí${hotel ? `, aqui com você pela ${hotel}` : ""}. Posso dizer como estão as praias hoje, avisar de alertas, indicar onde comer entre os recomendados e sugerir passeios. O que você quer saber?`,
      `¡Hola! Soy Cacauzito, el asistente de TuristAí${hotel ? `, contigo desde ${hotel}` : ""}. Te cuento cómo están las playas hoy, te aviso de alertas, te indico dónde comer entre los recomendados y te sugiero paseos. ¿Qué quieres saber?`,
      `Hi! I'm Cacauzito, the TuristAí assistant${hotel ? `, here with you from ${hotel}` : ""}. I can tell you how the beaches are today, flag alerts, suggest recommended places to eat and things to do. What would you like to know?`,
    )[p.idioma];
  },
  agradecimento: t("De nada! Se precisar de mais alguma coisa, é só perguntar. Aproveite a Costa do Cacau!", "¡De nada! Si necesitas algo más, solo pregunta. ¡Disfruta la Costa do Cacau!", "You're welcome! Ask me anything else. Enjoy the Cocoa Coast!"),
  selo: t(
    "O Selo TuristAí mostra que o lugar tem cadastro conferido e boas avaliações de turistas. Hospedagens, agências, guias e transporte turístico também têm o Cadastur, exigido por lei. Por isso eu só recomendo lugares com o Selo.",
    "El Sello TuristAí indica que el lugar tiene registro verificado y buenas reseñas de turistas. Alojamientos, agencias, guías y transporte turístico también tienen Cadastur, obligatorio por ley. Por eso solo recomiendo lugares con Sello.",
    "The TuristAí Seal means the place has a verified registration and good reviews from tourists. Places to stay, agencies, guides and tourist transport also hold Cadastur, required by law. That's why I only recommend places with the Seal.",
  ),
  preco: t(
    "Os preços mudam de lugar para lugar e eu prefiro não chutar. Pergunte direto no estabelecimento; os que eu indico são recomendados pelo TuristAí.",
    "Los precios cambian de un lugar a otro y prefiero no adivinar. Pregunta directamente en el lugar; los que te indico están recomendados por TuristAí.",
    "Prices vary from place to place and I'd rather not guess. Ask the place directly; the ones I suggest are recommended by TuristAí.",
  ),
  naoEntendi: t(
    "Não entendi bem. Posso ajudar com:\n• praias de hoje\n• alertas\n• onde comer\n• passeios\n• transporte\nExemplo: “a Concha está boa hoje?”",
    "No te entendí bien. Puedo ayudarte con:\n• playas de hoy\n• alertas\n• dónde comer\n• paseos\n• transporte\nEjemplo: “¿la Concha está bien hoy?”",
    "I didn't quite get that. I can help with:\n• today's beaches\n• alerts\n• where to eat\n• things to do\n• transport\nFor example: “is Concha OK today?”",
  ),
  emergencia: t(
    "Isso parece uma emergência. Toque em SOS para avisar a Central agora, ou ligue 190 (polícia), 192 (SAMU) ou 193 (bombeiros).",
    "Esto parece una emergencia. Toca SOS para avisar a la Central ahora, o llama al 190 (policía), 192 (ambulancia) o 193 (bomberos).",
    "This sounds like an emergency. Tap SOS to alert the Central now, or call 190 (police), 192 (ambulance) or 193 (fire and rescue).",
  ),
};

function responderTema(tema: Tema, l: Leitura, p: PedidoGuia, pergunta: string): Bloco {
  const i = p.idioma;
  switch (tema) {
    case "saudacao":
      return { etapas: [], texto: TEXTOS.saudacao(p) };
    case "agradecimento":
      return { etapas: [], texto: TEXTOS.agradecimento[i] };
    case "selo":
      return { etapas: [], texto: TEXTOS.selo[i] };
    case "preco":
      return { etapas: [], texto: TEXTOS.preco[i] };
    case "ajuda":
      return responderAjuda(p, pergunta) ?? { etapas: [], texto: TEXTOS.naoEntendi[i] };
    case "alertas":
      return responderAlertas(p);
    case "praias":
      return responderPraias(p, l.praias);
    case "atrativo":
      return responderAtrativos(p, l.atrativos);
    case "passeios":
      return responderPasseios(p, l.m);
    case "clima":
      return responderClima(p);
    case "comer":
      return responderLugares(p, "comer", l.m,
        t("Ainda não temos recomendação para comer aqui.", "Todavía no tenemos recomendaciones para comer aquí.", "We don't have a recommended place to eat here yet."),
        t("Recomendados pelo TuristAí, com a distância {ref}:", "Recomendados por TuristAí, con la distancia {ref}:", "Recommended by TuristAí, distance {ref}:"));
    case "hospedagem":
      return responderLugares(p, "hospedagem", l.m,
        t("Ainda não temos outra hospedagem recomendada por aqui.", "Todavía no tenemos otro alojamiento recomendado por aquí.", "We don't have another recommended place to stay here yet."),
        t("Hospedagens recomendadas, a partir {ref}:", "Alojamientos recomendados, desde {ref}:", "Recommended places to stay, {ref}:"));
    case "transporte": {
      const b = responderLugares(p, "transporte", l.m,
        t("Ainda não temos transporte recomendado aqui; peça um táxi na recepção.", "Todavía no tenemos transporte recomendado aquí; pide un taxi en la recepción.", "We don't have recommended transport here yet; ask the front desk for a taxi."),
        t("Transporte recomendado, com Cadastur e motorista credenciado:", "Transporte recomendado, con Cadastur y conductor acreditado:", "Recommended transport, with Cadastur and a licensed driver:"));
      if (tem(l.m, ["aeroporto", "aeropuerto", "airport"]) && b.lugares?.length)
        b.texto += `\n${t("Para o aeroporto de Ilhéus, combine o horário com antecedência: a viagem leva cerca de 1h10.", "Para el aeropuerto de Ilhéus, reserva el horario con antelación: el viaje dura cerca de 1h10.", "For Ilhéus airport, book ahead: the ride takes about 1h10.")[i]}`;
      return b;
    }
    case "compras":
      return responderLugares(p, "compras", l.m,
        t("Ainda não temos loja recomendada aqui.", "Todavía no tenemos tiendas recomendadas aquí.", "We don't have a recommended shop here yet."),
        t("Lojas recomendadas {ref}:", "Tiendas recomendadas {ref}:", "Recommended shops {ref}:"));
    case "noite": {
      const b = responderLugares(p, "noite", l.m,
        t("Ainda não temos bar recomendado por aqui, então prefiro não indicar.", "Todavía no tenemos bares recomendados por aquí, así que prefiero no indicar ninguno.", "We don't have a recommended bar here yet, so I'd rather not suggest one."),
        t("Vida noturna recomendada {ref}:", "Vida nocturna recomendada {ref}:", "Recommended nightlife {ref}:"));
      const por = dados.atrativos(p.municipioId).find((a) => a.tipo === "mirante");
      if (!b.lugares?.length && por) b.texto += ` ${t(`Para o fim de tarde, o programa mais famoso é o ${por.nomes.pt}.`, `Para el atardecer, el plan más famoso es el ${por.nomes.es}.`, `For the late afternoon, the classic plan is ${por.nomes.en}.`)[i]}`;
      return b;
    }
  }
}

async function* escrever(texto: string): AsyncGenerator<EventoAgente> {
  for (const pedaco of pedacos(texto)) {
    yield { tipo: "texto", delta: pedaco };
    await espera(28);
  }
}

export async function* rodarGuia(p: PedidoGuia): AsyncGenerator<EventoAgente> {
  const i = p.idioma;
  const pergunta = [...p.mensagens].reverse().find((m) => m.papel === "turista")?.texto ?? "";
  yield { tipo: "etapa", texto: ETAPA.lendo[i] };
  await espera(300);

  // emergência primeiro: a triagem do SOS decide, e o guia só aponta o caminho
  const ficha = triar({ texto: pergunta, idioma: i });
  if (classificar(pergunta) === "emergencia" || (ficha.urgencia === "urgente" && ficha.servico)) {
    yield { tipo: "etapa", texto: ETAPA.sos[i] };
    yield { tipo: "sos" };
    yield* escrever(TEXTOS.emergencia[i]);
    return yield { tipo: "fim" };
  }

  const leitura = entender(pergunta, p);
  // caso não urgente que o SOS sabe resolver (documento perdido, água-viva, farmácia…)
  if (ficha.urgencia === "nao_urgente" && ficha.passos.length && !leitura.temas.some((x) => x !== "saudacao")) leitura.temas = ["ajuda"];
  if (!leitura.temas.length) {
    yield* escrever(TEXTOS.naoEntendi[i]);
    return yield { tipo: "fim" };
  }
  if (leitura.temas.length > 1 || !["saudacao", "agradecimento"].includes(leitura.temas[0])) {
    yield { tipo: "etapa", texto: `${t("entendi", "entendí", "understood")[i]}: ${leitura.temas.map((x) => NOME_TEMA[x][i]).join(" + ")}` };
  }

  const blocos: Bloco[] = [];
  for (const tema of leitura.temas) {
    const b = responderTema(tema, leitura, p, pergunta);
    for (const etapa of b.etapas) {
      await espera(280);
      yield { tipo: "etapa", texto: etapa };
    }
    if (b.lugares?.length) yield { tipo: "lugares", ids: b.lugares };
    if (b.praias?.length) yield { tipo: "praias", ids: b.praias };
    blocos.push(b);
  }
  await espera(200);
  yield* escrever(blocos.map((b) => b.texto).join("\n\n"));
  yield { tipo: "fim" };
}
