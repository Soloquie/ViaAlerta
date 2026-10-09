import React from 'react';
import { AlertTriangle, Phone, Navigation, ArrowRight } from 'lucide-react';
import { AlertaVial, Reporte } from '../types';
import { CATEGORIAS, ESTADOS, SEVERIDADES } from '../data/categories';
import { CategoryIcon } from './categoryIcons';
import { MiniMap } from './MiniMap';

interface NewsViewProps {
  alertas: AlertaVial[];
  reportes: Reporte[];
  onSelectReporte: (reporte: Reporte) => void;
  onSelectAlertaMap?: (lat: number, lng: number) => void;
}

export const NewsView: React.FC<NewsViewProps> = ({
  alertas,
  reportes,
  onSelectReporte,
  onSelectAlertaMap,
}) => {
  // Sort reports with newest first
  const reportesRecientes = [...reportes].sort((a, b) => b.id.localeCompare(a.id));

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 bg-white animate-fade-in">
      {/* Title with explicit clarifying subtitle (Mejora del test) */}
      <div className="pb-1 border-b border-slate-100">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Noticias</h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">Alertas y novedades viales de Armenia y Quindío</p>
      </div>

      {/* Road Alerts Section (Screenshot Page 12) */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Alertas viales activas ({alertas.length})
        </h2>

        {alertas.map((alerta) => (
          <div
            key={alerta.id}
            className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 shadow-xs space-y-3"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{alerta.titulo}</h3>
                  <span className="text-[10px] text-slate-400 font-medium">{alerta.fecha}</span>
                </div>
                {alerta.hashtag && (
                  <span className="text-xs font-bold text-[#0A7FA3]">{alerta.hashtag}</span>
                )}
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">{alerta.descripcion}</p>
              </div>
            </div>

            {/* Mini Map of Alert */}
            <div className="rounded-xl overflow-hidden border border-amber-200/60">
              <MiniMap
                lat={alerta.ubicacion.lat}
                lng={alerta.ubicacion.lng}
                interactive={false}
                heightClass="h-28"
                zoom={14}
                onMapClick={() => onSelectAlertaMap?.(alerta.ubicacion.lat, alerta.ubicacion.lng)}
              />
            </div>

            {/* Recommended Alternate Route & Emergency Line */}
            <div className="space-y-1.5 pt-1 text-xs">
              {alerta.rutaAlterna && (
                <div className="flex items-center gap-1.5 text-slate-700 bg-white/80 p-2 rounded-xl border border-amber-200/50">
                  <Navigation className="w-3.5 h-3.5 text-[#0A9DC4] shrink-0" />
                  <span className="font-semibold text-slate-600">Ruta alterna:</span>
                  <span className="text-slate-800 truncate">{alerta.rutaAlterna}</span>
                </div>
              )}

              {alerta.lineaEmergencias && (
                <div className="flex items-center gap-1.5 text-slate-700 bg-white/80 p-2 rounded-xl border border-amber-200/50">
                  <Phone className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span className="font-semibold text-slate-600">Línea de emergencias:</span>
                  <span className="text-red-700 font-bold">{alerta.lineaEmergencias}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Road Damage Feed */}
      <div className="space-y-3 pt-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Novedades reportadas por la comunidad
        </h2>

        <div className="space-y-2.5">
          {reportesRecientes.slice(0, 7).map((rep) => {
            const cat = CATEGORIAS[rep.categoria];
            const sev = SEVERIDADES[rep.severidad];
            const est = ESTADOS[rep.estado];

            return (
              <button
                key={rep.id}
                onClick={() => onSelectReporte(rep)}
                className="w-full text-left p-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 shadow-xs flex items-center gap-3 transition-colors group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                  style={{ backgroundColor: cat.colorFondo, borderColor: cat.colorBorde }}
                >
                  <CategoryIcon categoria={rep.categoria} size={20} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {rep.subtipo || cat.nombre}
                    </span>
                    <span className="text-[10px] text-slate-400">{rep.fechaHora.split(',')[0]}</span>
                  </div>
                  <p className="text-xs text-slate-600 truncate mt-0.5">{rep.ubicacion.direccion}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: est.colorFondo, color: est.colorTexto }}
                    >
                      ● {est.nombre}
                    </span>
                    <span
                      className="text-[9px] font-bold"
                      style={{ color: sev.colorTexto }}
                    >
                      Severidad: {sev.nombre}
                    </span>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
