// Contrato entre as telas e os agentes de IA (rotas /api/agente/guia e /api/agente/sos).
// A resposta é um fluxo NDJSON: um EventoAgente por linha, na ordem em que acontecem.
import type { Alerta, FichaSOS, Idioma } from "@/data/tipos";

export type EventoAgente =
  /** etapa do "raciocínio", já no idioma do turista (ex.: "consultando praias…") */
  | { tipo: "etapa"; texto: string }
  /** pedaço da resposta em texto (streaming) */
  | { tipo: "texto"; delta: string }
  /** estabelecimentos com Selo que as ferramentas devolveram (a tela desenha os cartões) */
  | { tipo: "lugares"; ids: string[] }
  /** praias consultadas (a tela desenha a situação do dia) */
  | { tipo: "praias"; ids: string[] }
  /** o guia percebeu uma emergência: a tela oferece o SOS */
  | { tipo: "sos" }
  /** ficha da triagem do SOS, pronta para a Central */
  | { tipo: "ficha"; ficha: FichaSOS }
  | { tipo: "fim" };

export type MensagemAgente = { papel: "turista" | "agente"; texto: string };

export type PedidoGuia = {
  mensagens: MensagemAgente[];
  idioma: Idioma;
  municipioId: string;
  /** os alertas moram no navegador (mock); a tela manda os ativos junto com a pergunta */
  alertas: Alerta[];
  origemId?: string | null;
};

export type PedidoSOS = {
  texto: string;
  idioma: Idioma;
  hotel?: string | null;
  local?: { lat: number; lng: number } | null;
};
