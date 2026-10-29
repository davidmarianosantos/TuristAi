// Triagem do SOS no MVP. Regra: na dúvida, urgente. Nenhum caso urgente fica retido.
// Além da urgência, sugere o serviço da Central (Polícia, SAMU, Bombeiros ou Atendimento ao
// Turista) e explica o porquê, para o atendente confirmar ou encaminhar: a IA não decide sozinha.
import type { Idioma, Servico, TipoSOS, Traduzido } from "@/data/tipos";
import { classificar, normalizar } from "./assistente";

export type Triagem = {
  urgencia: "urgente" | "nao_urgente";
  mensagemPt: string;
  resolucao?: { passos: Traduzido[] };
  /** serviço sugerido; sem valor = a triagem não soube dizer e um humano decide */
  servico?: Servico;
  /** por que decidiu assim, em português, para o atendente */
  motivo: string;
};

const t = (pt: string, es: string, en: string): Traduzido => ({ pt, es, en });

const EM_PT: Record<Exclude<TipoSOS, "outro">, string> = {
  roubo: "Fui roubado",
  medica: "Emergência médica",
  perdido: "Estou perdido",
  documentos: "Perdi meus documentos",
};

const SERVICO_DO_TIPO: Record<Exclude<TipoSOS, "outro">, Servico> = {
  roubo: "policia",
  medica: "samu",
  perdido: "bombeiros",
  documentos: "turismo",
};

const PASSOS_DOCUMENTOS: Traduzido[] = [
  t(
    "Registre a ocorrência online na Delegacia Virtual da Bahia.",
    "Haz la denuncia en línea en la Delegacia Virtual de Bahia.",
    "File a report online at the Bahia Virtual Police Station (Delegacia Virtual).",
  ),
  t(
    "Se for estrangeiro, fale com o consulado do seu país.",
    "Si eres extranjero, contacta al consulado de tu país.",
    "If you are a foreigner, contact your country's consulate.",
  ),
  t(
    "Avise a recepção da sua hospedagem: ela pode ajudar com cópias e contatos.",
    "Avisa en la recepción de tu alojamiento: pueden ayudarte con copias y contactos.",
    "Tell your hotel's front desk: they can help with copies and contacts.",
  ),
];

const DOCUMENTOS = ["documento", "documentos", "passaporte", "pasaporte", "passport", "rg", "identidade", "identidad", "carteira", "billetera", "wallet", "dni", "cedula"];
const PERDI = ["perdi", "perdio", "perdido", "perdida", "lost", "extravie", "sumiu"];

// Começos de palavra que indicam o serviço, em PT/ES/EN, na ordem de gravidade:
// afogamento e resgate primeiro, depois saúde, depois polícia.
const PISTAS: [Servico, string[]][] = [
  ["bombeiros", ["afog", "ahog", "drown", "fogo", "fuego", "fire", "incendi", "resgat", "rescat", "rescue", "preso", "atrapad", "stuck", "trilha", "sender", "trail", "perdid", "perdio", "perdeu", "desaparec", "missing", "sumiu", "sumio", "lost", "caiu", "cayo", "fell"]],
  ["samu", ["medic", "doctor", "dor", "dolor", "pain", "sangu", "sangr", "blood", "ferid", "herid", "injur", "desmai", "desmay", "faint", "infart", "alergi", "allerg", "ambulanc", "respir", "breath", "convuls"]],
  ["policia", ["roub", "rob", "assalt", "asalt", "furt", "hurto", "arma", "weapon", "gun", "agred", "agress", "attack", "golpe", "estafa", "scam", "ameac", "amenaz", "threat", "segue", "sigue", "follow"]],
];

const NOME: Record<Servico, string> = {
  policia: "Polícia Militar",
  samu: "SAMU",
  bombeiros: "Bombeiros",
  turismo: "Atendimento ao Turista",
};

function servicoPorTexto(normalizado: string): { servico: Servico; pista: string } | null {
  const palavras = normalizado.split(" ").filter(Boolean);
  for (const [servico, pistas] of PISTAS) {
    for (const palavra of palavras) {
      const pista = pistas.find((p) => palavra.startsWith(p));
      if (pista) return { servico, pista: palavra };
    }
  }
  return null;
}

export function triarSOS(tipo: TipoSOS, texto: string | null, idioma: Idioma): Triagem {
  if (tipo === "documentos") {
    return {
      urgencia: "nao_urgente",
      mensagemPt: EM_PT.documentos,
      resolucao: { passos: PASSOS_DOCUMENTOS },
      servico: "turismo",
      motivo: `Frase escolhida pelo turista: “${EM_PT.documentos}”. Não é emergência: a IA respondeu com os passos.`,
    };
  }
  if (tipo !== "outro") {
    const servico = SERVICO_DO_TIPO[tipo];
    return {
      urgencia: "urgente",
      mensagemPt: EM_PT[tipo],
      servico,
      motivo: `Frase escolhida pelo turista: “${EM_PT[tipo]}” → ${NOME[servico]}.`,
    };
  }

  const bruto = (texto ?? "").trim();
  const normalizado = normalizar(bruto);
  const p = ` ${normalizado} `;
  const original = idioma === "pt" ? bruto : `[texto original em ${idioma.toUpperCase()}, sem tradução automática] ${bruto}`;
  const pista = servicoPorTexto(normalizado);

  const urgente = (servico?: Servico, pistaUsada?: string): Triagem => ({
    urgencia: "urgente",
    mensagemPt: original,
    servico,
    motivo:
      servico && pistaUsada
        ? `Texto livre com a palavra “${pistaUsada}” → ${NOME[servico]}.`
        : "Texto livre com sinal de emergência, sem serviço claro: confirme o serviço.",
  });

  // 1. emergência explícita vence tudo ("me robaron el pasaporte" é roubo, não documento)
  if (classificar(bruto) === "emergencia" || classificar(bruto) === "saude") return urgente(pista?.servico, pista?.pista);

  // 2. documento perdido não é emergência ("lost my passport" não vai para os Bombeiros)
  const falaDeDocumento = DOCUMENTOS.some((w) => p.includes(` ${w} `));
  const falaDePerda = PERDI.some((w) => p.includes(` ${w} `));
  if (falaDeDocumento && falaDePerda) {
    return {
      urgencia: "nao_urgente",
      mensagemPt: original,
      resolucao: { passos: PASSOS_DOCUMENTOS },
      servico: "turismo",
      motivo: "Texto livre sobre documento perdido. Não é emergência: a IA respondeu com os passos.",
    };
  }

  // 3. pista de serviço no texto ("afogando", "sangre", "arma"…)
  if (pista) return urgente(pista.servico, pista.pista);

  // 4. não reconheceu nada: urgente, e um humano escolhe o serviço
  return {
    urgencia: "urgente",
    mensagemPt: original,
    motivo: "Nenhuma palavra reconhecida. Na dúvida, urgente e sem serviço definido: um atendente decide.",
  };
}
