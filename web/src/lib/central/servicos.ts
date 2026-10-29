// Serviços e postos da Central Integrada. Cada posto vê a sua fila; a Coordenação vê tudo.
// Chamado sem serviço definido (a triagem não soube dizer) aparece em todos os postos,
// para ninguém deixar de ver um caso urgente.
import type { ChamadoSOS, Servico, TipoSOS, Traduzido } from "@/data/tipos";

export type Posto = Servico | "coordenacao";

export type InfoServico = {
  nomePt: string;
  /** nome que o turista lê na tela de status do SOS */
  nome: Traduzido;
  numero?: string;
  cor: string;
  recebe: string;
};

export const SERVICOS: Record<Servico, InfoServico> = {
  policia: {
    nomePt: "Polícia Militar",
    nome: { pt: "Polícia Militar", es: "Policía Militar", en: "Military Police" },
    numero: "190",
    cor: "#6cb4d9",
    recebe: "Roubo, furto, agressão, ameaça",
  },
  samu: {
    nomePt: "SAMU",
    nome: { pt: "SAMU (ambulância)", es: "SAMU (ambulancia)", en: "SAMU (ambulance)" },
    numero: "192",
    cor: "#f47c7c",
    recebe: "Emergência médica, ferimentos, mal súbito",
  },
  bombeiros: {
    nomePt: "Bombeiros",
    nome: { pt: "Corpo de Bombeiros", es: "Bomberos", en: "Fire and rescue" },
    numero: "193",
    cor: "#f59f4c",
    recebe: "Afogamento, resgate em trilha, pessoa perdida, incêndio",
  },
  turismo: {
    nomePt: "Atendimento ao Turista",
    nome: { pt: "Atendimento ao Turista", es: "Atención al Turista", en: "Tourist Assistance" },
    cor: "#5ccf8a",
    recebe: "Documentos, informação, pedidos não urgentes e revisão do que a IA resolveu",
  },
};

export const COORDENACAO = { nomePt: "Coordenação", cor: "#c9d1d7", recebe: "Todos os chamados de todos os serviços" };

export const POSTOS: Posto[] = ["coordenacao", "policia", "samu", "bombeiros", "turismo"];

export const nomePosto = (p: Posto) => (p === "coordenacao" ? COORDENACAO.nomePt : SERVICOS[p].nomePt);
export const corPosto = (p: Posto) => (p === "coordenacao" ? COORDENACAO.cor : SERVICOS[p].cor);

export const postoValido = (x?: string | null): Posto | null => (x && (POSTOS as string[]).includes(x) ? (x as Posto) : null);

// chamados de antes da triagem com serviço não têm `servico`: deduz pelo tipo
const PELO_TIPO: Partial<Record<TipoSOS, Servico>> = {
  roubo: "policia",
  medica: "samu",
  perdido: "bombeiros",
  documentos: "turismo",
};

/** Serviço responsável pelo chamado; `undefined` = a definir (triagem humana). */
export function servicoDe(c: ChamadoSOS): Servico | undefined {
  return c.servico ?? PELO_TIPO[c.tipo];
}

export function visivelNoPosto(c: ChamadoSOS, posto: Posto): boolean {
  if (posto === "coordenacao") return true;
  if (c.status === "resolvido_ia") return posto === "turismo"; // o Atendimento ao Turista revisa a IA
  const s = servicoDe(c);
  return s === posto || s === undefined;
}

const CHAVE_POSTO = "costa-cacau:posto-central";

export function lerPostoSalvo(): Posto | null {
  try {
    return postoValido(localStorage.getItem(CHAVE_POSTO));
  } catch {
    return null;
  }
}

export function salvarPosto(p: Posto | null) {
  try {
    if (p) localStorage.setItem(CHAVE_POSTO, p);
    else localStorage.removeItem(CHAVE_POSTO);
  } catch {}
}
