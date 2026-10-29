import type { Idioma } from "@/data/tipos";

// O contexto do turista (idioma e hotel de origem do QR) viaja pela URL entre as telas.
type Contexto = { idioma: Idioma; origem?: string | null };

const query = ({ idioma, origem }: Contexto) => {
  const p = new URLSearchParams({ lang: idioma });
  if (origem) p.set("origem", origem);
  return p.toString();
};

export const hrefChat = (c: Contexto) => `/chat?${query(c)}`;
export const hrefTurista = (c: Contexto) => `/?${query(c)}`;
