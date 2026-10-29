// Dados de exemplo. Todo estabelecimento é fictício e marcado [DEMO].
import type { Alerta, Condicao, Estabelecimento, Local, Municipio } from "./tipos";

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
    localId: "concha", situacao: "propria", bandeira: "verde", fonte: "INEMA [DEMO]", data: hoje(),
    detalhe: { pt: "Água própria para banho", es: "Agua apta para baño", en: "Water safe for swimming" },
  },
  {
    localId: "ribeira", situacao: "precaucao", bandeira: "amarela", fonte: "Salva-vidas [DEMO]", data: hoje(),
    detalhe: { pt: "Ondas moderadas", es: "Oleaje moderado", en: "Moderate waves" },
  },
  {
    localId: "itacarezinho", situacao: "propria", bandeira: "verde", fonte: "INEMA [DEMO]", data: hoje(),
    detalhe: { pt: "Água própria para banho", es: "Agua apta para baño", en: "Water safe for swimming" },
  },
  {
    localId: "tiririca", situacao: "precaucao", bandeira: "amarela", fonte: "Salva-vidas [DEMO]", data: hoje(),
    detalhe: { pt: "Correnteza forte, só surfistas", es: "Corriente fuerte, solo surfistas", en: "Strong current, surfers only" },
  },
  {
    localId: "cristo", situacao: "impropria", bandeira: "vermelha", fonte: "INEMA [DEMO]", data: hoje(),
    detalhe: { pt: "Água imprópria após a chuva", es: "Agua no apta tras la lluvia", en: "Unsafe water after rain" },
  },
  {
    localId: "milionarios", situacao: "propria", bandeira: "verde", fonte: "INEMA [DEMO]", data: hoje(),
    detalhe: { pt: "Água própria para banho", es: "Agua apta para baño", en: "Water safe for swimming" },
  },
];

const t = (pt: string, es: string, en: string) => ({ pt, es, en });

export const ESTABELECIMENTOS: Estabelecimento[] = [
  {
    id: "e1", slug: "pousada-mare", nome: "Pousada Maré [DEMO]", categoria: "pousada", municipioId: "itacare",
    lat: -14.284, lng: -38.9935, cadastur: true, temSelo: true, local: "Orla da Concha", avaliacao: { nota: 4.8, total: 212 },
    descricao: t("Pousada de 12 quartos perto da Concha", "Posada de 12 habitaciones cerca de Concha", "12-room inn near Concha beach"),
    precos: [{ item: t("Diária casal", "Noche pareja", "Double room, night"), valor: 320 }],
  },
  {
    id: "e2", slug: "restaurante-cacau", nome: "Restaurante Cacau [DEMO]", categoria: "restaurante", municipioId: "itacare",
    lat: -14.2805, lng: -38.9955, cadastur: true, temSelo: true, local: "Centro", avaliacao: { nota: 4.7, total: 318 },
    descricao: t("Comida baiana e frutos do mar", "Comida bahiana y mariscos", "Bahian food and seafood"),
    precos: [
      { item: t("Moqueca de peixe", "Moqueca de pescado", "Fish moqueca"), valor: 89 },
      { item: t("Prato do dia", "Plato del día", "Dish of the day"), valor: 35 },
    ],
  },
  {
    id: "e3", slug: "barraca-do-sol", nome: "Barraca do Sol [DEMO]", categoria: "barraca", municipioId: "itacare",
    lat: -14.295, lng: -38.993, cadastur: false, temSelo: true, local: "Praia da Ribeira", avaliacao: { nota: 4.5, total: 96 },
    descricao: t("Barraca na Ribeira", "Chiringuito en Ribeira", "Beach stall at Ribeira"),
    precos: [
      { item: t("Água de coco", "Agua de coco", "Coconut water"), valor: 8 },
      { item: t("Acarajé", "Acarajé", "Acarajé"), valor: 15 },
    ],
  },
  {
    id: "e4", slug: "cantina-da-vila", nome: "Cantina da Vila [DEMO]", categoria: "restaurante", municipioId: "itacare",
    lat: -14.2795, lng: -38.9972, cadastur: true, temSelo: true, local: "Centro", avaliacao: { nota: 4.4, total: 154 },
    descricao: t("Massas e pizzas no centro", "Pastas y pizzas en el centro", "Pasta and pizza downtown"),
    precos: [
      { item: t("Pizza média", "Pizza mediana", "Medium pizza"), valor: 58 },
      { item: t("Suco natural", "Jugo natural", "Fresh juice"), valor: 12 },
    ],
  },
  {
    id: "e5", slug: "taxi-itacare", nome: "Táxi Itacaré [DEMO]", categoria: "transporte", municipioId: "itacare",
    lat: -14.2782, lng: -38.998, cadastur: true, temSelo: true, local: "Ponto do Centro", avaliacao: { nota: 4.9, total: 87 },
    descricao: t("Táxi 24h com motorista credenciado", "Taxi 24h con conductor acreditado", "24h taxi, licensed driver"),
    precos: [
      { item: t("Centro → Itacarezinho", "Centro → Itacarezinho", "Downtown → Itacarezinho"), valor: 60 },
      { item: t("Itacaré → Aeroporto de Ilhéus", "Itacaré → Aeropuerto de Ilhéus", "Itacaré → Ilhéus airport"), valor: 280 },
    ],
  },
  {
    id: "e6", slug: "trilhas-costa", nome: "Trilhas da Costa [DEMO]", categoria: "receptivo", municipioId: "itacare",
    lat: -14.2812, lng: -38.9948, cadastur: true, temSelo: true, local: "Centro", avaliacao: { nota: 4.8, total: 143 },
    descricao: t("Trilhas e passeios com guia", "Senderos y paseos con guía", "Guided trails and tours"),
    precos: [{ item: t("Trilha das 4 praias", "Sendero de las 4 playas", "Four-beaches trail"), valor: 120 }],
  },
  {
    id: "e7", slug: "emporio-chocolate", nome: "Empório do Chocolate [DEMO]", categoria: "comercio", municipioId: "itacare",
    lat: -14.2799, lng: -38.9962, cadastur: false, temSelo: true, local: "Centro", avaliacao: { nota: 4.6, total: 75 },
    descricao: t("Chocolate de cacau da região", "Chocolate de cacao de la región", "Chocolate from local cacao"),
    precos: [{ item: t("Barra 70% 100 g", "Tableta 70% 100 g", "70% bar, 100 g"), valor: 22 }],
  },
  {
    id: "e8", slug: "bar-da-pedra", nome: "Bar da Pedra [DEMO]", categoria: "vida_noturna", municipioId: "itacare",
    lat: -14.2809, lng: -38.9942, cadastur: false, temSelo: false, local: "Concha", avaliacao: { nota: 4.2, total: 60 },
    descricao: t("Bar com música ao vivo", "Bar con música en vivo", "Bar with live music"),
    precos: [],
  },
  {
    id: "e9", slug: "hotel-orla", nome: "Hotel Orla [DEMO]", categoria: "hotel", municipioId: "ilheus",
    lat: -14.7955, lng: -39.0395, cadastur: true, temSelo: true, local: "Orla de Ilhéus", avaliacao: { nota: 4.6, total: 402 },
    descricao: t("Hotel na orla de Ilhéus", "Hotel en el paseo marítimo de Ilhéus", "Seafront hotel in Ilhéus"),
    precos: [{ item: t("Diária casal", "Noche pareja", "Double room, night"), valor: 410 }],
  },
  {
    id: "e10", slug: "restaurante-orla", nome: "Restaurante Orla [DEMO]", categoria: "restaurante", municipioId: "ilheus",
    lat: -14.797, lng: -39.039, cadastur: true, temSelo: true, local: "Orla de Ilhéus", avaliacao: { nota: 4.5, total: 231 },
    descricao: t("Frutos do mar na orla", "Mariscos frente al mar", "Seafood on the seafront"),
    precos: [{ item: t("Casquinha de siri", "Casquinha de cangrejo", "Stuffed crab shell"), valor: 28 }],
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

/** Dados do dia exibidos no cabeçalho. [DEMO] */
export const TEMPO_DEMO = { temperatura: 27, mareAlta: "14:10" };
