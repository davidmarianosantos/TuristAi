"use client";

import { useEffect, useRef } from "react";

/**
 * Folha que sobe de baixo no celular e vira painel lateral no desktop.
 * Usa <dialog> nativo: foco preso, Esc fecha e o foco volta para quem abriu.
 */
export function Folha({
  aberta,
  aoFechar,
  titulo,
  telaCheia = false,
  rotuloFechar,
  semCabecalho = false,
  children,
}: {
  aberta: boolean;
  aoFechar(): void;
  titulo: string;
  telaCheia?: boolean;
  rotuloFechar: string;
  semCabecalho?: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  // o toque que abriu a folha não pode fechá-la: só fecha pelo fundo se o toque começou no fundo
  const comecouNoFundo = useRef(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (aberta && !d.open) {
      try {
        d.showModal();
      } catch {
        d.setAttribute("open", ""); // navegador sem showModal: abre mesmo assim
      }
    }
    if (!aberta && d.open) d.close?.() ?? d.removeAttribute("open");
  }, [aberta]);

  // Com a folha aberta, a página de trás não rola (no iOS só overflow:hidden não basta):
  // fixa o body na posição atual e devolve a rolagem ao fechar.
  useEffect(() => {
    if (!aberta) return;
    const y = window.scrollY;
    const b = document.body.style;
    const antes = { position: b.position, top: b.top, width: b.width, overflow: b.overflow };
    Object.assign(b, { position: "fixed", top: `-${y}px`, width: "100%", overflow: "hidden" });
    return () => {
      Object.assign(b, antes);
      window.scrollTo(0, y);
    };
  }, [aberta]);

  // No celular, o teclado encolhe a área visível mas não o 100dvh (iOS): a folha
  // acompanha o visualViewport para o fim da conversa e o campo não ficarem escondidos.
  useEffect(() => {
    const d = ref.current;
    const vv = window.visualViewport;
    if (!aberta || !d || !vv) return;
    const ajustar = () => {
      if (window.innerWidth >= 1024) {
        d.style.removeProperty("max-height");
        d.style.removeProperty("height");
        return;
      }
      const h = `${Math.round(vv.height)}px`;
      d.style.maxHeight = telaCheia ? h : `${Math.round(vv.height * 0.92)}px`;
      if (telaCheia) d.style.height = h;
      d.style.bottom = `${Math.max(0, window.innerHeight - vv.height - vv.offsetTop)}px`;
    };
    ajustar();
    vv.addEventListener("resize", ajustar);
    vv.addEventListener("scroll", ajustar);
    return () => {
      vv.removeEventListener("resize", ajustar);
      vv.removeEventListener("scroll", ajustar);
      d.style.removeProperty("max-height");
      d.style.removeProperty("height");
      d.style.removeProperty("bottom");
    };
  }, [aberta, telaCheia]);

  return (
    <dialog
      ref={ref}
      aria-label={titulo}
      onCancel={(e) => {
        e.preventDefault();
        aoFechar();
      }}
      // se o navegador fechar a folha por conta própria, o estado acompanha (e destrava a página)
      onClose={() => {
        if (aberta) aoFechar();
      }}
      onPointerDown={(e) => {
        comecouNoFundo.current = e.target === ref.current;
      }}
      onClick={(e) => {
        if (e.target === ref.current && comecouNoFundo.current) aoFechar();
        comecouNoFundo.current = false;
      }}
      className={[
        "folha m-0 max-w-none bg-transparent p-0 backdrop:bg-[rgba(8,40,54,0.5)]",
        "fixed inset-x-0 bottom-0 top-auto w-full",
        "lg:inset-y-0 lg:left-auto lg:right-0 lg:h-dvh lg:max-h-none lg:w-[480px]",
        telaCheia ? "h-dvh max-h-dvh" : "max-h-[92dvh]",
        // a folha é uma coluna: o painel ocupa a altura e só o miolo rola
        "open:flex open:flex-col",
      ].join(" ")}
    >
      <div
        className={[
          "folha-painel flex min-h-0 flex-auto flex-col overflow-hidden bg-card text-ink",
          telaCheia ? "" : "rounded-t-[28px] lg:rounded-l-[28px] lg:rounded-tr-none",
          "shadow-[0_-8px_32px_rgba(16,40,52,0.18)]",
        ].join(" ")}
      >
        {!semCabecalho && (
          <div className="flex items-center justify-between gap-3 px-5 pt-3 pb-2">
            {!telaCheia && <span aria-hidden className="absolute left-1/2 top-2 h-1 w-9 -translate-x-1/2 rounded-full bg-line lg:hidden" />}
            <h2 className="pt-3 text-[22px] font-bold tracking-[-0.02em]">{titulo}</h2>
            <button
              onClick={aoFechar}
              className="toque -mr-2 mt-2 flex size-11 items-center justify-center rounded-full text-ink hover:bg-surface"
              aria-label={rotuloFechar}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
                <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}
        <div className="flex min-h-0 flex-auto flex-col overscroll-contain">{children}</div>
      </div>
    </dialog>
  );
}
