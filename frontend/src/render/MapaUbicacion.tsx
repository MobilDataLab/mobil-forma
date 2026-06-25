import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Ubicacion } from "./tipos";

// Arregla el ícono por defecto de Leaflet en bundlers (Vite) usando un marker SVG inline.
const ICONO = L.divIcon({
  className: "rnd-marker",
  html: '<div style="width:16px;height:16px;background:#006BFF;border:2px solid #fff;border-radius:50%;box-shadow:0 0 0 2px #006BFF"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export default function MapaUbicacion({
  ubicacion,
  onChange,
}: {
  ubicacion: Ubicacion;
  onChange: (u: Ubicacion) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [busca, setBusca] = useState("");
  const [buscando, setBuscando] = useState(false);

  // Inicializa el mapa una sola vez.
  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current).setView([ubicacion.lat, ubicacion.lng], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }).addTo(map);
    const marker = L.marker([ubicacion.lat, ubicacion.lng], { icon: ICONO, draggable: true }).addTo(map);
    markerRef.current = marker;

    const fijar = (lat: number, lng: number) => {
      marker.setLatLng([lat, lng]);
      onChangeRef.current({
        lat: Number(lat.toFixed(5)),
        lng: Number(lng.toFixed(5)),
        etiqueta: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      });
    };
    map.on("click", (e: L.LeafletMouseEvent) => fijar(e.latlng.lat, e.latlng.lng));
    marker.on("dragend", () => { const p = marker.getLatLng(); fijar(p.lat, p.lng); });

    mapRef.current = map;
    // Recalcular tamaño tras montar (evita el mapa gris si el contenedor cambió).
    setTimeout(() => map.invalidateSize(), 100);
    return () => { map.remove(); mapRef.current = null; markerRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Búsqueda de lugar (Nominatim, sin dependencia extra).
  const buscarLugar = async () => {
    if (!busca.trim()) return;
    setBuscando(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(busca)}`;
      const r = await fetch(url, { headers: { "Accept-Language": "es" } });
      const data = (await r.json()) as { lat: string; lon: string; display_name: string }[];
      if (data.length) {
        const lat = parseFloat(data[0].lat), lng = parseFloat(data[0].lon);
        mapRef.current?.setView([lat, lng], 14);
        markerRef.current?.setLatLng([lat, lng]);
        onChange({ lat: Number(lat.toFixed(5)), lng: Number(lng.toFixed(5)), etiqueta: data[0].display_name });
      }
    } catch { /* sin red → ignorar */ }
    finally { setBuscando(false); }
  };

  return (
    <div className="rnd-mapa-wrap">
      <div className="rnd-mapa-row">
        <input
          type="text" className="rnd-mapa-busca" placeholder="Buscar lugar (ej. Batuco, Chile)…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") buscarLugar(); }}
        />
        <button className="btn-export" onClick={buscarLugar} disabled={buscando}>
          {buscando ? "Buscando…" : "Buscar"}
        </button>
      </div>
      <div ref={ref} className="rnd-mapa" />
      <div className="field rnd-field">
        <label>Lugar (texto del JSON)</label>
        <input
          type="text" value={ubicacion.etiqueta}
          onChange={(e) => onChange({ ...ubicacion, etiqueta: e.target.value })}
        />
      </div>
      <span className="rnd-mapa-coords">Click o arrastra el marcador · {ubicacion.lat}, {ubicacion.lng}</span>
    </div>
  );
}
