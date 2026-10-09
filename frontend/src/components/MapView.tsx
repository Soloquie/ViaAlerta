import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Crosshair, Layers, ChevronDown, ChevronUp, Eye, EyeOff, X, ArrowRight, UserPlus, Check, MessageSquarePlus } from 'lucide-react';
import { CategoriaReporte, Reporte } from '../types';
import { CATEGORIAS, ESTADOS, SEVERIDADES } from '../data/categories';
import { ARMENIA_CENTER } from '../utils/geo';
import { CategoryIcon, getCategorySvgHtml } from './categoryIcons';
import { registrarEvento } from '../api/servicios';

interface MapViewProps {
  reportes: Reporte[];
  usuarioId: string;
  onSelectReporte: (reporte: Reporte) => void;
  onToggleSeguir: (reporteId: string) => void;
  onOpenAporteModal: (reporte: Reporte) => void;
  selectedReporteId?: string | null;
}

export const MapView: React.FC<MapViewProps> = ({
  reportes,
  usuarioId,
  onSelectReporte,
  onToggleSeguir,
  onOpenAporteModal,
  selectedReporteId,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const userAccuracyRef = useRef<L.Circle | null>(null);

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('todos');
  const [showSolved, setShowSolved] = useState<boolean>(false);
  const [legendOpen, setLegendOpen] = useState<boolean>(false);
  const [activeReporte, setActiveReporte] = useState<Reporte | null>(null);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Métrica: apertura del mapa
  useEffect(() => {
    registrarEvento('mapa_abierto');
  }, []);

  // Mantener la tarjeta de vista previa sincronizada con los datos del servidor (seguir, confirmaciones...)
  useEffect(() => {
    setActiveReporte((actual) => (actual ? reportes.find((r) => r.id === actual.id) ?? null : null));
  }, [reportes]);

  // Sync selectedReporteId prop
  useEffect(() => {
    if (selectedReporteId) {
      const found = reportes.find((r) => r.id === selectedReporteId);
      if (found) {
        setActiveReporte(found);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([found.ubicacion.lat, found.ubicacion.lng], 16, { animate: true });
        }
      }
    }
  }, [selectedReporteId, reportes]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [ARMENIA_CENTER.lat, ARMENIA_CENTER.lng],
      zoom: 15,
      zoomControl: false,
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
    }).addTo(map);

    // Zoom control at top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    // Close preview card on empty map tap
    map.on('click', () => {
      setActiveReporte(null);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers when reportes, category filter or solved toggle changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    const filtered = reportes.filter((rep) => {
      if (!showSolved && rep.estado === 'solucionado') return false;
      if (activeCategoryFilter !== 'todos' && rep.categoria !== activeCategoryFilter) return false;
      return true;
    });

    filtered.forEach((reporte) => {
      const cat = CATEGORIAS[reporte.categoria] || CATEGORIAS.hueco;
      const isCritical = reporte.severidad === 'critico';
      const isSolved = reporte.estado === 'solucionado';
      const isSelected = activeReporte?.id === reporte.id;

      const bgColor = isSolved ? '#DDF3E4' : cat.colorFondo;
      const borderColor = isSolved ? '#1B6B3A' : isCritical ? '#D93B3B' : cat.colorIcono;
      const borderWidth = isCritical ? '3px' : '2px';

      const iconHtml = `
        <div style="
          position: relative;
          width: 42px;
          height: 42px;
          background-color: ${bgColor};
          border: ${borderWidth} solid ${borderColor};
          border-radius: 50% 50% 50% 4px;
          transform: rotate(-45deg);
          box-shadow: 0 4px 10px rgba(0,0,0,0.28);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          ${isSelected ? 'transform: rotate(-45deg) scale(1.18); z-index: 999;' : ''}
        ">
          <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center;">
            ${getCategorySvgHtml(reporte.categoria)}
          </div>
          ${
            isCritical && !isSolved
              ? `<div style="
                  position: absolute;
                  top: -4px;
                  right: -4px;
                  width: 12px;
                  height: 12px;
                  background-color: #D93B3B;
                  border-radius: 50%;
                  border: 2px solid #ffffff;
                " class="pulse-critical"></div>`
              : ''
          }
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-category-marker',
        html: iconHtml,
        iconSize: [42, 42],
        iconAnchor: [21, 42],
        popupAnchor: [0, -38],
      });

      const marker = L.marker([reporte.ubicacion.lat, reporte.ubicacion.lng], {
        icon: customIcon,
        title: `${cat.nombre}: ${reporte.ubicacion.direccion}`,
      });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setActiveReporte(reporte);
        registrarEvento('marcador_tocado', { reporteId: reporte.id, categoria: reporte.categoria });
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo([reporte.ubicacion.lat, reporte.ubicacion.lng], { animate: true });
        }
      });

      marker.addTo(markersLayerRef.current!);
    });
  }, [reportes, activeCategoryFilter, showSolved, activeReporte]);

  // Handle GPS location
  const handleLocateUser = () => {
    setIsLocating(true);
    setLocationNotice(null);

    if (!navigator.geolocation) {
      setLocationNotice('Tu navegador no soporta geolocalización. Centrando en Armenia.');
      mapInstanceRef.current?.setView([ARMENIA_CENTER.lat, ARMENIA_CENTER.lng], 15);
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude, accuracy } = pos.coords;
        if (!mapInstanceRef.current) return;

        // Clean previous user marker
        if (userMarkerRef.current) mapInstanceRef.current.removeLayer(userMarkerRef.current);
        if (userAccuracyRef.current) mapInstanceRef.current.removeLayer(userAccuracyRef.current);

        // Add accuracy circle & pulsing dot
        const accuracyCircle = L.circle([latitude, longitude], {
          radius: Math.min(accuracy, 150),
          color: '#0A9DC4',
          fillColor: '#0A9DC4',
          fillOpacity: 0.15,
          weight: 1,
        }).addTo(mapInstanceRef.current);

        const userDot = L.circleMarker([latitude, longitude], {
          radius: 8,
          color: '#ffffff',
          fillColor: '#0A9DC4',
          fillOpacity: 1,
          weight: 3,
        }).addTo(mapInstanceRef.current);

        userMarkerRef.current = userDot;
        userAccuracyRef.current = accuracyCircle;

        mapInstanceRef.current.setView([latitude, longitude], 16, { animate: true });
        setLocationNotice('Ubicación detectada con éxito');
        setTimeout(() => setLocationNotice(null), 3000);
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err.message);
        setLocationNotice('Permiso de ubicación no concedido. Centrado en Armenia.');
        mapInstanceRef.current?.setView([ARMENIA_CENTER.lat, ARMENIA_CENTER.lng], 15);
        setTimeout(() => setLocationNotice(null), 4000);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const categoriesList: { id: string; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'hueco', label: 'Huecos' },
    { id: 'via_deteriorada', label: 'Deteriorada' },
    { id: 'inundacion', label: 'Inundación' },
    { id: 'arbol_obstaculo', label: 'Obstáculos' },
    { id: 'senalizacion', label: 'Señalización' },
    { id: 'cierre_via', label: 'Cierres' },
  ];

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-slate-100">
      {/* Top Filter Chips Bar */}
      <div className="absolute top-2 left-0 right-0 z-20 px-3 pointer-events-none">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 pointer-events-auto">
          {categoriesList.map((cat) => {
            const isSelected = activeCategoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryFilter(cat.id)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all shadow-md backdrop-blur-md min-h-[36px] flex items-center ${
                  isSelected
                    ? 'bg-[#222428] text-white ring-2 ring-[#0A9DC4]'
                    : 'bg-white/90 text-slate-700 hover:bg-white hover:text-slate-900 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating GPS and Solved Toggle Controls */}
      <div className="absolute top-14 right-3 z-20 flex flex-col gap-2">
        {/* Locate Me button */}
        <button
          onClick={handleLocateUser}
          disabled={isLocating}
          aria-label="Centrar el mapa en mi ubicación actual"
          className="w-11 h-11 bg-white hover:bg-slate-50 text-slate-800 rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95 border border-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A9DC4]"
        >
          <Crosshair className={`w-5 h-5 ${isLocating ? 'animate-spin text-[#0A9DC4]' : 'text-slate-700'}`} />
        </button>

        {/* Toggle Show Solved button */}
        <button
          onClick={() => setShowSolved(!showSolved)}
          aria-label={showSolved ? 'Ocultar reportes solucionados' : 'Mostrar reportes solucionados'}
          title={showSolved ? 'Ocultar solucionados' : 'Mostrar solucionados'}
          className={`w-11 h-11 rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95 border border-slate-200 ${
            showSolved ? 'bg-[#DDF3E4] text-[#1B6B3A] ring-2 ring-[#1B6B3A]' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          {showSolved ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
        </button>

        {/* Toggle Legend button */}
        <button
          onClick={() => setLegendOpen(!legendOpen)}
          aria-label="Ver leyenda de categorías"
          title="Ver leyenda de categorías"
          className="w-11 h-11 bg-white hover:bg-slate-50 text-slate-700 rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95 border border-slate-200"
        >
          <Layers className="w-5 h-5" />
        </button>
      </div>

      {/* Discreet Location Toast / Notice */}
      {locationNotice && (
        <div className="absolute top-16 left-3 right-16 z-20 bg-[#222428]/95 text-white text-xs px-3.5 py-2 rounded-xl shadow-lg border border-slate-700 backdrop-blur-md flex items-center justify-between animate-fade-in">
          <span>{locationNotice}</span>
          <button onClick={() => setLocationNotice(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Collapsible Category Legend (Mejora del test) */}
      {legendOpen && (
        <div className="absolute top-14 left-3 z-20 w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-3 text-xs transition-all animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 font-semibold text-slate-800">
            <span>Leyenda de categorías</span>
            <button
              onClick={() => setLegendOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700"
              aria-label="Cerrar leyenda"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-1.5 pt-2">
            {(Object.keys(CATEGORIAS) as CategoriaReporte[]).map((catKey) => {
              const cat = CATEGORIAS[catKey];
              return (
                <div key={catKey} className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-50">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 border"
                    style={{ backgroundColor: cat.colorFondo, borderColor: cat.colorIcono }}
                  >
                    <CategoryIcon categoria={catKey} size={14} />
                  </div>
                  <span className="text-slate-700 font-medium">{cat.nombre}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
            <span className="font-semibold text-red-600">Borde rojo:</span> severidad crítica.
          </div>
        </div>
      )}

      {/* Leaflet Map DOM Element */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Bottom Floating Report Preview Card (Screenshot Page 2 & 11) */}
      {activeReporte && (
        <div className="absolute bottom-2 left-2 right-2 z-30 bg-white rounded-3xl shadow-2xl border border-slate-100 p-4 transition-all animate-slide-up max-w-[420px] mx-auto">
          {/* Card header */}
          <div className="flex items-start justify-between gap-2 pb-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border"
                style={{
                  backgroundColor: CATEGORIAS[activeReporte.categoria]?.colorFondo || '#F6CFCF',
                  borderColor: CATEGORIAS[activeReporte.categoria]?.colorIcono || '#D93B3B',
                }}
              >
                <CategoryIcon categoria={activeReporte.categoria} size={22} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-sm text-slate-900 truncate">
                    {CATEGORIAS[activeReporte.categoria]?.nombre}
                  </span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: SEVERIDADES[activeReporte.severidad]?.colorFondo,
                      color: SEVERIDADES[activeReporte.severidad]?.colorTexto,
                    }}
                  >
                    {SEVERIDADES[activeReporte.severidad]?.nombre}
                  </span>
                </div>
                <p className="text-xs text-slate-600 truncate mt-0.5">{activeReporte.ubicacion.direccion}</p>
              </div>
            </div>

            <button
              onClick={() => setActiveReporte(null)}
              aria-label="Cerrar tarjeta de reporte"
              className="min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Photo preview + Status row */}
          <div className="flex items-center gap-3 py-2 border-y border-slate-100 my-1">
            <div className="w-16 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
              <img
                src={activeReporte.foto}
                alt={CATEGORIAS[activeReporte.categoria]?.nombre}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: ESTADOS[activeReporte.estado]?.colorFondo,
                    color: ESTADOS[activeReporte.estado]?.colorTexto,
                  }}
                >
                  ● {ESTADOS[activeReporte.estado]?.nombre}
                </span>
                <span className="text-[11px] text-slate-500">
                  {activeReporte.confirmacionesSigue} confirman
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-1">
                {activeReporte.descripcion || 'Sin descripción adicional'}
              </p>
            </div>
          </div>

          {/* Action buttons (Screenshot Page 2: Contribuir / Seguir + Ver Detalle) */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            {/* Follow / Following button */}
            <button
              onClick={() => onToggleSeguir(activeReporte.id)}
              aria-label={
                activeReporte.seguidores.includes(usuarioId)
                  ? 'Dejar de seguir reporte'
                  : 'Seguir este reporte'
              }
              className={`min-h-[44px] px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 border ${
                activeReporte.seguidores.includes(usuarioId)
                  ? 'bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
              }`}
            >
              {activeReporte.seguidores.includes(usuarioId) ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                  <span>Siguiendo</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5 text-slate-600" />
                  <span>Seguir</span>
                </>
              )}
            </button>

            {/* Aportar información (Antes 'Contribuir', Mejora del Test) */}
            <button
              onClick={() => onOpenAporteModal(activeReporte)}
              aria-label="Aportar información a este reporte"
              className="min-h-[44px] px-3 rounded-full text-xs font-semibold bg-white hover:bg-slate-50 text-[#0A7FA3] border border-[#0A9DC4]/40 flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <MessageSquarePlus className="w-4 h-4 text-[#0A9DC4]" />
              <span>Aportar info</span>
            </button>
          </div>

          {/* Detalle button */}
          <button
            onClick={() => onSelectReporte(activeReporte)}
            aria-label="Ver detalle completo del reporte"
            className="w-full mt-2 min-h-[42px] rounded-full bg-[#0A9DC4] hover:bg-[#088ab0] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-transform active:scale-98 shadow-sm"
          >
            <span>Ver detalle completo</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      )}
    </div>
  );
};
