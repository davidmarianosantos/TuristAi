"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";
import type { Pino } from "@/lib/mapa";

const COR = { verde: "#2e7d32", amarela: "#e5a93c", vermelha: "#c62828", cinza: "#8d959d" } as const;

const iconePraia = (cor: keyof typeof COR, ativo: boolean) =>
  L.divIcon({
    className: "",
    iconSize: [30, 36],
    iconAnchor: [5, 34],
    html: `<svg width="30" height="36" viewBox="0 0 28 32" style="filter:drop-shadow(0 1px 2px rgba(16,40,52,.35));transform:scale(${ativo ? 1.2 : 1});transform-origin:bottom left;transition:transform .15s"><rect x="2" width="2.6" height="32" fill="#212529"/><path d="M4.6 2h21l-4.2 6.5 4.2 6.5h-21z" fill="${COR[cor]}"/></svg>`,
  });

const iconeLugar = (ativo: boolean) =>
  L.divIcon({
    className: "",
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    html: `<span style="display:block;width:26px;height:26px;border-radius:50%;background:${ativo ? "#e5a93c" : "#0b4f6c"};border:3px solid #fff;box-shadow:0 1px 4px rgba(16,40,52,.4);transform:scale(${ativo ? 1.2 : 1});transition:transform .15s"></span>`,
  });

/**
 * Mapa com Leaflet direto (sem react-leaflet): o React 19 monta e desmonta duas vezes em
 * desenvolvimento, e o react-leaflet reaproveitava o container de um mapa já removido
 * ("Map container is being reused" / "getPane().appendChild"). Aqui o mapa nasce e
 * morre junto com o efeito, e os pinos são uma camada redesenhada quando mudam.
 */
export default function Mapa({
  pinos,
  centro,
  selecionado,
  aoTocarPino,
}: {
  pinos: Pino[];
  centro: { lat: number; lng: number };
  selecionado?: string | null;
  aoTocarPino(id: string): void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const camada = useRef<L.LayerGroup | null>(null);
  const aoTocar = useRef(aoTocarPino);
  aoTocar.current = aoTocarPino;

  // cria e destrói o mapa
  useEffect(() => {
    if (!el.current) return;
    const m = L.map(el.current, { center: [centro.lat, centro.lng], zoom: 14, zoomControl: false, scrollWheelZoom: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(m);
    camada.current = L.layerGroup().addTo(m);
    mapa.current = m;
    return () => {
      m.remove();
      mapa.current = null;
      camada.current = null;
    };
    // o centro só vale na criação; depois quem enquadra são os pinos
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // pinos (e o selecionado)
  useEffect(() => {
    const g = camada.current;
    if (!g) return;
    g.clearLayers();
    for (const p of pinos) {
      L.marker([p.lat, p.lng], {
        icon: p.tipo === "praia" ? iconePraia(p.bandeira, p.id === selecionado) : iconeLugar(p.id === selecionado),
        title: p.tipo === "praia" ? p.praia.nome : p.lugar.nome,
        keyboard: true,
      })
        .on("click", () => aoTocar.current(p.id))
        .addTo(g);
    }
  }, [pinos, selecionado]);

  // enquadra os pinos; a coluna/folha só ganha tamanho depois de aparecer
  useEffect(() => {
    const m = mapa.current;
    if (!m) return;
    const enquadrar = () => {
      if (!mapa.current) return;
      m.invalidateSize();
      if (pinos.length > 1) {
        m.fitBounds(L.latLngBounds(pinos.map((p) => [p.lat, p.lng])), {
          paddingTopLeft: [24, 72],
          paddingBottomRight: [24, 24],
          maxZoom: 15,
        });
      } else if (pinos.length === 1) {
        m.setView([pinos[0].lat, pinos[0].lng], 15);
      }
    };
    enquadrar();
    const id = setTimeout(enquadrar, 400);
    const ro = new ResizeObserver(() => enquadrar());
    ro.observe(m.getContainer());
    return () => {
      clearTimeout(id);
      ro.disconnect();
    };
  }, [pinos]);

  return <div ref={el} className="h-full w-full" />;
}
