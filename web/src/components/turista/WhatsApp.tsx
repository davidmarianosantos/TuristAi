"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useIdioma } from "@/lib/idioma";
import { hrefChat } from "@/lib/rotas";
import { Folha } from "@/components/ui/Folha";
import { LogoWhatsApp, VERDE_WHATSAPP } from "@/components/ui/LogoWhatsApp";

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
  const desktop = useDesktop();

  // Esc fecha o cartão do desktop (a folha do celular já trata o Esc sozinha)
  useEffect(() => {
    if (!aberto || !desktop) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && aoFechar();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [aberto, desktop, aoFechar]);

  const conteudo = (
    <>
      <p className="flex items-start gap-3 text-[15px] leading-snug text-ink-2">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full" style={{ background: VERDE_WHATSAPP }}>
          <LogoWhatsApp tamanho={28} />
        </span>
        {t("conviteTexto")}
      </p>
      <Link
        href={hrefChat({ idioma, origem: origemSlug })}
        onClick={aoFechar}
        className="toque mt-2 flex h-[54px] items-center justify-center gap-2 rounded-full text-[16px] font-bold text-white shadow-2 lg:h-12 lg:text-[15px]"
        style={{ background: VERDE_WHATSAPP }}
      >
        <LogoWhatsApp tamanho={22} />
        {t("irWhatsapp")}
      </Link>
      <button onClick={aoFechar} className="toque h-12 rounded-full text-[15px] font-semibold text-ink-2 hover:bg-surface lg:h-10">
        {t("continuarAqui")}
      </button>
    </>
  );

  // desktop: cartão pequeno abaixo dos botões do topo, sem escurecer a página
  if (desktop) {
    if (!aberto) return null;
    return (
      <div
        role="dialog"
        aria-labelledby="convite-titulo"
        className="aparece fixed right-[max(32px,calc((100vw-1280px)/2+48px))] top-[116px] z-40 flex w-[360px] origin-top-right flex-col gap-3 rounded-[24px] bg-card p-5 shadow-3"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="convite-titulo" className="text-[18px] font-bold tracking-[-0.02em]">
            {t("conviteTitulo")}
          </h2>
          <button
            onClick={aoFechar}
            aria-label={t("fechar")}
            className="toque -mr-2 -mt-1 flex size-9 shrink-0 items-center justify-center rounded-full text-ink hover:bg-surface"
          >
            <X size={18} strokeWidth={2.4} />
          </button>
        </div>
        {conteudo}
      </div>
    );
  }

  return (
    <Folha aberta={aberto} aoFechar={aoFechar} titulo={t("conviteTitulo")} rotuloFechar={t("fechar")}>
      <div className="flex flex-col gap-3 px-5 pb-[max(20px,env(safe-area-inset-bottom))]">{conteudo}</div>
    </Folha>
  );
}

/** true a partir de 1024 px (o "lg" do Tailwind), acompanhando quando a janela muda de tamanho. */
function useDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const medir = () => setDesktop(mq.matches);
    medir();
    mq.addEventListener("change", medir);
    return () => mq.removeEventListener("change", medir);
  }, []);
  return desktop;
}

/** Botão fixo acima da barra do SOS, no canto direito (celular e tablet). No desktop vira o LinkWhatsAppLateral. */
export function BotaoWhatsApp({ origemSlug }: { origemSlug?: string | null }) {
  const { t, idioma } = useIdioma();
  return (
    <Link
      href={hrefChat({ idioma, origem: origemSlug })}
      aria-label={t("abrirChat")}
      title={t("abrirChat")}
      className="toque fixed bottom-[calc(max(12px,env(safe-area-inset-bottom))+76px)] right-4 z-20 flex size-14 items-center justify-center rounded-full text-white shadow-3 lg:hidden"
      style={{ background: VERDE_WHATSAPP }}
    >
      <LogoWhatsApp tamanho={30} />
    </Link>
  );
}

/** No desktop, o caminho para o WhatsApp fica na barra do topo, ao lado do SOS. */
export function LinkWhatsAppTopo({ origemSlug }: { origemSlug?: string | null }) {
  const { t, idioma } = useIdioma();
  return (
    <Link
      href={hrefChat({ idioma, origem: origemSlug })}
      aria-label={t("abrirChat")}
      className="toque flex h-10 items-center gap-2 rounded-full px-4 text-[14px] font-bold text-white shadow-1"
      style={{ background: VERDE_WHATSAPP }}
    >
      <LogoWhatsApp tamanho={20} />
      WhatsApp
    </Link>
  );
}
