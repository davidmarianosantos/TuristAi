"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
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

function Ajustar({ pinos }: { pinos: Pino[] }) {
  const mapa = useMap();
  useEffect(() => {
    // o container muda de tamanho quando a folha abre: medir de novo antes de enquadrar
    const enquadrar = () => {
      mapa.invalidateSize();
      if (pinos.length > 1) {
        mapa.fitBounds(L.latLngBounds(pinos.map((p) => [p.lat, p.lng])), {
          paddingTopLeft: [24, 72],
          paddingBottomRight: [24, 24],
          maxZoom: 15,
        });
      } else if (pinos.length === 1) {
        mapa.setView([pinos[0].lat, pinos[0].lng], 15);
      }
    };
    enquadrar();
    const id = setTimeout(enquadrar, 400);
    // a coluna do mapa só ganha tamanho quando a tela cresce (ou a folha termina de abrir)
    const ro = new ResizeObserver(() => enquadrar());
    ro.observe(mapa.getContainer());
    return () => {
      clearTimeout(id);
      ro.disconnect();
    };
  }, [mapa, pinos]);
  return null;
}

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
  return (
    <MapContainer
      center={[centro.lat, centro.lng]}
      zoom={14}
      zoomControl={false}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Ajustar pinos={pinos} />
      {pinos.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          icon={p.tipo === "praia" ? iconePraia(p.bandeira, p.id === selecionado) : iconeLugar(p.id === selecionado)}
          eventHandlers={{ click: () => aoTocarPino(p.id) }}
          title={p.tipo === "praia" ? p.praia.nome : p.lugar.nome}
          keyboard
        />
      ))}
    </MapContainer>
  );
}
