// Leitura dos dados mocados no servidor, para as ferramentas do agente.
// Mesmas regras do repositório mock: o alerta ativo impõe a condição da praia.
import { ATRATIVOS, CONDICOES, ESTABELECIMENTOS, LOCAIS, MUNICIPIOS } from "@/data/seed";
import type { Alerta, Categoria, PraiaHoje } from "@/data/tipos";
import { distanciaKm } from "@/lib/mapa";

export function municipio(id: string) {
  return MUNICIPIOS.find((m) => m.id === id) ?? MUNICIPIOS.find((m) => m.id === "itacare")!;
}

export function estabelecimento(id?: string | null) {
  return id ? (ESTABELECIMENTOS.find((e) => e.id === id) ?? null) : null;
}

export function alertasAtivos(municipioId: string, alertas: Alerta[]) {
  const agora = Date.now();
  return alertas.filter((a) => a.municipioId === municipioId && (!a.validoAte || new Date(a.validoAte).getTime() > agora));
}

export function praiasHoje(municipioId: string, alertas: Alerta[]): PraiaHoje[] {
  const ativos = alertasAtivos(municipioId, alertas);
  return LOCAIS.filter((l) => l.municipioId === municipioId && l.tipo === "praia").map((l) => {
    const imposta = ativos.find((a) => a.localId === l.id && a.condicao)?.condicao;
    const base = CONDICOES.find((c) => c.localId === l.id);
    const condicao = imposta
      ? { localId: l.id, fonte: "Alerta oficial", data: new Date().toISOString().slice(0, 10), ...imposta }
      : (base ?? {
          localId: l.id, situacao: "sem_dados" as const, bandeira: "cinza" as const, fonte: "", data: "",
          detalhe: { pt: "Sem dados hoje", es: "Sin datos hoy", en: "No data today" },
        });
    return { ...l, condicao };
  });
}

export const GRUPOS = {
  comer: ["restaurante", "barraca"],
  hospedagem: ["hotel", "pousada"],
  passeios: ["receptivo", "condutor"],
  transporte: ["transporte"],
  compras: ["comercio"],
  noite: ["vida_noturna"],
} satisfies Record<string, Categoria[]>;

export type Grupo = keyof typeof GRUPOS;

/** Só estabelecimentos com Selo, do mais perto ao mais longe da origem (hotel do QR ou centro). */
export function lugaresComSelo(municipioId: string, grupo?: Grupo, origemId?: string | null) {
  const de = estabelecimento(origemId) ?? municipio(municipioId);
  return ESTABELECIMENTOS.filter(
    (e) => e.municipioId === municipioId && e.temSelo && e.id !== origemId && (!grupo || (GRUPOS[grupo] as Categoria[]).includes(e.categoria)),
  )
    .map((e) => ({ e, km: distanciaKm(de, e) }))
    .sort((a, b) => a.km - b.km);
}

/** Distância em linha reta até um ponto que pode não ter coordenadas (quem chama confere antes). */
export function distancia(de: { lat: number; lng: number }, a: { lat?: number; lng?: number }) {
  return distanciaKm(de, { lat: a.lat ?? de.lat, lng: a.lng ?? de.lng });
}

export function atrativos(municipioId: string) {
  return ATRATIVOS.filter((a) => a.municipioId === municipioId);
}

/** Como o turista costuma chamar cada atrativo (já sem acento), em PT/ES/EN. */
const APELIDOS: Record<string, string[]> = {
  "quatro-praias": ["quatro praias", "4 praias", "cuatro playas", "4 playas", "four beaches", "engenhoca", "havaizinho", "camboinha"],
  "ponta-do-xareu": ["xareu", "farol", "por do sol", "puesta de sol", "atardecer", "sunset"],
  prainha: ["prainha"],
  "rio-de-contas": ["rio de contas", "barco", "canoa", "boat", "manguezal", "manglar"],
  rafting: ["rafting", "taboquinhas", "boia cross", "corredeira", "rapidos"],
  "fazenda-cacau": ["fazenda", "hacienda", "farm", "plantacao", "cacau", "cacao"],
  "igreja-sao-miguel": ["sao miguel", "igreja", "iglesia", "church"],
  "casa-jorge-amado": ["casa de cultura", "casa jorge amado", "museu", "museo", "museum"],
  "catedral-sao-sebastiao": ["catedral", "cathedral", "sao sebastiao"],
  "quarteirao-jorge-amado": ["vesuvio", "quarteirao", "gabriela", "jorge amado"],
};

/** Atrativos citados pelo nome ou apelido num texto já normalizado. */
export function atrativosCitados(texto: string, municipioId?: string) {
  return ATRATIVOS.filter(
    (a) => (!municipioId || a.municipioId === municipioId) && (APELIDOS[a.id] ?? []).some((x) => ` ${texto} `.includes(` ${x} `)),
  );
}
