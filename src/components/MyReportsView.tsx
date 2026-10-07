import React, { useState } from 'react';
import { ChevronRight, PlusCircle, AlertCircle } from 'lucide-react';
import { Reporte, Usuario } from '../types';
import { CATEGORIAS, ESTADOS, SEVERIDADES } from '../data/categories';
import { CategoryIcon } from './categoryIcons';

interface MyReportsViewProps {
  reportes: Reporte[];
  usuario: Usuario;
  onSelectReporte: (reporte: Reporte) => void;
  onStartReport: () => void;
}

export const MyReportsView: React.FC<MyReportsViewProps> = ({
  reportes,
  usuario,
  onSelectReporte,
  onStartReport,
}) => {
  const [filtro, setFiltro] = useState<'todos' | 'activos' | 'solucionados'>('todos');

  // Filter reports authored by the current user
  const misReportes = reportes.filter((r) => r.autorId === usuario.id);
  const activos = misReportes.filter((r) => r.estado !== 'solucionado');
  const solucionados = misReportes.filter((r) => r.estado === 'solucionado');

  const reportesFiltrados =
    filtro === 'todos' ? misReportes : filtro === 'activos' ? activos : solucionados;

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-white animate-fade-in">
      {/* Title & Subtitle (Screenshot Page 14) */}
      <div className="pb-1">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Mis reportes</h1>
        <p className="text-xs text-slate-500 mt-1">Sigue el estado de los daños que has reportado</p>
      </div>

      {/* Filter Tabs with Counters (Screenshot Page 14) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setFiltro('todos')}
          className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
            filtro === 'todos'
              ? 'bg-[#0A9DC4] text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>Todos</span>
          <span className="opacity-80">· {misReportes.length}</span>
        </button>

        <button
          onClick={() => setFiltro('activos')}
          className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
            filtro === 'activos'
              ? 'bg-[#0A9DC4] text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>Activos</span>
          <span className="opacity-80">· {activos.length}</span>
        </button>

        <button
          onClick={() => setFiltro('solucionados')}
          className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
            filtro === 'solucionados'
              ? 'bg-[#0A9DC4] text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>Solucionados</span>
          <span className="opacity-80">· {solucionados.length}</span>
        </button>
      </div>

      {/* List of Report Cards */}
      {reportesFiltrados.length === 0 ? (
        <div className="py-12 px-4 text-center rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            {filtro === 'todos'
              ? 'Aún no has hecho reportes'
              : filtro === 'activos'
              ? 'No tienes reportes activos'
              : 'No tienes reportes solucionados'}
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Toca Contribuir para crear el primero y ayudar a mejorar las vías de Armenia.
          </p>
          <button
            onClick={onStartReport}
            className="min-h-[44px] px-5 rounded-full bg-[#0A9DC4] hover:bg-[#088ab0] text-white text-xs font-bold shadow-md inline-flex items-center gap-2 transition-transform active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Reportar un problema</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {reportesFiltrados.map((rep) => {
            const cat = CATEGORIAS[rep.categoria];
            const sev = SEVERIDADES[rep.severidad];
            const est = ESTADOS[rep.estado];

            return (
              <button
                key={rep.id}
                onClick={() => onSelectReporte(rep)}
                aria-label={`Ver reporte ${cat.nombre} en ${rep.ubicacion.direccion}`}
                className="w-full text-left p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 shadow-xs transition-all active:scale-[0.99] flex items-center gap-3.5 group"
              >
                {/* Category Icon Box */}
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs"
                  style={{
                    backgroundColor: cat.colorFondo,
                    borderColor: cat.colorBorde,
                  }}
                >
                  <CategoryIcon categoria={rep.categoria} size={24} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {rep.subtipo || cat.nombre} · {sev.nombre}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 truncate mt-0.5">
                    {rep.ubicacion.direccion}
                  </p>

                  <div className="flex items-center gap-2 mt-1.5">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                      style={{
                        backgroundColor: est.colorFondo,
                        color: est.colorTexto,
                      }}
                    >
                      ● {est.nombre}
                    </span>

                    <span className="text-[10px] text-slate-500 font-medium">
                      {rep.confirmacionesSigue} confirman
                    </span>
                  </div>
                </div>

                {/* Chevron */}
                <div className="text-slate-400 group-hover:text-slate-600 shrink-0">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
