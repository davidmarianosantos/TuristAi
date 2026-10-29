"use client";

import Image from "next/image";
import { Clock, MapPin, Navigation, Phone, ShieldCheck, Star } from "lucide-react";
import { useState } from "react";
import type { Estabelecimento } from "@/data/tipos";
import { mostraCadastur } from "@/lib/cadastur";
import { useIdioma } from "@/lib/idioma";
import { distanciaKm, formatarDistancia } from "@/lib/mapa";
import { Folha } from "@/components/ui/Folha";
import { CATEGORIA, Selo } from "./Lugares";

/** Detalhes de um lugar recomendado: o que oferece, endereço, horário e contato. */
export function FolhaLugar({
  lugar,
  de,
  aoFechar,
}: {
  lugar: Estabelecimento | null;
  de?: { lat: number; lng: number };
  aoFechar(): void;
}) {
  const { t, tr, idioma } = useIdioma();
  // guarda o último aberto para a folha não esvaziar enquanto fecha
  const [ultimo, setUltimo] = useState(lugar);
  if (lugar && lugar !== ultimo) setUltimo(lugar);
  const l = lugar ?? ultimo;

  const linha = "flex items-start gap-3 py-3";
  const rotulo = "block text-[12.5px] font-semibold text-ink-2";

  return (
    <Folha aberta={!!lugar} aoFechar={aoFechar} titulo={l?.nome ?? ""} rotuloFechar={t("fechar")}>
      {l && (
        <div className="sem-barra min-h-0 flex-auto overflow-y-auto px-5 pb-[max(20px,env(safe-area-inset-bottom))]">
          {l.foto && (
            <div className="relative mb-4 aspect-[16/9] overflow-hidden rounded-[20px] bg-sand">
              <Image src={l.foto} alt="" fill sizes="(min-width: 1024px) 440px, 100vw" className="object-cover" />
            </div>
          )}

          <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[14px] text-ink-2">
            {l.temSelo && (
              <span className="inline-flex items-center gap-1.5 font-semibold text-cacau">
                <Selo tamanho={20} />
                {tr({ pt: "Selo TuristAí", es: "Sello TuristAí", en: "TuristAí Seal" })}
              </span>
            )}
            <span>{tr(CATEGORIA[l.categoria])}</span>
            {mostraCadastur(l) && (
              <span className="inline-flex items-center gap-1 font-semibold text-mata">
                <ShieldCheck size={14} strokeWidth={2.4} />
                {t("cadasturOk")}
              </span>
            )}
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-[15px]">
            <Star size={17} strokeWidth={2.2} className="fill-accent text-accent" />
            <b className="font-extrabold tabular-nums">{l.avaliacao.nota.toLocaleString(idioma === "pt" ? "pt-BR" : idioma, { minimumFractionDigits: 1 })}</b>
            <span className="text-ink-2">({t("avaliacoes", { n: l.avaliacao.total })})</span>
          </p>
          <p className="mt-3 text-[16px] leading-relaxed">{tr(l.descricao)}.</p>

          {l.precos.length > 0 && (
            <>
              <h3 className="mt-5 text-[15px] font-bold">{t("turistaOferece")}</h3>
              {/* só o que oferece: preço depende do cadastro de cada lugar e não aparece */}
              <ul className="mt-2 flex flex-wrap gap-2">
                {l.precos.map((p) => (
                  <li key={p.item.pt} className="rounded-full bg-sand px-3 py-1.5 text-[14px]">
                    {tr(p.item)}
                  </li>
                ))}
              </ul>
            </>
          )}

          <dl className="mt-4 divide-y divide-line border-y border-line">
            {l.endereco && (
              <div className={linha}>
                <MapPin size={18} strokeWidth={2.2} className="mt-0.5 shrink-0 text-cacau" aria-hidden />
                <div>
                  <dt className={rotulo}>{t("turistaEndereco")}</dt>
                  <dd className="text-[15px]">
                    {l.endereco}
                    {de && <span className="text-ink-2"> · {formatarDistancia(distanciaKm(de, l), idioma)}</span>}
                  </dd>
                </div>
              </div>
            )}
            {l.horario && (
              <div className={linha}>
                <Clock size={18} strokeWidth={2.2} className="mt-0.5 shrink-0 text-cacau" aria-hidden />
                <div>
                  <dt className={rotulo}>{t("turistaHorario")}</dt>
                  <dd className="text-[15px]">{tr(l.horario)}</dd>
                </div>
              </div>
            )}
            {l.telefone && (
              <div className={linha}>
                <Phone size={18} strokeWidth={2.2} className="mt-0.5 shrink-0 text-cacau" aria-hidden />
                <div>
                  <dt className={rotulo}>{t("turistaTelefone")}</dt>
                  <dd className="text-[15px] tabular-nums">{l.telefone}</dd>
                </div>
              </div>
            )}
          </dl>

          <div className="mt-5 grid grid-cols-2 gap-2">
            {l.telefone && (
              <a
                href={`tel:+55${l.telefone.replace(/\D/g, "")}`}
                className="toque flex h-[52px] items-center justify-center gap-2 rounded-full bg-cacau text-[15px] font-semibold text-white shadow-2"
              >
                <Phone size={18} strokeWidth={2.2} aria-hidden />
                {t("turistaLigar")}
              </a>
            )}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`toque flex h-[52px] items-center justify-center gap-2 rounded-full border-2 border-cacau text-[15px] font-semibold text-cacau ${l.telefone ? "" : "col-span-2"}`}
            >
              <Navigation size={18} strokeWidth={2.2} aria-hidden />
              {t("turistaComoChegar")}
            </a>
          </div>
        </div>
      )}
    </Folha>
  );
}
