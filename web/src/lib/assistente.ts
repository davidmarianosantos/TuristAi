// Assistente do MVP: regras por palavra-chave em PT/ES/EN.
// `responder` é a única porta; depois um LLM entra no lugar sem mexer nas telas.
import type { Repositorio } from "@/data/repositorio";
import { TEMPO_DEMO } from "@/data/seed";
import type { Estabelecimento, PraiaHoje, Traduzido } from "@/data/tipos";

export type Intencao =
  | "emergencia"
  | "saude"
  | "comer"
  | "praia_segura"
  | "mare_clima"
  | "transporte"
  | "nao_entendi";

export type Resposta = {
  intencao: Intencao;
  texto: Traduzido;
  lugares?: Estabelecimento[];
  praias?: PraiaHoje[];
  abrirSOS?: boolean;
};

export const normalizar = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[¿?¡!.,;:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Ordem = prioridade: emergência vence tudo.
const PALAVRAS: [Exclude<Intencao, "nao_entendi">, string[]][] = [
  ["emergencia", ["socorro", "ayuda", "help", "robaron", "robo", "roubo", "roubaram", "assalto", "asalto", "robbed", "stolen", "afogando", "ahogando", "drowning", "emergencia", "emergency", "perigo", "peligro", "danger"]],
  ["saude", ["farmacia", "pharmacy", "hospital", "medico", "doctor", "remedio", "medicina", "medicine", "posto de saude", "dor", "dolor", "pain", "enfermo", "doente", "sick"]],
  ["comer", ["comer", "comida", "restaurante", "restaurant", "eat", "food", "almoco", "almuerzo", "lunch", "jantar", "cena", "dinner", "moqueca", "acaraje", "lanche", "hungry", "fome", "hambre"]],
  ["praia_segura", ["segura", "seguro", "safe", "bandeira", "bandera", "flag", "nadar", "swim", "banho", "bano", "entrar no mar", "entrar al mar", "playa", "praia", "beach", "mar", "sea"]],
  ["mare_clima", ["mare", "marea", "tide", "chuva", "lluvia", "rain", "clima", "tempo", "weather", "sol", "sun", "calor"]],
  ["transporte", ["taxi", "transfer", "onibus", "bus", "autobus", "aeroporto", "aeropuerto", "airport", "uber", "carro", "car", "van", "barco", "boat", "rodoviaria", "terminal"]],
];

export function classificar(pergunta: string): Intencao {
  const p = ` ${normalizar(pergunta)} `;
  for (const [intencao, palavras] of PALAVRAS) {
    if (palavras.some((w) => p.includes(` ${w} `) || (w.length > 4 && p.includes(w)))) return intencao;
  }
  return "nao_entendi";
}

const t = (pt: string, es: string, en: string): Traduzido => ({ pt, es, en });

export async function responder(
  pergunta: string,
  ctx: { repo: Repositorio; municipioId: string },
): Promise<Resposta> {
  const intencao = classificar(pergunta);
  const lugares = () => ctx.repo.estabelecimentosComSelo(ctx.municipioId);

  switch (intencao) {
    case "emergencia":
      return {
        intencao,
        abrirSOS: true,
        texto: t(
          "Parece uma emergência. Abra o SOS para avisar a Central ou ligue agora para o 190.",
          "Parece una emergencia. Abre el SOS para avisar a la Central o llama ahora al 190.",
          "This sounds like an emergency. Open SOS to alert the Central, or call 190 now.",
        ),
      };
    case "comer": {
      const l = (await lugares()).filter((e) => e.categoria === "restaurante" || e.categoria === "barraca");
      return {
        intencao,
        lugares: l,
        texto: t(
          "Estes lugares têm o Selo: cadastro verificado e bem avaliados por turistas.",
          "Estos lugares tienen el Sello: registro verificado y buenas reseñas de turistas.",
          "These places have the Seal: verified registration and good reviews from tourists.",
        ),
      };
    }
    case "praia_segura": {
      const praias = await ctx.repo.praiasHoje(ctx.municipioId);
      return {
        intencao,
        praias,
        texto: t(
          "Esta é a situação das praias hoje, segundo as fontes oficiais.",
          "Esta es la situación de las playas hoy, según las fuentes oficiales.",
          "Here is today's beach status, from official sources.",
        ),
      };
    }
    case "mare_clima":
      return {
        intencao,
        texto: t(
          `Hoje faz ${TEMPO_DEMO.temperatura}° com sol. A maré alta é às ${TEMPO_DEMO.mareAlta}; a baixa, cerca de 6 horas depois. [DEMO]`,
          `Hoy hace ${TEMPO_DEMO.temperatura}° y sol. La marea alta es a las ${TEMPO_DEMO.mareAlta}; la baja, unas 6 horas después. [DEMO]`,
          `Today it's ${TEMPO_DEMO.temperatura}° and sunny. High tide is at ${TEMPO_DEMO.mareAlta}; low tide about 6 hours later. [DEMO]`,
        ),
      };
    case "transporte": {
      const l = (await lugares()).filter((e) => e.categoria === "transporte" || e.categoria === "receptivo");
      return {
        intencao,
        lugares: l,
        texto: t(
          "Transportes com Selo, verificados e bem avaliados:",
          "Transportes con Sello, verificados y bien valorados:",
          "Transport with the Seal, verified and well rated:",
        ),
      };
    }
    case "saude":
      return {
        intencao,
        texto: t(
          "Para urgência médica, ligue para o 192 (SAMU). Farmácia mais próxima: Farmácia Central [DEMO], a 300 m do centro.",
          "Para una urgencia médica, llama al 192 (SAMU). Farmacia más cercana: Farmácia Central [DEMO], a 300 m del centro.",
          "For a medical emergency, call 192 (ambulance). Nearest pharmacy: Farmácia Central [DEMO], 300 m from downtown.",
        ),
      };
    default:
      return {
        intencao: "nao_entendi",
        texto: t(
          "Não entendi. Experimente perguntar sobre comida, praias, maré ou transporte.",
          "No entendí. Prueba a preguntar por comida, playas, marea o transporte.",
          "I didn't get that. Try asking about food, beaches, tides or transport.",
        ),
      };
  }
}
