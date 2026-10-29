// Respostas prontas da Central para o turista, já nos 3 idiomas. O atendente escolhe em
// português e o turista lê no idioma dele. Texto livre com tradução automática fica para a fase com IA.
import type { Servico, Traduzido } from "@/data/tipos";

export type FraseCentral = { id: string; para: (Servico | "todos")[]; texto: Traduzido };

const t = (pt: string, es: string, en: string): Traduzido => ({ pt, es, en });

export const FRASES_CENTRAL: FraseCentral[] = [
  {
    id: "recebido",
    para: ["todos"],
    texto: t(
      "Recebemos seu pedido e já estamos cuidando dele.",
      "Recibimos tu pedido y ya lo estamos atendiendo.",
      "We got your request and are already on it.",
    ),
  },
  {
    id: "viatura",
    para: ["policia"],
    texto: t(
      "Uma viatura da Polícia Militar está a caminho.",
      "Una patrulla de la Policía Militar va en camino.",
      "A Military Police car is on its way.",
    ),
  },
  {
    id: "ambulancia",
    para: ["samu"],
    texto: t(
      "Uma ambulância do SAMU está a caminho. Se estiver ferido, não se mexa.",
      "Una ambulancia del SAMU va en camino. Si estás herido, no te muevas.",
      "A SAMU ambulance is on its way. If you are hurt, don't move.",
    ),
  },
  {
    id: "bombeiros",
    para: ["bombeiros"],
    texto: t(
      "Os bombeiros estão a caminho. Se puder, mantenha o celular ligado.",
      "Los bomberos van en camino. Si puedes, mantén el celular encendido.",
      "Firefighters are on their way. If you can, keep your phone on.",
    ),
  },
  {
    id: "seguro",
    para: ["policia", "samu", "bombeiros"],
    texto: t(
      "Fique em um lugar seguro e visível, perto de outras pessoas.",
      "Quédate en un lugar seguro y visible, cerca de otras personas.",
      "Stay somewhere safe and visible, near other people.",
    ),
  },
  {
    id: "mar",
    para: ["bombeiros"],
    texto: t(
      "Não entre no mar para resgatar ninguém. Acene para os salva-vidas e aguarde a equipe.",
      "No entres al mar a rescatar a nadie. Haz señas a los socorristas y espera al equipo.",
      "Do not go into the sea to rescue anyone. Wave to the lifeguards and wait for the team.",
    ),
  },
  {
    id: "recepcao",
    para: ["policia", "turismo"],
    texto: t(
      "Se puder, vá até a recepção da sua hospedagem; vamos falar com eles.",
      "Si puedes, ve a la recepción de tu alojamiento; hablaremos con ellos.",
      "If you can, go to your hotel's front desk; we'll talk to them.",
    ),
  },
  {
    id: "documentos",
    para: ["turismo"],
    texto: t(
      "Para os documentos, registre a ocorrência na Delegacia Virtual e procure seu consulado. Podemos passar os contatos.",
      "Para los documentos, haz la denuncia en la Delegacia Virtual y busca a tu consulado. Podemos pasarte los contactos.",
      "For your documents, file a report at the Virtual Police Station and contact your consulate. We can share the contacts.",
    ),
  },
  {
    id: "piorar",
    para: ["todos"],
    texto: t(
      "Se a situação piorar, ligue agora para o 190, 192 ou 193.",
      "Si la situación empeora, llama ya al 190, 192 o 193.",
      "If things get worse, call 190, 192 or 193 now.",
    ),
  },
];

export const frasesPara = (servico?: Servico) =>
  FRASES_CENTRAL.filter((f) => f.para.includes("todos") || (servico ? f.para.includes(servico) : true));
