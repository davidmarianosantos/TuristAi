"use client";

import Image from "next/image";
import { MapPin } from "lucide-react";
import type { Idioma, Municipio } from "@/data/tipos";
import { CREDITOS_FOTOS } from "@/lib/creditos";
import { useIdioma } from "@/lib/idioma";
import { Folha } from "@/components/ui/Folha";
import { NOMES_IDIOMA } from "./Cabecalho";
import { TELEFONES } from "./SOS";
import palavra from "../../../public/img/logo-palavra.png";
import mascote from "../../../public/img/mascote.png";

/**
 * Fim da página: a areia vira mar fundo. Marca, telefones de emergência, os municípios e o idioma.
 * No celular, a barra do SOS flutua por cima do pé do rodapé; por isso o respiro grande embaixo.
 */
export function Rodape({
  municipios,
  atual,
  disponiveis = [],
  aoTrocarCidade,
  aoAbrirCreditos,
}: {
  municipios: Municipio[];
  atual: string;
  /** cidades com conteúdo viram botão; as outras ficam "em breve" */
  disponiveis?: string[];
  aoTrocarCidade?(id: string): void;
  aoAbrirCreditos(): void;
}) {
  const { t, idioma, setIdioma } = useIdioma();
  return (
    <footer className="mt-16 text-white">
      <svg aria-hidden viewBox="0 0 1440 48" preserveAspectRatio="none" className="block h-8 w-full lg:h-12">
        <path d="M0 48V26C160 6 320 6 480 22s320 22 480 6 320-16 480 2v18z" fill="var(--field)" />
      </svg>
      <div className="bg-field pb-[calc(150px+env(safe-area-inset-bottom))] lg:pb-10">
        <div className="mx-auto max-w-[640px] px-5 lg:max-w-[1280px] lg:px-8">
          <div className="grid gap-10 pt-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-end lg:gap-16 lg:pt-8">
            {/* o mascote sai da água e apresenta a marca */}
            <div className="flex items-end gap-4 lg:gap-6">
              <Image
                src={mascote}
                alt=""
                className="relative -mt-14 h-[124px] w-auto shrink-0 drop-shadow-[0_8px_16px_rgba(0,0,0,0.28)] lg:-mt-24 lg:h-[184px]"
              />
              <div className="pb-1">
                {/* só a palavra: o mascote já está ao lado, grande */}
                <Image src={palavra} alt="TuristAí" className="h-[34px] w-auto lg:h-[44px]" />
                <p className="mt-3 max-w-[30ch] text-[15px] leading-snug text-field-ink lg:text-[16px]">{t("turistaRodapeFrase")}</p>
              </div>
            </div>

            <div>
              <h2 className="text-[15px] font-bold">{t("turistaEmergencia")}</h2>
              <ul className="mt-3 grid grid-cols-3 gap-2 lg:gap-3">
                {TELEFONES.map(({ n, c, icone: Icone }) => (
                  <li key={n}>
                    <a
                      href={`tel:${n}`}
                      className="toque flex flex-col gap-2 rounded-[18px] bg-white/10 p-3.5 ring-1 ring-inset ring-white/15 hover:bg-white/15 lg:flex-row lg:items-center lg:gap-3 lg:p-4"
                    >
                      <Icone size={20} strokeWidth={2.4} className="shrink-0 text-accent" aria-hidden />
                      <span>
                        <b className="block text-[26px] font-extrabold leading-none tracking-[-0.03em] tabular-nums lg:text-[30px]">{n}</b>
                        <span className="text-[13px] text-field-ink lg:text-[14px]">{t(c)}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 grid gap-8 border-t border-white/15 pt-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
            <div>
              <h2 className="text-[13px] font-semibold text-field-ink">{t("turistaMunicipios")}</h2>
              <ul className="mt-3 flex flex-wrap gap-2 text-[14px] font-semibold">
                {municipios.map((m) => {
                  const atualAqui = m.id === atual;
                  const tem = disponiveis.includes(m.id);
                  return (
                    <li key={m.id}>
                      {tem ? (
                        <button
                          onClick={() => {
                            aoTrocarCidade?.(m.id);
                            window.scrollTo({ top: 0 });
                          }}
                          aria-current={atualAqui || undefined}
                          className={`toque flex h-9 items-center gap-1.5 rounded-full px-3.5 ${
                            atualAqui ? "bg-accent text-ink" : "bg-white/10 text-white ring-1 ring-inset ring-white/20 hover:bg-white/15"
                          }`}
                        >
                          {atualAqui && <MapPin size={14} strokeWidth={2.6} aria-hidden />}
                          {m.nome}
                        </button>
                      ) : (
                        // sem dados ainda: aparece, mas não leva a lugar nenhum
                        <span className="flex h-9 items-center gap-1.5 rounded-full px-3.5 text-white/50 ring-1 ring-inset ring-white/10">
                          {m.nome}
                          <span className="text-[11.5px] font-medium text-field-ink/70">{t("turistaEmBreve")}</span>
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
            <div>
              <h2 className="text-[13px] font-semibold text-field-ink">{t("idioma")}</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {(Object.keys(NOMES_IDIOMA) as Idioma[]).map((i) => (
                  <button
                    key={i}
                    lang={i}
                    onClick={() => setIdioma(i)}
                    aria-pressed={i === idioma}
                    className={`toque h-10 rounded-full px-4 text-[14px] font-semibold ${
                      i === idioma ? "bg-white text-field" : "bg-white/10 text-white ring-1 ring-inset ring-white/20 hover:bg-white/15"
                    }`}
                  >
                    {NOMES_IDIOMA[i]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-white/15 pt-6 text-[13px] text-field-ink lg:flex-row lg:items-center lg:justify-between">
            <p>
              © 2026 TuristAí. {t("turistaPrototipo")}.
            </p>
            <button
              onClick={aoAbrirCreditos}
              className="self-start underline decoration-white/40 underline-offset-4 hover:text-white hover:decoration-white lg:self-auto"
            >
              {t("turistaCreditos")}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

const DOMINIO_PUBLICO = { pt: "domínio público", es: "dominio público", en: "public domain" };

/** As licenças livres pedem crédito: fica aqui, fora da vitrine, a um toque do rodapé. */
export function FolhaCreditos({ aberta, aoFechar }: { aberta: boolean; aoFechar(): void }) {
  const { t, tr } = useIdioma();
  return (
    <Folha aberta={aberta} aoFechar={aoFechar} titulo={t("turistaCreditos")} rotuloFechar={t("fechar")}>
      <div className="sem-barra min-h-0 flex-auto overflow-y-auto px-5 pb-[max(20px,env(safe-area-inset-bottom))]">
        <p className="text-[14px] leading-snug text-ink-2">{t("turistaCreditosTexto")}</p>
        <ul className="mt-4 flex flex-col gap-2">
          {CREDITOS_FOTOS.map((c) => (
            <li key={c.foto}>
              <a
                href={c.pagina}
                target="_blank"
                rel="noopener noreferrer"
                className="toque flex items-center gap-3 rounded-[16px] border border-line p-2.5 hover:bg-surface"
              >
                <span className="relative size-14 shrink-0 overflow-hidden rounded-[10px] bg-surface">
                  <Image src={c.foto} alt="" fill sizes="56px" className="object-cover" />
                </span>
                <span className="min-w-0 text-[13px] leading-snug">
                  <b className="block truncate text-[14px] text-ink">{c.titulo}</b>
                  <span className="line-clamp-2 text-ink-2">
                    {c.autor}, {c.licenca === "public domain" ? tr(DOMINIO_PUBLICO) : c.licenca}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </Folha>
  );
}
