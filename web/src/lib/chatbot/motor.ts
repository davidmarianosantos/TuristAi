// Motor do chatbot (canal WhatsApp simulado). A tela chama só `boasVindas` e `responder`;
// quem pensa é o agente de IA (/api/agente/guia), e emergências vão para o agente de SOS
// e chegam à Central. Sem rede, as regras locais respondem para a conversa não travar.
import type { Estabelecimento, FichaSOS, Idioma, PraiaHoje } from "@/data/tipos";
import { chamadoDaFicha } from "@/lib/agente/chamado";
import { chamarAgente } from "@/lib/agente/cliente";
import type { MensagemAgente } from "@/lib/agente/tipos";
import { responder as responderPorRegras } from "@/lib/assistente";
import { DICIONARIOS } from "@/i18n/textos";
import { FALAS } from "./roteiro";
import type { Bloco, ContextoChat, MensagemChat, RespostaChat } from "./tipos";

export function nomeAssistente(idioma: Idioma) {
  return FALAS[idioma].nomeAssistente;
}

export function boasVindas(ctx: Pick<ContextoChat, "idioma" | "origem">): Bloco[] {
  return [{ tipo: "texto", texto: FALAS[ctx.idioma].boasVindas(ctx.origem?.nome) }];
}

/** Texto de uma mensagem do chat, para o histórico que vai ao agente. */
function textoDa(m: MensagemChat) {
  return m.blocos
    .map((b) => (b.tipo === "texto" ? b.texto : b.tipo === "lugar" ? b.lugar.nome : ""))
    .filter(Boolean)
    .join("\n");
}

async function sos(mensagem: string, ctx: ContextoChat, aoEtapa: (texto: string) => void): Promise<RespostaChat> {
  let ficha: FichaSOS | null = null;
  let orientacao = "";
  await chamarAgente("sos", { texto: mensagem, idioma: ctx.idioma, hotel: ctx.origem?.nome ?? null, local: null }, (e) => {
    if (e.tipo === "etapa") aoEtapa(e.texto);
    if (e.tipo === "ficha") ficha = e.ficha;
    if (e.tipo === "texto") orientacao += e.delta;
  });
  const f = ficha as FichaSOS | null;
  if (!f) throw new Error("sem ficha");
  await ctx.repo.enviarSOS(chamadoDaFicha(f, mensagem, "whatsapp", ctx.origem?.id));
  const blocos: Bloco[] = [{ tipo: "texto", texto: orientacao || f.orientacao }];
  if (f.passos.length) blocos.push({ tipo: "texto", texto: f.passos.map((p, i) => `${i + 1}. ${p}`).join("\n") });
  if (f.urgencia === "urgente") blocos.push({ tipo: "texto", texto: DICIONARIOS[ctx.idioma].turistaChamadoEnviado });
  return { blocos };
}

/**
 * Responde à mensagem do turista. `aoEtapa` recebe as etapas do agente
 * ("consultando praias…") para a tela mostrar no lugar do "digitando…".
 */
export async function responder(
  mensagem: string,
  idioma: Idioma,
  ctx: ContextoChat,
  historico: MensagemChat[] = [],
  aoEtapa: (texto: string) => void = () => {},
): Promise<RespostaChat> {
  const contexto = { ...ctx, idioma };
  const mensagens: MensagemAgente[] = [
    ...historico.slice(-8).map((m) => ({ papel: m.de === "turista" ? ("turista" as const) : ("agente" as const), texto: textoDa(m) })),
    { papel: "turista" as const, texto: mensagem },
  ].filter((m) => m.texto);

  let texto = "";
  let idsLugares: string[] = [];
  let idsPraias: string[] = [];
  let emergencia = false;
  try {
    await chamarAgente(
      "guia",
      { mensagens, idioma, municipioId: ctx.municipioId, alertas: await ctx.repo.alertasAtivos(ctx.municipioId), origemId: ctx.origem?.id },
      (e) => {
        if (e.tipo === "etapa") aoEtapa(e.texto);
        if (e.tipo === "texto") texto += e.delta;
        if (e.tipo === "lugares") idsLugares = e.ids;
        if (e.tipo === "praias") idsPraias = e.ids;
        if (e.tipo === "sos") emergencia = true;
      },
    );
  } catch {
    const r = await responderPorRegras(mensagem, { repo: ctx.repo, municipioId: ctx.municipioId });
    texto = r.texto[idioma];
    idsLugares = (r.lugares ?? []).map((l) => l.id);
    idsPraias = (r.praias ?? []).map((p) => p.id);
    emergencia = !!r.abrirSOS;
  }

  // no WhatsApp não há botão de SOS: a própria conversa aciona o agente de SOS e a Central
  if (emergencia) {
    try {
      return await sos(mensagem, contexto, aoEtapa);
    } catch {
      return { blocos: [{ tipo: "texto", texto: texto || DICIONARIOS[idioma].turistaChamadoEnviado }] };
    }
  }

  const lugares = (await Promise.all(idsLugares.slice(0, 3).map((id) => ctx.repo.estabelecimentoPorId(id)))).filter(
    (l): l is Estabelecimento => !!l,
  );
  const praias: PraiaHoje[] = idsPraias.length ? (await ctx.repo.praiasHoje(ctx.municipioId)).filter((p) => idsPraias.includes(p.id)) : [];
  const blocos: Bloco[] = [{ tipo: "texto", texto: texto || FALAS[idioma].padrao }];
  if (praias.length) blocos.push({ tipo: "praias", praias });
  lugares.forEach((lugar) => blocos.push({ tipo: "lugar", lugar }));
  return { blocos };
}
