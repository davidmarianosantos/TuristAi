// Tipos do chatbot simulado (canal WhatsApp). A tela /chat só sabe desenhar estes blocos;
// quem decide o que dizer é o motor (motor.ts) a partir do roteiro (roteiro.ts).
import type { Repositorio } from "@/data/repositorio";
import type { Alerta, Estabelecimento, Idioma, PraiaHoje } from "@/data/tipos";

/** Uma mensagem é feita de blocos; hoje o bot só usa "texto", os outros já são desenhados. */
export type Bloco =
  | { tipo: "texto"; texto: string }
  | { tipo: "botoes"; opcoes: { rotulo: string; valor: string }[] }
  | { tipo: "lugar"; lugar: Estabelecimento }
  | { tipo: "alerta"; alerta: Alerta }
  | { tipo: "praia"; praia: PraiaHoje }
  | { tipo: "praias"; praias: PraiaHoje[] };

export type MensagemChat = {
  id: string;
  de: "turista" | "bot";
  blocos: Bloco[];
  em: string; // ISO
};

/** Memória da conversa entre mensagens, para fluxos de vários passos (ex.: { fluxo: "sos", passo: 2 }). */
export type EstadoConversa = Record<string, unknown>;

export type ContextoChat = {
  repo: Repositorio;
  idioma: Idioma;
  municipioId: string;
  origem: Estabelecimento | null;
  estado: EstadoConversa;
};

export type RespostaChat = {
  blocos: Bloco[];
  /** novo estado da conversa; se omitido, o estado atual é mantido */
  estado?: EstadoConversa;
};

/**
 * Um fluxo do roteiro. `quando` decide se ele responde a esta mensagem (palavra-chave,
 * botão tocado ou passo em andamento); `responder` monta a resposta com os dados mocados.
 */
export type Fluxo = {
  id: string;
  quando(mensagemNormalizada: string, ctx: ContextoChat): boolean;
  responder(mensagem: string, ctx: ContextoChat): Promise<RespostaChat>;
};
