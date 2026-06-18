"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface MapMarker {
  key: string;
  coords: [number, number];
  count: number;
  name: string;
  color: string;
  radius: number;
  stat: {
    total: number;
    active: number;
    avg_amount: number;
    total_amount: number;
  } | undefined;
}

interface MapContentProps {
  markers: MapMarker[];
  onRegionClick: (region: string) => void;
}

function formatAmount(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)} mlrd`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)} mln`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)} ming`;
  return amount.toFixed(0);
}

export default function MapContent({ markers, onRegionClick }: MapContentProps) {
  return (
    <div style={{ height: "500px", width: "100%" }}>
      <MapContainer
        center={[41.0, 64.5]}
        zoom={6}
        style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((m) => (
          <CircleMarker
            key={m.key}
            center={m.coords}
            radius={m.radius}
            pathOptions={{
              color: m.color,
              fillColor: m.color,
              fillOpacity: 0.6,
              weight: 2,
            }}
            eventHandlers={{
              click: () => onRegionClick(m.key),
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
              <div className="text-xs space-y-1 min-w-[140px]">
                <p className="font-bold text-sm">{m.name}</p>
                {m.stat ? (
                  <>
                    <p>Jami: <strong>{m.stat.total}</strong></p>
                    <p>Faol: <strong className="text-green-600">{m.stat.active}</strong></p>
                    <p>O&apos;rtacha: <strong>{formatAmount(m.stat.avg_amount)} UZS</strong></p>
                    <p>Umumiy: <strong>{formatAmount(m.stat.total_amount)} UZS</strong></p>
                  </>
                ) : (
                  <p className="text-muted-foreground">Tender yo&apos;q</p>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">Bosing → batafsil</p>
              </div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
