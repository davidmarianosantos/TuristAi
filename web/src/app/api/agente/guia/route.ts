import type { Alerta } from "@/data/tipos";
import { rodarGuia } from "@/lib/agente/guia";
import { idiomaValido, respostaNdjson, textoCurto } from "@/lib/agente/rota";
import type { MensagemAgente } from "@/lib/agente/tipos";

export const maxDuration = 30;

export async function POST(req: Request) {
  const corpo = await req.json().catch(() => ({}));
  const mensagens: MensagemAgente[] = (Array.isArray(corpo.mensagens) ? corpo.mensagens : [])
    .slice(-10)
    .map((m: { papel?: unknown; texto?: unknown }) => ({ papel: m.papel === "agente" ? "agente" : "turista", texto: textoCurto(m.texto) }))
    .filter((m: MensagemAgente) => m.texto.trim());
  if (!mensagens.length) return new Response("mensagens vazias", { status: 400 });
  return respostaNdjson(
    rodarGuia({
      mensagens,
      idioma: idiomaValido(corpo.idioma),
      municipioId: textoCurto(corpo.municipioId, 40) || "itacare",
      alertas: (Array.isArray(corpo.alertas) ? corpo.alertas : []).slice(0, 20) as Alerta[],
      origemId: textoCurto(corpo.origemId, 40) || null,
    }),
  );
}
