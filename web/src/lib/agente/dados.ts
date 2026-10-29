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

export function atrativos(municipioId: string) {
  return ATRATIVOS.filter((a) => a.municipioId === municipioId);
}
