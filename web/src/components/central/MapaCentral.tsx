"use client";

// Mapa escuro da Central, com Leaflet direto (mesmo motivo do Mapa.tsx do turista:
// o React 19 monta duas vezes em desenvolvimento e o react-leaflet reaproveitava o container).
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";

export type PontoMapa = {
  id: string;
  lat: number;
  lng: number;
  tipo: "chamado" | "praia" | "hospedagem";
  cor: string;
  rotulo: string;
  destaque?: boolean;
  pulsar?: boolean;
};

const CENTRO_REGIAO: [number, number] = [-14.55, -39.02]; // entre Itacaré e Ilhéus

function icone(p: PontoMapa) {
  if (p.tipo === "praia") {
    return L.divIcon({
      className: "",
      iconSize: [20, 24],
      iconAnchor: [3, 23],
      html: `<svg width="20" height="24" viewBox="0 0 28 32"><rect x="2" width="2.6" height="32" fill="#aab5bd"/><path d="M4.6 2h21l-4.2 6.5 4.2 6.5h-21z" fill="${p.cor}"/></svg>`,
    });
  }
  if (p.tipo === "hospedagem") {
    return L.divIcon({
      className: "",
      iconSize: [14, 14],
      iconAnchor: [7, 7],
      html: `<span style="display:block;width:14px;height:14px;border-radius:4px;background:#f8f9fa;border:3px solid #121619"></span>`,
    });
  }
  return L.divIcon({
    className: "",
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    html: `<span class="pino-central" style="--cor:${p.cor}" data-destaque="${!!p.destaque}" data-pulsar="${!!p.pulsar}"></span>`,
  });
}

export default function MapaCentral({
  pontos,
  aoTocar,
  zoomMax = 15,
}: {
  pontos: PontoMapa[];
  aoTocar?(id: string): void;
  zoomMax?: number;
}) {
  const el = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const camada = useRef<L.LayerGroup | null>(null);
  const tocar = useRef(aoTocar);
  tocar.current = aoTocar;
  // o que enquadrar; refeito quando o mapa muda de tamanho (ele nasce pequeno e cresce no layout)
  const enquadrar = useRef<() => void>(() => {});

  useEffect(() => {
    if (!el.current) return;
    const m = L.map(el.current, { center: CENTRO_REGIAO, zoom: 10, zoomControl: false, attributionControl: true });
    // OpenStreetMap sem chave; o tom escuro vem de um filtro CSS (.central .leaflet-tile-pane)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(m);
    L.control.zoom({ position: "bottomright" }).addTo(m);
    camada.current = L.layerGroup().addTo(m);
    mapa.current = m;
    const ro = new ResizeObserver(() => {
      m.invalidateSize();
      enquadrar.current();
    });
    ro.observe(el.current);
    return () => {
      ro.disconnect();
      m.remove();
      mapa.current = null;
      camada.current = null;
    };
  }, []);

  // redesenha os pontos e enquadra: os chamados mandam no enquadramento; sem chamado, tudo
  useEffect(() => {
    const m = mapa.current;
    const g = camada.current;
    if (!m || !g) return;
    g.clearLayers();
    for (const p of pontos) {
      const marcador = L.marker([p.lat, p.lng], {
        icon: icone(p),
        keyboard: p.tipo === "chamado",
        zIndexOffset: p.tipo === "chamado" ? (p.destaque ? 1000 : 500) : 0,
      }).bindTooltip(p.rotulo, { direction: "top", offset: [0, -10] });
      if (p.tipo === "chamado") marcador.on("click", () => tocar.current?.(p.id));
      marcador.addTo(g);
    }
    const foco = pontos.some((p) => p.destaque) ? pontos.filter((p) => p.destaque || p.tipo === "hospedagem") : pontos.filter((p) => p.tipo === "chamado");
    const alvo = foco.length ? foco : pontos;
    enquadrar.current = () => {
      if (!mapa.current) return;
      m.invalidateSize();
      if (alvo.length === 1) m.setView([alvo[0].lat, alvo[0].lng], Math.min(zoomMax, 15));
      else if (alvo.length > 1) m.fitBounds(L.latLngBounds(alvo.map((p) => [p.lat, p.lng])), { padding: [48, 48], maxZoom: zoomMax });
    };
    enquadrar.current();
  }, [pontos, zoomMax]);

  return <div ref={el} className="isolate h-full w-full" />;
}
