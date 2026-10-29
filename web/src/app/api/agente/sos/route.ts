import { idiomaValido, respostaNdjson, textoCurto } from "@/lib/agente/rota";
import { rodarSOS } from "@/lib/agente/sos";

export const maxDuration = 30;

export async function POST(req: Request) {
  const corpo = await req.json().catch(() => ({}));
  const texto = textoCurto(corpo.texto, 600).trim();
  if (!texto) return new Response("texto vazio", { status: 400 });
  const local =
    corpo.local && typeof corpo.local.lat === "number" && typeof corpo.local.lng === "number" ? { lat: corpo.local.lat, lng: corpo.local.lng } : null;
  return respostaNdjson(rodarSOS({ texto, idioma: idiomaValido(corpo.idioma), hotel: textoCurto(corpo.hotel, 80) || null, local }));
}
