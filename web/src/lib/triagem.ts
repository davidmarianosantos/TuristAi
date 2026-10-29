// Triagem do SOS no MVP. Regra: na dúvida, urgente. Nenhum caso urgente fica retido.
import type { Idioma, TipoSOS, Traduzido } from "@/data/tipos";
import { classificar, normalizar } from "./assistente";

export type Triagem = {
  urgencia: "urgente" | "nao_urgente";
  mensagemPt: string;
  resolucao?: { passos: Traduzido[] };
};

const t = (pt: string, es: string, en: string): Traduzido => ({ pt, es, en });

const EM_PT: Record<Exclude<TipoSOS, "outro">, string> = {
  roubo: "Fui roubado",
  medica: "Emergência médica",
  perdido: "Estou perdido",
  documentos: "Perdi meus documentos",
};

const PASSOS_DOCUMENTOS: Traduzido[] = [
  t(
    "Registre a ocorrência online na Delegacia Virtual da Bahia [DEMO].",
    "Haz la denuncia en línea en la Delegacia Virtual de Bahia [DEMO].",
    "File a report online at the Bahia Virtual Police Station [DEMO].",
  ),
  t(
    "Se for estrangeiro, fale com o consulado do seu país. Telefone [DEMO].",
    "Si eres extranjero, contacta al consulado de tu país. Teléfono [DEMO].",
    "If you are a foreigner, contact your country's consulate. Phone [DEMO].",
  ),
  t(
    "Avise a recepção da sua hospedagem: ela pode ajudar com cópias e contatos.",
    "Avisa en la recepción de tu alojamiento: pueden ayudarte con copias y contactos.",
    "Tell your hotel's front desk: they can help with copies and contacts.",
  ),
];

const DOCUMENTOS = ["documento", "documentos", "passaporte", "pasaporte", "passport", "rg", "identidade", "identidad", "carteira", "billetera", "wallet", "dni", "cedula"];
const PERDI = ["perdi", "perdio", "perdido", "perdida", "lost", "extravie", "sumiu"];

export function triarSOS(tipo: TipoSOS, texto: string | null, idioma: Idioma): Triagem {
  if (tipo === "documentos") {
    return { urgencia: "nao_urgente", mensagemPt: EM_PT.documentos, resolucao: { passos: PASSOS_DOCUMENTOS } };
  }
  if (tipo !== "outro") return { urgencia: "urgente", mensagemPt: EM_PT[tipo] };

  const bruto = (texto ?? "").trim();
  const p = ` ${normalizar(bruto)} `;
  const original = idioma === "pt" ? bruto : `[texto original em ${idioma.toUpperCase()}, sem tradução automática] ${bruto}`;

  // emergência explícita vence tudo
  if (classificar(bruto) === "emergencia" || classificar(bruto) === "saude") {
    return { urgencia: "urgente", mensagemPt: original };
  }
  const falaDeDocumento = DOCUMENTOS.some((w) => p.includes(` ${w} `));
  const falaDePerda = PERDI.some((w) => p.includes(` ${w} `));
  if (falaDeDocumento && falaDePerda) {
    return { urgencia: "nao_urgente", mensagemPt: original, resolucao: { passos: PASSOS_DOCUMENTOS } };
  }
  return { urgencia: "urgente", mensagemPt: original };
}
