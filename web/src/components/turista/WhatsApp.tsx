"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { useIdioma } from "@/lib/idioma";
import { hrefChat } from "@/lib/rotas";
import { Folha } from "@/components/ui/Folha";

const CHAVE_CONVITE = "costa-cacau:convite-whatsapp";

/** O convite aparece uma vez por sessão; `?whatsapp=1` força de novo (demo). */
export function deveMostrarConvite(forcar: boolean) {
  if (forcar) return true;
  try {
    return sessionStorage.getItem(CHAVE_CONVITE) !== "visto";
  } catch {
    return true;
  }
}

export function marcarConviteVisto() {
  try {
    sessionStorage.setItem(CHAVE_CONVITE, "visto");
  } catch {}
}

export function ConviteWhatsApp({
  aberto,
  aoFechar,
  origemSlug,
}: {
  aberto: boolean;
  aoFechar(): void;
  origemSlug?: string | null;
}) {
  const { t, idioma } = useIdioma();
  return (
    <Folha aberta={aberto} aoFechar={aoFechar} titulo={t("conviteTitulo")} rotuloFechar={t("fechar")}>
      <div className="flex flex-col gap-3 px-5 pb-[max(20px,env(safe-area-inset-bottom))]">
        <p className="flex items-start gap-3 text-[15px] leading-snug text-ink-2">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ok-bg text-ok">
            <MessageCircle size={22} strokeWidth={2.2} />
          </span>
          {t("conviteTexto")}
        </p>
        <Link
          href={hrefChat({ idioma, origem: origemSlug })}
          onClick={aoFechar}
          className="toque mt-2 flex h-[54px] items-center justify-center gap-2 rounded-full bg-ok text-[16px] font-bold text-white shadow-2"
        >
          <MessageCircle size={20} strokeWidth={2.4} />
          {t("irWhatsapp")}
        </Link>
        <button onClick={aoFechar} className="toque h-12 rounded-full text-[15px] font-semibold text-ink-2 hover:bg-surface">
          {t("continuarAqui")}
        </button>
      </div>
    </Folha>
  );
}

/** Botão fixo acima da barra do SOS, no canto direito; no desktop, fica fora da coluna do mapa. */
export function BotaoWhatsApp({ origemSlug }: { origemSlug?: string | null }) {
  const { t, idioma } = useIdioma();
  return (
    <Link
      href={hrefChat({ idioma, origem: origemSlug })}
      aria-label={t("abrirChat")}
      title={t("abrirChat")}
      className="toque fixed bottom-[calc(max(12px,env(safe-area-inset-bottom))+76px)] right-4 z-20 flex size-14 items-center justify-center rounded-full bg-ok text-white shadow-3 lg:right-[calc(min(40vw,560px)+16px)]"
    >
      <MessageCircle size={26} strokeWidth={2.2} />
    </Link>
  );
}
