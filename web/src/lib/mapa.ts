import type { Categoria, CorBandeira, Estabelecimento, Idioma, PraiaHoje } from "@/data/tipos";

export type Filtro = "todos" | "comer" | "hospedagem" | "transporte" | "praias";

export type Pino =
  | { id: string; lat: number; lng: number; tipo: "lugar"; categoria: Categoria; lugar: Estabelecimento }
  | { id: string; lat: number; lng: number; tipo: "praia"; bandeira: CorBandeira; praia: PraiaHoje };

const GRUPO: Record<Exclude<Filtro, "todos" | "praias">, Categoria[]> = {
  comer: ["restaurante", "barraca"],
  hospedagem: ["hotel", "pousada"],
  transporte: ["transporte", "receptivo", "condutor"],
};

export function montarPinos(lugares: Estabelecimento[], praias: PraiaHoje[], filtro: Filtro): Pino[] {
  const pl: Pino[] = lugares
    .filter((l) => filtro === "todos" || (filtro !== "praias" && GRUPO[filtro].includes(l.categoria)))
    .map((l) => ({ id: l.id, lat: l.lat, lng: l.lng, tipo: "lugar", categoria: l.categoria, lugar: l }));
  const pp: Pino[] =
    filtro === "todos" || filtro === "praias"
      ? praias.map((p) => ({ id: p.id, lat: p.lat, lng: p.lng, tipo: "praia", bandeira: p.condicao.bandeira, praia: p }))
      : [];
  return [...pp, ...pl];
}

type Ponto = { lat: number; lng: number };

/** Distância em linha reta (haversine), em km. */
export function distanciaKm(a: Ponto, b: Ponto): number {
  const R = 6371;
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatarDistancia(km: number, idioma: Idioma): string {
  if (km < 1) return `${Math.max(50, Math.round((km * 1000) / 50) * 50)} m`;
  const n = new Intl.NumberFormat(idioma === "pt" ? "pt-BR" : idioma, { maximumFractionDigits: 1 }).format(km);
  return `${n} km`;
}
