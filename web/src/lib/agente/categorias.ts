import type { Categoria } from "@/data/tipos";

/** Nome da categoria em português, para o modelo (ele traduz ao responder). */
export const CATEGORIA_PT: Record<Categoria, string> = {
  hotel: "hotel",
  pousada: "pousada",
  receptivo: "agência de passeios",
  condutor: "guia de turismo",
  restaurante: "restaurante",
  barraca: "barraca de praia",
  comercio: "loja",
  vida_noturna: "vida noturna",
  transporte: "transporte",
};
