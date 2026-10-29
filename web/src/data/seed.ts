// Dados de exemplo do protótipo. Os estabelecimentos são fictícios (nomes inventados, fotos ilustrativas);
// os atrativos são lugares públicos reais da região.
import type { Alerta, Atrativo, Condicao, Estabelecimento, Local, Municipio } from "./tipos";

export const MUNICIPIOS: Municipio[] = [
  { id: "canavieiras", nome: "Canavieiras", lat: -15.6753, lng: -38.9472 },
  { id: "ilheus", nome: "Ilhéus", lat: -14.7936, lng: -39.0464 },
  { id: "itabuna", nome: "Itabuna", lat: -14.7876, lng: -39.2781 },
  { id: "itacare", nome: "Itacaré", lat: -14.2786, lng: -38.9966 },
  { id: "pau-brasil", nome: "Pau Brasil", lat: -15.464, lng: -39.651 },
  { id: "santa-luzia", nome: "Santa Luzia", lat: -15.434, lng: -39.329 },
  { id: "una", nome: "Una", lat: -15.293, lng: -39.075 },
  { id: "urucuca", nome: "Uruçuca", lat: -14.593, lng: -39.284 },
];

export const MUNICIPIO_PADRAO = "itacare";

export const LOCAIS: Local[] = [
  { id: "concha", municipioId: "itacare", tipo: "praia", nome: "Concha", lat: -14.2829, lng: -38.992 },
  { id: "ribeira", municipioId: "itacare", tipo: "praia", nome: "Ribeira", lat: -14.2953, lng: -38.9933 },
  { id: "itacarezinho", municipioId: "itacare", tipo: "praia", nome: "Itacarezinho", lat: -14.3346, lng: -39.0117 },
  { id: "tiririca", municipioId: "itacare", tipo: "praia", nome: "Tiririca", lat: -14.292, lng: -38.99 },
  { id: "cristo", municipioId: "ilheus", tipo: "praia", nome: "Praia do Cristo", lat: -14.7965, lng: -39.0378 },
  { id: "milionarios", municipioId: "ilheus", tipo: "praia", nome: "Praia dos Milionários", lat: -14.8457, lng: -39.0331 },
];

const hoje = () => new Date().toISOString().slice(0, 10);

export const CONDICOES: Condicao[] = [
  {
    localId: "concha", situacao: "propria", bandeira: "verde", fonte: "INEMA", data: hoje(),
    detalhe: { pt: "Água própria para banho", es: "Agua apta para baño", en: "Water safe for swimming" },
  },
  {
    localId: "ribeira", situacao: "precaucao", bandeira: "amarela", fonte: "Salva-vidas", data: hoje(),
    detalhe: { pt: "Ondas moderadas", es: "Oleaje moderado", en: "Moderate waves" },
  },
  {
    localId: "itacarezinho", situacao: "propria", bandeira: "verde", fonte: "INEMA", data: hoje(),
    detalhe: { pt: "Água própria para banho", es: "Agua apta para baño", en: "Water safe for swimming" },
  },
  {
    localId: "tiririca", situacao: "precaucao", bandeira: "amarela", fonte: "Salva-vidas", data: hoje(),
    detalhe: { pt: "Correnteza forte, só surfistas", es: "Corriente fuerte, solo surfistas", en: "Strong current, surfers only" },
  },
  {
    localId: "cristo", situacao: "impropria", bandeira: "vermelha", fonte: "INEMA", data: hoje(),
    detalhe: { pt: "Água imprópria após a chuva", es: "Agua no apta tras la lluvia", en: "Unsafe water after rain" },
  },
  {
    localId: "milionarios", situacao: "propria", bandeira: "verde", fonte: "INEMA", data: hoje(),
    detalhe: { pt: "Água própria para banho", es: "Agua apta para baño", en: "Water safe for swimming" },
  },
];

const t = (pt: string, es: string, en: string) => ({ pt, es, en });
const foto = (nome: string) => `/img/fotos/${nome}.jpg`;

export const ESTABELECIMENTOS: Estabelecimento[] = [
  {
    id: "e1", slug: "pousada-mare", nome: "Pousada Vila Maré", categoria: "pousada", municipioId: "itacare",
    lat: -14.284, lng: -38.9935, cadastur: true, temSelo: true, local: "Orla da Concha", avaliacao: { nota: 4.8, total: 212 },
    foto: foto("praia-da-concha"),
    descricao: t("Pousada de 12 quartos perto da Concha", "Posada de 12 habitaciones cerca de Concha", "12-room inn near Concha beach"),
    precos: [{ item: t("Diária casal", "Noche pareja", "Double room, night"), valor: 320 }],
  },
  {
    id: "e2", slug: "restaurante-cacau", nome: "Varanda do Dendê", categoria: "restaurante", municipioId: "itacare",
    lat: -14.2805, lng: -38.9955, cadastur: true, temSelo: true, local: "Centro", avaliacao: { nota: 4.7, total: 318 },
    foto: foto("moqueca"),
    descricao: t("Comida baiana e frutos do mar", "Comida bahiana y mariscos", "Bahian food and seafood"),
    precos: [
      { item: t("Moqueca de peixe", "Moqueca de pescado", "Fish moqueca"), valor: 89 },
      { item: t("Prato do dia", "Plato del día", "Dish of the day"), valor: 35 },
    ],
  },
  {
    id: "e3", slug: "barraca-do-sol", nome: "Barraca Onda Mansa", categoria: "barraca", municipioId: "itacare",
    lat: -14.295, lng: -38.993, cadastur: false, temSelo: true, local: "Praia da Ribeira", avaliacao: { nota: 4.5, total: 96 },
    foto: foto("agua-de-coco"),
    descricao: t("Barraca na Ribeira", "Chiringuito en Ribeira", "Beach stall at Ribeira"),
    precos: [
      { item: t("Água de coco", "Agua de coco", "Coconut water"), valor: 8 },
      { item: t("Acarajé", "Acarajé", "Acarajé"), valor: 15 },
    ],
  },
  {
    id: "e4", slug: "cantina-da-vila", nome: "Cantina Beco Verde", categoria: "restaurante", municipioId: "itacare",
    lat: -14.2795, lng: -38.9972, cadastur: true, temSelo: true, local: "Centro", avaliacao: { nota: 4.4, total: 154 },
    foto: foto("pizza"),
    descricao: t("Massas e pizzas no centro", "Pastas y pizzas en el centro", "Pasta and pizza downtown"),
    precos: [
      { item: t("Pizza média", "Pizza mediana", "Medium pizza"), valor: 58 },
      { item: t("Suco natural", "Jugo natural", "Fresh juice"), valor: 12 },
    ],
  },
  {
    id: "e5", slug: "taxi-itacare", nome: "Rádio Táxi Litoral", categoria: "transporte", municipioId: "itacare",
    lat: -14.2782, lng: -38.998, cadastur: true, temSelo: true, local: "Ponto do Centro", avaliacao: { nota: 4.9, total: 87 },
    descricao: t("Táxi 24h com motorista credenciado", "Taxi 24h con conductor acreditado", "24h taxi, licensed driver"),
    precos: [
      { item: t("Centro → Itacarezinho", "Centro → Itacarezinho", "Downtown → Itacarezinho"), valor: 60 },
      { item: t("Itacaré → Aeroporto de Ilhéus", "Itacaré → Aeropuerto de Ilhéus", "Itacaré → Ilhéus airport"), valor: 280 },
    ],
  },
  {
    id: "e6", slug: "trilhas-costa", nome: "Trilheiros do Cacau", categoria: "receptivo", municipioId: "itacare",
    lat: -14.2812, lng: -38.9948, cadastur: true, temSelo: true, local: "Centro", avaliacao: { nota: 4.8, total: 143 },
    foto: foto("engenhoca-2"),
    descricao: t("Trilhas e passeios com guia", "Senderos y paseos con guía", "Guided trails and tours"),
    precos: [{ item: t("Trilha das 4 praias", "Sendero de las 4 playas", "Four-beaches trail"), valor: 120 }],
  },
  {
    id: "e7", slug: "emporio-chocolate", nome: "Empório Cacau Fino", categoria: "comercio", municipioId: "itacare",
    lat: -14.2799, lng: -38.9962, cadastur: false, temSelo: true, local: "Centro", avaliacao: { nota: 4.6, total: 75 },
    foto: foto("chocolate"),
    descricao: t("Chocolate de cacau da região", "Chocolate de cacao de la región", "Chocolate from local cacao"),
    precos: [{ item: t("Barra 70% 100 g", "Tableta 70% 100 g", "70% bar, 100 g"), valor: 22 }],
  },
  {
    id: "e8", slug: "bar-da-pedra", nome: "Bar Pedra Solta", categoria: "vida_noturna", municipioId: "itacare",
    lat: -14.2809, lng: -38.9942, cadastur: false, temSelo: false, local: "Concha", avaliacao: { nota: 4.2, total: 60 },
    descricao: t("Bar com música ao vivo", "Bar con música en vivo", "Bar with live music"),
    precos: [],
  },
  {
    id: "e9", slug: "hotel-orla", nome: "Hotel Mirante da Orla", categoria: "hotel", municipioId: "ilheus",
    lat: -14.7955, lng: -39.0395, cadastur: true, temSelo: true, local: "Orla de Ilhéus", avaliacao: { nota: 4.6, total: 402 },
    descricao: t("Hotel na orla de Ilhéus", "Hotel en el paseo marítimo de Ilhéus", "Seafront hotel in Ilhéus"),
    precos: [{ item: t("Diária casal", "Noche pareja", "Double room, night"), valor: 410 }],
  },
  {
    id: "e10", slug: "restaurante-orla", nome: "Casquinha da Orla", categoria: "restaurante", municipioId: "ilheus",
    lat: -14.797, lng: -39.039, cadastur: true, temSelo: true, local: "Orla de Ilhéus", avaliacao: { nota: 4.5, total: 231 },
    foto: foto("moqueca-cacau"),
    descricao: t("Frutos do mar na orla", "Mariscos frente al mar", "Seafood on the seafront"),
    precos: [{ item: t("Casquinha de siri", "Casquinha de cangrejo", "Stuffed crab shell"), valor: 28 }],
  },
];

/** Pontos turísticos e passeios, na ordem em que aparecem na vitrine. Coordenadas aproximadas. */
export const ATRATIVOS: Atrativo[] = [
  {
    id: "quatro-praias", municipioId: "itacare", tipo: "trilha", nome: "Trilha das Quatro Praias",
    lat: -14.3105, lng: -39.0035, foto: foto("engenhoca"),
    duracao: t("4 km de trilha", "4 km de sendero", "4 km trail"),
    resumo: t(
      "Engenhoca, Havaizinho, Camboinha e Itacarezinho a pé",
      "Engenhoca, Havaizinho, Camboinha e Itacarezinho a pie",
      "Engenhoca, Havaizinho, Camboinha and Itacarezinho on foot",
    ),
    descricao: t(
      "Caminhada pela Mata Atlântica que liga quatro praias desertas ao sul da cidade, com subidas, trechos de pedra e mirantes. Termina na praia de Itacarezinho.",
      "Caminata por la Mata Atlántica que une cuatro playas desiertas al sur del pueblo, con subidas, tramos de piedra y miradores. Termina en la playa de Itacarezinho.",
      "A walk through the Atlantic Forest linking four empty beaches south of town, with climbs, rocky stretches and viewpoints. It ends at Itacarezinho beach.",
    ),
    dicas: [
      t("Vá com guia credenciado", "Ve con un guía acreditado", "Go with a licensed guide"),
      t("Tênis, água e protetor solar", "Zapatillas, agua y protector solar", "Trainers, water and sunscreen"),
      t("Saia cedo para voltar com luz do dia", "Sal temprano para volver con luz de día", "Start early to be back in daylight"),
    ],
  },
  {
    id: "ponta-do-xareu", municipioId: "itacare", tipo: "mirante", nome: "Mirante da Ponta do Xaréu",
    lat: -14.279, lng: -38.9893, foto: foto("por-do-sol-xareu"),
    duracao: t("No fim da tarde", "Al atardecer", "Late afternoon"),
    resumo: t("O pôr do sol mais famoso de Itacaré", "La puesta de sol más famosa de Itacaré", "Itacaré's best-known sunset"),
    descricao: t(
      "Ponta de pedras entre a Concha e a Coroinha, de frente para a foz do Rio de Contas. No fim da tarde, moradores e visitantes se juntam ali para ver o sol se pôr sobre o rio.",
      "Punta de rocas entre Concha y Coroinha, frente a la desembocadura del Río de Contas. Al atardecer, vecinos y visitantes se reúnen allí para ver el sol ponerse sobre el río.",
      "A rocky point between Concha and Coroinha, facing the mouth of the Rio de Contas. In the late afternoon, locals and visitors gather there to watch the sun set over the river.",
    ),
    dicas: [
      t("Chegue meia hora antes do pôr do sol", "Llega media hora antes de la puesta de sol", "Arrive half an hour before sunset"),
      t("Acesso a pé pela praia da Concha", "Acceso a pie por la playa de Concha", "Reach it on foot from Concha beach"),
      t("Leve uma lanterna para a volta", "Lleva una linterna para la vuelta", "Bring a torch for the walk back"),
    ],
  },
  {
    id: "prainha", municipioId: "itacare", tipo: "trilha", nome: "Trilha da Prainha",
    lat: -14.303, lng: -38.9952, foto: foto("prainha"),
    duracao: t("40 min de trilha", "40 min de sendero", "40-minute trail"),
    resumo: t("Areia clara e coqueiros, só se chega a pé", "Arena clara y cocoteros, solo se llega a pie", "Pale sand and palm trees, reachable only on foot"),
    descricao: t(
      "Uma das praias mais bonitas de Itacaré, sem acesso de carro. A trilha começa no fim da praia da Ribeira e atravessa a mata até a enseada.",
      "Una de las playas más bonitas de Itacaré, sin acceso en coche. El sendero empieza al final de la playa de Ribeira y cruza la mata hasta la ensenada.",
      "One of Itacaré's most beautiful beaches, with no road access. The trail starts at the far end of Ribeira beach and crosses the forest to the cove.",
    ),
    dicas: [
      t("Use tênis: há subidas e raízes", "Usa zapatillas: hay subidas y raíces", "Wear trainers: there are climbs and roots"),
      t("Leve água e lanche", "Lleva agua y algo de comer", "Bring water and a snack"),
      t("Evite depois de chuva forte", "Evítalo después de una lluvia fuerte", "Avoid it after heavy rain"),
    ],
  },
  {
    id: "rio-de-contas", municipioId: "itacare", tipo: "passeio", nome: "Passeio de barco no Rio de Contas",
    foto: foto("rio-de-contas"),
    resumo: t("Manguezal, ilhas e a foz do rio", "Manglar, islas y la desembocadura del río", "Mangroves, islands and the river mouth"),
    descricao: t(
      "Barcos e canoas sobem o Rio de Contas entre manguezais e ilhas. É o jeito mais tranquilo de ver Itacaré de outro ângulo.",
      "Barcos y canoas suben el Río de Contas entre manglares e islas. Es la forma más tranquila de ver Itacaré desde otro ángulo.",
      "Boats and canoes head up the Rio de Contas past mangroves and islands. It is the calmest way to see Itacaré from another angle.",
    ),
    dicas: [
      t("Contrate agência com Cadastur", "Contrata una agencia con Cadastur", "Book with a Cadastur-registered agency"),
      t("Use o colete salva-vidas", "Usa el chaleco salvavidas", "Wear the life jacket"),
      t("Chapéu e protetor solar", "Sombrero y protector solar", "Hat and sunscreen"),
    ],
  },
  {
    id: "rafting", municipioId: "itacare", tipo: "aventura", nome: "Rafting em Taboquinhas",
    lat: -14.212, lng: -39.147, foto: foto("rafting"),
    resumo: t("Corredeiras do Rio de Contas", "Rápidos del Río de Contas", "Rio de Contas rapids"),
    descricao: t(
      "No distrito de Taboquinhas, a cerca de 30 km de estrada, o Rio de Contas forma corredeiras para rafting e boia-cross. As agências de Itacaré levam e trazem os grupos.",
      "En el distrito de Taboquinhas, a unos 30 km por carretera, el Río de Contas forma rápidos para rafting y boia-cross. Las agencias de Itacaré llevan y traen a los grupos.",
      "In the district of Taboquinhas, about 30 km by road, the Rio de Contas forms rapids for rafting and tubing. Agencies in Itacaré run the transfers.",
    ),
    dicas: [
      t("Só com agência credenciada e equipamento", "Solo con agencia acreditada y equipo", "Only with a licensed agency and proper gear"),
      t("Roupa que pode molhar e protetor solar", "Ropa que se pueda mojar y protector solar", "Clothes that can get wet, and sunscreen"),
      t("Pergunte a idade mínima antes de reservar", "Pregunta la edad mínima antes de reservar", "Ask about the minimum age before booking"),
    ],
  },
  {
    id: "fazenda-cacau", municipioId: "itacare", tipo: "cacau", nome: "Visita a fazenda de cacau",
    foto: foto("cacau"),
    resumo: t("Do fruto no pé ao chocolate", "Del fruto en el árbol al chocolate", "From the pod on the tree to chocolate"),
    descricao: t(
      "Fazendas da região recebem visitantes para mostrar como o cacau é colhido, fermentado e secado, quase sempre com degustação de chocolate feito ali.",
      "Haciendas de la región reciben visitantes para mostrar cómo se cosecha, fermenta y seca el cacao, casi siempre con degustación de chocolate hecho allí.",
      "Farms in the region welcome visitors to show how cacao is harvested, fermented and dried, usually ending with a tasting of chocolate made on site.",
    ),
    dicas: [
      t("Agende antes: as visitas têm horário", "Reserva antes: las visitas tienen horario", "Book ahead: visits run at set times"),
      t("Prove a polpa do cacau direto do fruto", "Prueba la pulpa del cacao directo del fruto", "Taste the cacao pulp straight from the pod"),
      t("Leve repelente", "Lleva repelente", "Bring insect repellent"),
    ],
  },
  {
    id: "igreja-sao-miguel", municipioId: "itacare", tipo: "cultura", nome: "Igreja de São Miguel",
    lat: -14.2778, lng: -38.9978, foto: foto("igreja-sao-miguel"),
    resumo: t("A matriz do centro histórico", "La iglesia matriz del centro histórico", "The parish church in the old town"),
    descricao: t(
      "A igreja de São Miguel Arcanjo guarda a origem da cidade, que nasceu como vila de São Miguel da Barra do Rio de Contas. Fica no centro histórico.",
      "La iglesia de San Miguel Arcángel guarda el origen del pueblo, que nació como villa de São Miguel da Barra do Rio de Contas. Está en el centro histórico.",
      "The church of Saint Michael the Archangel holds the town's origins: Itacaré began as the village of São Miguel da Barra do Rio de Contas. It stands in the old town.",
    ),
    dicas: [
      t("Respeite os horários de missa", "Respeta los horarios de misa", "Mind the mass times"),
      t("Junte com um passeio a pé pelo centro", "Combínalo con un paseo a pie por el centro", "Pair it with a walk around the old town"),
    ],
  },
  {
    id: "casa-jorge-amado", municipioId: "ilheus", tipo: "cultura", nome: "Casa de Cultura Jorge Amado",
    lat: -14.7905, lng: -39.0402, foto: foto("casa-jorge-amado"),
    resumo: t("O casarão do escritor, hoje museu", "La casona del escritor, hoy museo", "The writer's family home, now a museum"),
    descricao: t(
      "Casarão onde Jorge Amado viveu na juventude, no centro histórico. Hoje é um museu sobre a vida e a obra do escritor que fez de Ilhéus o cenário de seus livros.",
      "Casona donde Jorge Amado vivió en su juventud, en el centro histórico. Hoy es un museo sobre la vida y la obra del escritor que hizo de Ilhéus el escenario de sus libros.",
      "The mansion where Jorge Amado lived as a young man, in the old town. It is now a museum on the life and work of the writer who set his novels in Ilhéus.",
    ),
    dicas: [
      t("Confira o horário de visita antes", "Consulta el horario de visita antes", "Check opening hours before you go"),
      t("Fica a poucos passos da catedral", "Está a pocos pasos de la catedral", "It is a short walk from the cathedral"),
    ],
  },
  {
    id: "catedral-sao-sebastiao", municipioId: "ilheus", tipo: "cultura", nome: "Catedral de São Sebastião",
    lat: -14.7937, lng: -39.0376, foto: foto("catedral-ilheus"),
    resumo: t("O cartão-postal do centro histórico", "La postal del centro histórico", "The old town's postcard view"),
    descricao: t(
      "A catedral de torres altas, de frente para o mar, é o coração do centro histórico de Ilhéus e o ponto de partida para conhecer a cidade a pé.",
      "La catedral de torres altas, frente al mar, es el corazón del centro histórico de Ilhéus y el punto de partida para recorrer la ciudad a pie.",
      "The tall-towered cathedral facing the sea is the heart of Ilhéus's old town and the place to start exploring on foot.",
    ),
    dicas: [
      t("Bonita de dia e iluminada à noite", "Bonita de día e iluminada de noche", "Lovely by day and lit up at night"),
      t("Junte com a Casa de Cultura Jorge Amado", "Combínala con la Casa de Cultura Jorge Amado", "Pair it with the Jorge Amado House of Culture"),
    ],
  },
  {
    id: "quarteirao-jorge-amado", municipioId: "ilheus", tipo: "cultura", nome: "Quarteirão Jorge Amado",
    lat: -14.7932, lng: -39.0388, foto: foto("quarteirao-jorge-amado"),
    resumo: t("O cenário de Gabriela, Cravo e Canela", "El escenario de Gabriela, clavo y canela", "The setting of Gabriela, Clove and Cinnamon"),
    descricao: t(
      "Ruas do centro que aparecem nos livros de Jorge Amado, com o Bar Vesúvio, cenário de Gabriela, Cravo e Canela, e uma estátua do escritor.",
      "Calles del centro que aparecen en los libros de Jorge Amado, con el Bar Vesúvio, escenario de Gabriela, clavo y canela, y una estatua del escritor.",
      "Old-town streets that appear in Jorge Amado's novels, with Bar Vesúvio, the setting of Gabriela, Clove and Cinnamon, and a statue of the writer.",
    ),
    dicas: [
      t("Dá para fazer tudo a pé", "Se recorre todo a pie", "Everything is within walking distance"),
      t("O fim da tarde é a melhor hora para fotos", "El atardecer es la mejor hora para fotos", "Late afternoon is best for photos"),
    ],
  },
];

/** Alerta usado no roteiro da demo (publicado pela página /ensaio). */
export function alertaDemoConcha(): Alerta {
  return {
    id: `a-concha-${Date.now()}`,
    tipo: "bandeira_vermelha",
    severidade: "perigo",
    municipioId: "itacare",
    localId: "concha",
    titulo: t("Não entre no mar na Concha", "No entres al mar en Concha", "Do not enter the sea at Concha"),
    texto: t(
      "Mar agitado e correntes fortes até novo aviso.",
      "Mar agitado y corrientes fuertes hasta nuevo aviso.",
      "Rough sea and strong currents until further notice.",
    ),
    origem: "Prefeitura de Itacaré",
    criadoEm: new Date().toISOString(),
    condicao: {
      situacao: "impropria",
      bandeira: "vermelha",
      detalhe: t("Bandeira vermelha", "Bandera roja", "Red flag"),
    },
  };
}

/** Dados do dia exibidos no cabeçalho (fixos no protótipo). */
export const TEMPO_DEMO = { temperatura: 27, mareAlta: "14:10" };
