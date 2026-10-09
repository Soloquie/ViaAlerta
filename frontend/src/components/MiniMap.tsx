import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapPin } from 'lucide-react';
import { CategoriaReporte } from '../types';
import { CATEGORIAS } from '../data/categories';
import { getCategorySvgHtml } from './categoryIcons';

interface MiniMapProps {
  lat: number;
  lng: number;
  categoria?: CategoriaReporte;
  interactive?: boolean; // whether marker can be dragged or clicked
  onLocationChange?: (coords: { lat: number; lng: number }) => void;
  onMapClick?: () => void;
  heightClass?: string;
  zoom?: number;
}

export const MiniMap: React.FC<MiniMapProps> = ({
  lat,
  lng,
  categoria = 'hueco',
  interactive = false,
  onLocationChange,
  onMapClick,
  heightClass = 'h-36',
  zoom = 16,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: zoom,
      zoomControl: false,
      attributionControl: false,
      dragging: interactive,
      touchZoom: interactive,
      scrollWheelZoom: false,
      doubleClickZoom: interactive,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    const cat = CATEGORIAS[categoria] || CATEGORIAS.hueco;
    const iconHtml = `
      <div style="
        width: 36px;
        height: 36px;
        background-color: ${cat.colorFondo};
        border: 2.5px solid ${cat.colorIcono};
        border-radius: 50% 50% 50% 4px;
        transform: rotate(-45deg);
        box-shadow: 0 3px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: ${interactive ? 'grab' : 'pointer'};
      ">
        <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center;">
          ${getCategorySvgHtml(categoria)}
        </div>
      </div>
    `;

    const icon = L.divIcon({
      className: 'minimap-pin',
      html: iconHtml,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    });

    const marker = L.marker([lat, lng], {
      icon,
      draggable: interactive,
    }).addTo(map);

    if (interactive && onLocationChange) {
      marker.on('dragend', () => {
        const position = marker.getLatLng();
        onLocationChange({ lat: position.lat, lng: position.lng });
      });

      map.on('click', (e) => {
        marker.setLatLng(e.latlng);
        onLocationChange({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
    }

    if (onMapClick) {
      map.on('click', () => {
        onMapClick();
      });
    }

    markerRef.current = marker;
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update marker position and view if coordinates change externally
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    markerRef.current.setLatLng([lat, lng]);
    mapRef.current.setView([lat, lng], zoom, { animate: true });
  }, [lat, lng, zoom]);

  return (
    <div className={`relative w-full ${heightClass} rounded-2xl overflow-hidden border border-slate-200 shadow-sm`}>
      <div ref={containerRef} className="w-full h-full" />
      {interactive && (
        <div className="absolute bottom-2 left-2 right-2 z-[400] bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[11px] text-slate-700 text-center font-medium shadow-sm border border-slate-200 pointer-events-none flex items-center justify-center gap-1">
          <MapPin className="w-3 h-3 text-[#0A9DC4]" />
          <span>Arrastra el pin o toca para ajustar ubicación</span>
        </div>
      )}
    </div>
  );
};
