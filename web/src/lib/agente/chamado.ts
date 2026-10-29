// Converte a ficha do agente de SOS nos campos do chamado que a Central já entende.
import type { ChamadoSOS, FichaSOS, TipoOcorrencia, TipoSOS } from "@/data/tipos";

const TIPO_SOS: Record<TipoOcorrencia, TipoSOS> = {
  saude: "medica",
  seguranca: "roubo",
  mar: "outro",
  perdido: "perdido",
  documento: "documentos",
  informacao: "outro",
};

export function chamadoDaFicha(
  ficha: FichaSOS,
  texto: string,
  sessaoId: string,
  origemId?: string,
): Omit<ChamadoSOS, "id" | "status" | "criadoEm"> & { status: ChamadoSOS["status"] } {
  return {
    sessaoId,
    tipo: TIPO_SOS[ficha.tipo],
    urgencia: ficha.urgencia,
    mensagemOriginal: texto,
    mensagemPt: ficha.mensagemPt,
    idiomaOriginal: ficha.idioma,
    origemId,
    servico: ficha.servico,
    motivoTriagem: ficha.motivo,
    ficha,
    ...(ficha.local ? { lat: ficha.local.lat, lng: ficha.local.lng } : {}),
    // urgente entra na fila; não urgente fica registrado como resolvido pelo agente
    status: ficha.urgencia === "urgente" ? "enviado" : "resolvido_ia",
  };
}
