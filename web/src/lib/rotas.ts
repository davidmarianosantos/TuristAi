import type { Idioma } from "@/data/tipos";

// O contexto do turista (idioma, hotel de origem do QR e cidade escolhida) viaja pela URL entre as telas.
type Contexto = { idioma: Idioma; origem?: string | null; cidade?: string | null };

const query = ({ idioma, origem, cidade }: Contexto) => {
  const p = new URLSearchParams({ lang: idioma });
  if (origem) p.set("origem", origem);
  if (cidade) p.set("cidade", cidade);
  return p.toString();
};

export const hrefChat = (c: Contexto) => `/chat?${query(c)}`;
export const hrefTurista = (c: Contexto) => `/?${query(c)}`;
