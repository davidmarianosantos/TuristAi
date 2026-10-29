// Agente de SOS: lê o texto livre do turista (PT/ES/EN), procura sinais (o que houve, com quem,
// onde, se há arma, se é agora), classifica tipo e urgência e monta a ficha da Central com um
// resumo em português. Regra de ouro: na dúvida, urgente. Tudo por regras, sem serviço externo.
import { LOCAIS } from "@/data/seed";
import type { FichaSOS, Idioma, Servico, TipoOcorrencia, Traduzido } from "@/data/tipos";
import { normalizar } from "@/lib/assistente";
import { atrativosCitados } from "./dados";
import { espera, ETAPA, etapaClassificado, pedacos, t } from "./falas";
import type { EventoAgente, PedidoSOS } from "./tipos";

export const SERVICO_DA_OCORRENCIA: Record<TipoOcorrencia, Servico> = {
  saude: "samu",
  seguranca: "policia",
  mar: "bombeiros",
  perdido: "bombeiros",
  documento: "turismo",
  informacao: "turismo",
};

// ---------- sinais: começos de palavra (ou expressões) em PT/ES/EN → nome em português ----------

type Pista = { pt: string; termos: string[] };
const p = (pt: string, ...termos: string[]): Pista => ({ pt, termos });

const VIOLENCIA = [
  p("roubo", "roub", "robaron", "robo", "robar", "robbed", "stole", "stolen", "mugged", "assalt", "asalt", "arrebat", "levaram", "se llevaron"),
  p("furto", "furt", "hurto", "pickpocket", "batedor"),
  p("agressão", "agred", "agress", "bateram", "golpearon", "pegaron", "attacked", "beat me", "hit me", "soco", "punch"),
  p("ameaça", "ameac", "amenaz", "threat"),
  p("perseguição", "me seguindo", "me esta siguiendo", "me siguen", "following me", "persegu"),
  p("golpe", "estafa", "scam", "enganaram", "enganaron"),
];
const ARMA = [p("faca", "faca", "cuchill", "navaja", "knife"), p("arma de fogo", "arma", "pistol", "revolv", "gun", "armado", "armed")];
const SAUDE_GRAVE = [
  p("não respira", "nao respira", "no respira", "not breathing", "cant breathe", "can t breathe", "nao consegue respirar", "no puede respirar"),
  p("dor no peito", "dor no peito", "dolor de pecho", "dolor en el pecho", "chest pain", "infart", "heart attack"),
  p("desmaio", "desmai", "desmay", "faint", "passed out", "inconscient", "unconscious", "nao acorda", "no despierta"),
  p("convulsão", "convuls", "seizure"),
  p("sangramento forte", "sangrando muito", "sangra mucho", "bleeding a lot", "muito sangue", "mucha sangre", "hemorrag"),
  p("possível AVC", "avc", "derrame", "stroke"),
  p("alergia grave", "garganta fechando", "garganta cerrando", "throat closing", "anafila", "anaphyla"),
];
const SAUDE = [
  p("ferimento", "ferid", "herid", "injur", "machuc", "lastim"),
  p("sangramento", "sangr", "sangue", "blood", "bleed"),
  p("fratura", "quebr", "fractur", "broke", "broken"),
  p("corte", "cortei", "me corte", "cut myself"),
  p("dor", "dor", "dolor", "pain", "doendo", "duele", "hurts"),
  p("febre", "febre", "fiebre", "fever"),
  p("vômito", "vomit"),
  p("alergia", "alergi", "allerg"),
  p("mal-estar", "passando mal", "mal estar", "me siento mal", "feel sick", "sick", "doente", "enferm", "tonto", "mareado", "dizzy"),
  p("mordida de animal", "mordid", "mordedura", "bitten", "cachorro", "perro", "dog"),
  p("intoxicação", "intoxic", "poison"),
];
const SAUDE_LEVE = [
  p("água-viva", "agua viva", "aguaviva", "medusa", "jellyfish", "caravela"),
  p("queimadura de sol", "queimadura de sol", "quemadura de sol", "quemadura solar", "sunburn", "insolac", "heatstroke"),
  p("picada de inseto", "picada", "picadura", "mosquito", "abelha", "abeja", "bee", "sting", "inseto", "insecto", "insect"),
  p("ouriço", "ourico", "erizo", "sea urchin"),
];
const MAR = [
  p("afogamento", "afog", "ahog", "drown"),
  p("correnteza", "correnteza", "corriente", "rip current", "current", "arrastad", "levado pelo mar", "se lo llevo el mar"),
  p("sumiu no mar", "sumiu no mar", "no volvio del mar", "nao voltou do mar", "didn t come back"),
];
const PERDA = ["perdi", "perdeu", "perdio", "perdido", "perdida", "perdemos", "lost", "extravi", "sumiu", "sumio", "desaparec", "missing", "nao acho", "no encuentro", "can t find", "cant find", "esqueci", "olvide", "forgot", "left my"];
const PESSOA_PERDIDA = ["me perdi", "estou perdido", "estou perdida", "estoy perdido", "estoy perdida", "i m lost", "im lost", "we re lost", "estamos perdidos", "nao sei onde estou", "no se donde estoy", "don t know where i am"];
const CRIANCA = [p("criança", "filho", "filha", "hijo", "hija", "son", "daughter", "crianc", "nino", "nina", "child", "kid", "bebe", "baby", "menino", "menina", "nene")];
const PESSOA = [
  p("familiar", "esposa", "marido", "mulher", "mujer", "husband", "wife", "mae", "madre", "mother", "mom", "pai", "padre", "father", "dad", "abuel", "irma", "herman", "brother", "sister"),
  p("amigo", "amigo", "amiga", "friend"),
];
const DOCUMENTO = [p("passaporte", "passaporte", "pasaporte", "passport"), p("documento", "documento", "dni", "rg", "identidade", "identidad", "cedula", "id card")];
const OBJETOS = [
  p("celular", "celular", "telefone", "telefono", "movil", "phone", "iphone", "smartphone"),
  p("carteira", "carteira", "cartera", "billetera", "wallet", "purse"),
  p("bolsa", "bolsa", "mochila", "bag", "backpack"),
  p("dinheiro", "dinheiro", "dinero", "money", "cash", "plata"),
  p("cartão", "cartao", "tarjeta", "card"),
  p("câmera", "camera", "camara"),
  p("chave", "chave", "llave", "keys"),
];
const INFO = [
  p("farmácia", "farmacia", "pharmacy", "drogaria", "remedio", "medicamento", "medicine"),
  p("hospital", "hospital", "clinica", "posto de saude", "upa"),
  p("consulado", "consulado", "consulate", "embaixada", "embajada", "embassy"),
  p("delegacia", "delegacia", "comisaria", "police station", "boletim", "denuncia"),
];
const AGORA = ["agora", "ahora", "now", "neste momento", "en este momento", "ainda", "todavia", "still", "urgente", "rapido", "ayuda", "socorro", "help"];
const ANTES = ["ontem", "ayer", "yesterday", "semana passada", "semana pasada", "last week", "anteontem", "anteayer"];

const LUGARES = [
  p("na praia", "praia", "playa", "beach", "areia", "arena"),
  p("no mar", "mar", "sea", "agua", "water", "onda", "ola", "wave"),
  p("na trilha", "trilha", "sendero", "trail", "mata", "selva", "jungle", "bosque", "forest", "floresta"),
  p("na rua", "rua", "calle", "street", "avenida"),
  p("no rio", "river"),
  p("na cachoeira", "cachoeira", "cascada", "waterfall"),
  p("na hospedagem", "hotel", "pousada", "posada", "quarto", "habitacion", "room"),
  p("no ônibus", "onibus", "autobus", "bus", "rodoviaria", "terminal"),
];

/** Procura cada pista no texto normalizado: expressões inteiras ou começos de palavra. */
function achar(texto: string, pistas: Pista[]) {
  const palavras = texto.split(" ").filter(Boolean);
  const achados: { pt: string; palavra: string }[] = [];
  for (const pista of pistas) {
    for (const termo of pista.termos) {
      const alvo = normalizar(termo);
      const palavra = alvo.includes(" ")
        ? texto.includes(` ${alvo} `) || texto.includes(` ${alvo}`) ? alvo : undefined
        : palavras.find((w) => (alvo.length > 3 ? w.startsWith(alvo) : w === alvo));
      if (palavra) {
        achados.push({ pt: pista.pt, palavra });
        break;
      }
    }
  }
  return achados;
}

const temAlgum = (texto: string, termos: string[]) => termos.some((x) => texto.includes(` ${normalizar(x)}`));

/** Praia ou atrativo citado pelo nome ("na Prainha", "na praia da Concha"). */
function lugarCitado(texto: string) {
  const praia = LOCAIS.find((l) => texto.includes(` ${normalizar(l.nome).replace(/^praia (do |dos |da )?/, "")}`));
  if (praia) return praia.nome.startsWith("Praia") ? `na ${praia.nome}` : `na praia ${praia.nome === "Itacarezinho" ? "de" : "da"} ${praia.nome}`;
  const atrativo = atrativosCitados(texto.trim())[0];
  return atrativo ? `${/^(Trilha|Visita|Igreja|Casa|Catedral)/.test(atrativo.nome) ? "na" : "no"} ${atrativo.nome}` : null;
}

// ---------- textos ao turista ----------

const PASSOS: Record<string, Traduzido[]> = {
  documento: [
    t("Registre a ocorrência online na Delegacia Virtual da Bahia.", "Haz la denuncia en línea en la Delegacia Virtual de Bahia.", "File a report online at the Bahia Virtual Police Station."),
    t("Se for estrangeiro, avise o consulado do seu país.", "Si eres extranjero, avisa al consulado de tu país.", "If you are a foreigner, contact your country's consulate."),
    t("A recepção da hospedagem pode ajudar com cópias e contatos.", "La recepción de tu alojamiento puede ayudarte con copias y contactos.", "Your hotel's front desk can help with copies and contacts."),
  ],
  furtoAntigo: [
    t("Registre a ocorrência na Delegacia Virtual da Bahia.", "Haz la denuncia en la Delegacia Virtual de Bahia.", "File a report at the Bahia Virtual Police Station."),
    t("Bloqueie o celular com a operadora e os cartões com o banco.", "Bloquea el móvil con tu operadora y las tarjetas con el banco.", "Block your phone with your carrier and your cards with your bank."),
    t("Se levaram documentos, avise o consulado do seu país.", "Si se llevaron documentos, avisa al consulado de tu país.", "If documents were taken, contact your country's consulate."),
  ],
  objeto: [
    t("Refaça o caminho e pergunte nos lugares por onde passou.", "Rehaz el camino y pregunta en los lugares por donde pasaste.", "Retrace your steps and ask at the places you visited."),
    t("Avise a recepção da sua hospedagem.", "Avisa en la recepción de tu alojamiento.", "Let your hotel's front desk know."),
    t("Celular ou cartões: bloqueie com a operadora e o banco.", "Móvil o tarjetas: bloquéalos con la operadora y el banco.", "Phone or cards: block them with your carrier and bank."),
  ],
  "água-viva": [
    t("Lave com água do mar, nunca com água doce, e não esfregue.", "Lava con agua de mar, nunca con agua dulce, y no frotes.", "Rinse with seawater, never fresh water, and don't rub."),
    t("Vinagre alivia; o salva-vidas costuma ter.", "El vinagre alivia; el socorrista suele tener.", "Vinegar helps; lifeguards usually have some."),
    t("Falta de ar ou inchaço forte: ligue 192.", "Si te falta el aire o se hincha mucho: llama al 192.", "Shortness of breath or strong swelling: call 192."),
  ],
  "queimadura de sol": [
    t("Vá para a sombra e beba bastante água.", "Ve a la sombra y bebe mucha agua.", "Get into the shade and drink plenty of water."),
    t("Compressas frias aliviam a pele.", "Las compresas frías alivian la piel.", "Cool compresses soothe the skin."),
    t("Febre alta, confusão ou bolhas grandes: ligue 192.", "Fiebre alta, confusión o ampollas grandes: llama al 192.", "High fever, confusion or large blisters: call 192."),
  ],
  "picada de inseto": [
    t("Lave com água e sabão e use gelo enrolado num pano.", "Lava con agua y jabón y usa hielo envuelto en un paño.", "Wash with soap and water and apply ice wrapped in cloth."),
    t("Inchaço no rosto ou falta de ar: ligue 192 na hora.", "Si se hincha la cara o falta el aire: llama al 192 ya.", "Facial swelling or trouble breathing: call 192 right away."),
  ],
  ouriço: [
    t("Não aperte o local; tire só os espinhos visíveis, com cuidado.", "No aprietes la zona; quita solo las púas visibles, con cuidado.", "Don't squeeze the area; remove only visible spines, carefully."),
    t("Água morna alivia a dor. Se inflamar, procure atendimento.", "El agua tibia alivia el dolor. Si se inflama, busca atención.", "Warm water eases the pain. If it gets inflamed, see a doctor."),
  ],
  farmácia: [
    t("A recepção da hospedagem indica a farmácia mais próxima.", "La recepción de tu alojamiento te indica la farmacia más cercana.", "Your hotel's front desk can point you to the nearest pharmacy."),
    t("Se for urgência médica, ligue 192.", "Si es una urgencia médica, llama al 192.", "For a medical emergency, call 192."),
  ],
  consulado: [
    t("A maioria dos consulados fica em Salvador; o site do seu país tem o contato.", "La mayoría de los consulados está en Salvador; la web de tu país tiene el contacto.", "Most consulates are in Salvador; your country's website has the contact."),
    t("A recepção da hospedagem pode ajudar a ligar.", "La recepción de tu alojamiento puede ayudarte a llamar.", "Your hotel's front desk can help you call."),
  ],
  delegacia: [
    t("Ocorrências sem violência podem ser registradas na Delegacia Virtual da Bahia.", "Los casos sin violencia se pueden denunciar en la Delegacia Virtual de Bahia.", "Non-violent incidents can be reported at the Bahia Virtual Police Station."),
    t("Se estiver em perigo agora, ligue 190.", "Si estás en peligro ahora, llama al 190.", "If you are in danger now, call 190."),
  ],
};
PASSOS.hospital = PASSOS["farmácia"];

const ORIENTA = {
  arma: t(
    "A Central foi avisada. Não reaja e não tente recuperar nada: vá para um lugar seguro e movimentado e, se estiver em perigo, ligue 190.",
    "La Central fue avisada. No reacciones ni intentes recuperar nada: ve a un lugar seguro y con gente y, si estás en peligro, llama al 190.",
    "The Central has been alerted. Don't resist or try to get anything back: go somewhere safe and busy and, if you are in danger, call 190.",
  ),
  seguido: t(
    "A Central foi avisada. Entre numa loja ou num lugar com gente e ligue 190.",
    "La Central fue avisada. Entra en una tienda o un lugar con gente y llama al 190.",
    "The Central has been alerted. Go into a shop or a busy place and call 190.",
  ),
  seguranca: t(
    "A Central foi avisada. Vá para um lugar seguro e movimentado; se o suspeito ainda estiver por perto, ligue 190.",
    "La Central fue avisada. Ve a un lugar seguro y con gente; si el sospechoso sigue cerca, llama al 190.",
    "The Central has been alerted. Move to a safe, busy place; if the suspect is still nearby, call 190.",
  ),
  mar: t(
    "A Central foi avisada. Não entre na água para resgatar: jogue algo que boie, chame o salva-vidas e ligue 193.",
    "La Central fue avisada. No entres al agua a rescatar: lanza algo que flote, llama al socorrista y al 193.",
    "The Central has been alerted. Don't go into the water to rescue: throw something that floats, call the lifeguard and 193.",
  ),
  crianca: t(
    "A Central foi avisada. Fique onde a criança foi vista pela última vez e avise salva-vidas e comerciantes por perto. Ligue 193.",
    "La Central fue avisada. Quédate donde viste al niño por última vez y avisa a socorristas y comerciantes cercanos. Llama al 193.",
    "The Central has been alerted. Stay where the child was last seen and tell lifeguards and nearby shops. Call 193.",
  ),
  perdido: t(
    "A Central foi avisada. Fique onde está, economize bateria e, se puder, ligue 193.",
    "La Central fue avisada. Quédate donde estás, ahorra batería y, si puedes, llama al 193.",
    "The Central has been alerted. Stay where you are, save battery and, if you can, call 193.",
  ),
  peito: t(
    "Ligue 192 agora. Deixe a pessoa sentada, afrouxe as roupas e não a deixe sozinha. A Central foi avisada.",
    "Llama al 192 ahora. Deja a la persona sentada, afloja su ropa y no la dejes sola. La Central fue avisada.",
    "Call 192 now. Keep the person seated, loosen their clothing and don't leave them alone. The Central has been alerted.",
  ),
  sangue: t(
    "Pressione o ferimento com um pano limpo e ligue 192. A Central foi avisada.",
    "Presiona la herida con un paño limpio y llama al 192. La Central fue avisada.",
    "Press on the wound with a clean cloth and call 192. The Central has been alerted.",
  ),
  grave: t(
    "Ligue 192 agora e siga as orientações do atendente. A Central foi avisada.",
    "Llama al 192 ahora y sigue las indicaciones del operador. La Central fue avisada.",
    "Call 192 now and follow the operator's instructions. The Central has been alerted.",
  ),
  saude: t(
    "A Central foi avisada. Se piorar ou for grave, ligue 192 agora.",
    "La Central fue avisada. Si empeora o es grave, llama al 192 ahora.",
    "The Central has been alerted. If it gets worse or is serious, call 192 now.",
  ),
  resolver: t("Não parece emergência. Veja como resolver:", "No parece una emergencia. Mira cómo resolverlo:", "This doesn't look like an emergency. Here's what to do:"),
  duvida: t(
    "A Central foi avisada e um atendente vai te responder. Em perigo, ligue 190, 192 ou 193.",
    "La Central fue avisada y un agente te responderá. Si hay peligro, llama al 190, 192 o 193.",
    "The Central has been alerted and an agent will reply. If in danger, call 190, 192 or 193.",
  ),
};

const IDIOMA_PT: Record<Idioma, string> = { pt: "português", es: "espanhol", en: "inglês" };
const lista = (xs: string[]) => (xs.length <= 1 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} e ${xs.at(-1)}`);
const maiuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------- a triagem ----------

export function triar(pedido: PedidoSOS): FichaSOS {
  const texto = ` ${normalizar(pedido.texto)} `;
  const violencia = achar(texto, VIOLENCIA);
  const arma = achar(texto, ARMA);
  const grave = achar(texto, SAUDE_GRAVE);
  const saude = achar(texto, SAUDE);
  const leve = achar(texto, SAUDE_LEVE);
  const mar = achar(texto, MAR);
  const crianca = achar(texto, CRIANCA);
  const pessoa = achar(texto, PESSOA);
  const documento = achar(texto, DOCUMENTO);
  const objetos = achar(texto, OBJETOS);
  const info = achar(texto, INFO);
  const lugares = achar(texto, LUGARES);
  const perda = temAlgum(texto, PERDA);
  const perdidoSozinho = temAlgum(texto, PESSOA_PERDIDA);
  const agora = temAlgum(texto, AGORA);
  const antes = temAlgum(texto, ANTES);
  const onde = lugarCitado(texto) ?? lugares[0]?.pt ?? null;

  const sinais = [...violencia, ...arma, ...grave, ...mar, ...saude, ...leve, ...crianca, ...pessoa, ...documento, ...objetos, ...info]
    .map((s) => `“${s.palavra}” → ${s.pt}`)
    .concat(onde ? [`local: ${onde.replace(/^(na|no|em) /, "")}`] : [])
    .concat(antes ? ["já aconteceu (não é agora)"] : agora ? ["acontecendo agora"] : []);

  const local = onde ? `, ${onde}` : "";
  let tipo: TipoOcorrencia = "informacao";
  let urgencia: FichaSOS["urgencia"] = "urgente";
  let resumo = "";
  let orientacao = ORIENTA.duvida;
  let passos: Traduzido[] = [];
  let motivo = "";
  let semServico = false;

  if (mar.length) {
    tipo = "mar";
    resumo = `${{ afogamento: "Possível afogamento", correnteza: "Pessoa levada pela correnteza" }[mar[0].pt] ?? "Pessoa sumiu no mar"}${local}`;
    orientacao = ORIENTA.mar;
    motivo = `Risco na água (“${mar[0].palavra}”): urgente, Bombeiros.`;
  } else if (grave.length) {
    tipo = "saude";
    resumo = `Emergência médica: ${lista(grave.map((g) => g.pt))}${local}`;
    orientacao = grave[0].pt === "dor no peito" ? ORIENTA.peito : grave[0].pt === "sangramento forte" ? ORIENTA.sangue : ORIENTA.grave;
    motivo = `Risco à vida (“${grave[0].palavra}”): urgente, SAMU.`;
  } else if (violencia.length || arma.length) {
    tipo = "seguranca";
    const fato = violencia[0]?.pt ?? "ameaça";
    const coisas = [...objetos, ...documento].map((o) => o.pt);
    resumo = `${maiuscula(fato)}${coisas.length ? ` de ${lista(coisas)}` : ""}${arma.length ? ` com ${arma[0].pt}` : ""}${local}${antes ? ", não foi agora" : ""}`;
    if (antes && !arma.length && !agora && ["furto", "roubo", "golpe"].includes(fato)) {
      // já passou e não há risco agora: o agente orienta o boletim e os bloqueios, fora da fila urgente
      urgencia = "nao_urgente";
      orientacao = ORIENTA.resolver;
      passos = PASSOS.furtoAntigo;
      motivo = `${maiuscula(fato)} que já aconteceu (“${violencia[0].palavra}”), sem arma nem risco agora: não urgente, com os passos do boletim.`;
    } else {
      orientacao = arma.length ? ORIENTA.arma : fato === "perseguição" ? ORIENTA.seguido : ORIENTA.seguranca;
      motivo = arma.length ? `Arma citada (“${arma[0].palavra}”): urgente, Polícia.` : `${maiuscula(fato)} (“${violencia[0].palavra}”): urgente, Polícia.`;
    }
  } else if (perdidoSozinho || ((crianca.length || pessoa.length) && perda)) {
    tipo = "perdido";
    resumo = `${crianca.length ? "Criança perdida" : pessoa.length ? `${pessoa[0].pt === "amigo" ? "Amigo" : "Familiar"} desaparecido` : "Turista perdido"}${local}`;
    orientacao = crianca.length ? ORIENTA.crianca : ORIENTA.perdido;
    motivo = `${crianca.length ? "Criança desaparecida" : "Pessoa perdida"}: urgente, Bombeiros.`;
  } else if (leve.length && !saude.some((s) => s.pt !== "dor")) {
    tipo = "saude";
    urgencia = "nao_urgente";
    resumo = `${maiuscula(leve[0].pt)}, sem sinal de gravidade${local}`;
    orientacao = ORIENTA.resolver;
    passos = PASSOS[leve[0].pt] ?? PASSOS["picada de inseto"];
    motivo = `Caso leve (“${leve[0].palavra}”) sem sinal de gravidade: o agente orienta; se piorar, 192.`;
  } else if (saude.length) {
    tipo = "saude";
    resumo = `Problema de saúde: ${lista(saude.map((s) => s.pt))}${local}`;
    orientacao = saude.some((s) => s.pt === "sangramento") ? ORIENTA.sangue : ORIENTA.saude;
    motivo = `Sinal de saúde (“${saude[0].palavra}”): urgente, o SAMU confirma a gravidade.`;
  } else if (documento.length) {
    tipo = "documento";
    urgencia = "nao_urgente";
    resumo = `Perda de ${lista(documento.map((d) => d.pt))}, sem violência${local}`;
    orientacao = ORIENTA.resolver;
    passos = PASSOS.documento;
    motivo = "Documento perdido, sem violência nem risco: não urgente, o agente orienta os passos.";
  } else if (objetos.length && perda) {
    urgencia = "nao_urgente";
    resumo = `Perda de ${lista(objetos.map((o) => o.pt))}, sem violência${local}`;
    orientacao = ORIENTA.resolver;
    passos = PASSOS.objeto;
    motivo = "Objeto perdido, sem sinal de crime ou risco: não urgente.";
  } else if (info.length) {
    urgencia = "nao_urgente";
    resumo = `Pedido de informação: ${lista(info.map((x) => x.pt))}`;
    orientacao = ORIENTA.resolver;
    passos = PASSOS[info[0].pt] ?? PASSOS["farmácia"];
    motivo = "Pedido de informação, sem sinal de emergência: não urgente.";
  } else {
    semServico = true;
    resumo = `Pedido de ajuda sem detalhes claros${local}`;
    motivo = "Nenhum sinal claro no texto. Na dúvida, urgente e sem serviço definido: um atendente decide.";
  }

  const i = pedido.idioma;
  return {
    tipo,
    urgencia,
    resumoPt: resumo,
    // sem tradutor externo: a Central recebe o sentido em português e, ao lado, o texto original
    mensagemPt: i === "pt" ? pedido.texto : `${resumo}. (leitura automática do texto em ${IDIOMA_PT[i]})`,
    idioma: i,
    servico: semServico ? undefined : SERVICO_DA_OCORRENCIA[tipo],
    motivo,
    orientacao: orientacao[i],
    passos: passos.map((x) => x[i]),
    local: pedido.local ?? null,
    hotel: pedido.hotel ?? null,
    sinais,
  };
}

const ETAPA_SINAIS = t("sinais encontrados", "señales encontradas", "cues found");
const ETAPA_SEM_SINAIS = t("nenhum sinal claro: tratando como urgente", "ninguna señal clara: se trata como urgente", "no clear cue: treating as urgent");
const ETAPA_RESUMO = t("resumo em português para a Central", "resumen en portugués para la Central", "Portuguese summary for the Central");

/** Transmite as etapas, a ficha e a orientação ao turista. */
export async function* rodarSOS(pedido: PedidoSOS): AsyncGenerator<EventoAgente> {
  const i = pedido.idioma;
  yield { tipo: "etapa", texto: ETAPA.lendo[i] };
  await espera(350);
  const ficha = triar(pedido);
  const pistas = ficha.sinais.filter((s) => s.startsWith("“")).map((s) => s.split("→ ")[1]);
  yield { tipo: "etapa", texto: pistas.length ? `${ETAPA_SINAIS[i]}: ${[...new Set(pistas)].join(" · ")}` : ETAPA_SEM_SINAIS[i] };
  await espera(400);
  yield { tipo: "etapa", texto: etapaClassificado(ficha.urgencia, ficha.tipo, i) };
  await espera(250);
  if (i !== "pt") yield { tipo: "etapa", texto: ETAPA_RESUMO[i] };
  yield { tipo: "etapa", texto: ficha.urgencia === "urgente" ? ETAPA.paraCentral[i] : ETAPA.resolvendo[i] };
  yield { tipo: "ficha", ficha };
  for (const pedaco of pedacos(ficha.orientacao)) {
    yield { tipo: "texto", delta: pedaco };
    await espera(30);
  }
  yield { tipo: "fim" };
}
