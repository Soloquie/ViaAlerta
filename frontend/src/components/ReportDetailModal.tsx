import React from 'react';
import { ArrowLeft, Check, UserPlus, MessageSquarePlus, CheckCircle2, AlertCircle, Info, MapPin } from 'lucide-react';
import { AporteCiudadano, EstadoReporte, Reporte, Usuario } from '../types';
import { CATEGORIAS, ESTADOS, SEVERIDADES } from '../data/categories';
import { MiniMap } from './MiniMap';

interface ReportDetailModalProps {
  reporte: Reporte | null;
  usuario: Usuario;
  onClose: () => void;
  onToggleSeguir: (reporteId: string) => void;
  onConfirmarDanio: (reporteId: string, tipo: 'sigue' | 'reparado') => void;
  onOpenAporteModal: (reporte: Reporte) => void;
  onOpenMapAtCoords?: (lat: number, lng: number) => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  reporte,
  usuario,
  onClose,
  onToggleSeguir,
  onConfirmarDanio,
  onOpenAporteModal,
  onOpenMapAtCoords,
}) => {
  if (!reporte) return null;

  const cat = CATEGORIAS[reporte.categoria];
  const sev = SEVERIDADES[reporte.severidad];
  const isSeguido = reporte.seguidores.includes(usuario.id);
  const esAutor = reporte.autorId === usuario.id;

  const estadosOrden: EstadoReporte[] = ['reportado', 'en_revision', 'en_proceso', 'solucionado'];
  const estadoIndex = estadosOrden.indexOf(reporte.estado);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-3 animate-fade-in">
      <div className="w-full max-w-[430px] h-[92vh] max-h-[820px] bg-white rounded-t-[28px] sm:rounded-[28px] shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white z-10">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              aria-label="Volver atrás"
              className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base font-bold text-slate-900">Detalle del reporte</h1>
          </div>

          {/* Follow Button */}
          <button
            onClick={() => onToggleSeguir(reporte.id)}
            aria-label={isSeguido ? 'Dejar de seguir reporte' : 'Seguir reporte'}
            className={`min-h-[36px] px-3.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              isSeguido
                ? 'bg-[#0A9DC4]/10 text-[#0A7FA3] border-[#0A9DC4]/30'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {isSeguido ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Siguiendo</span>
              </>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5" />
                <span>Seguir</span>
              </>
            )}
          </button>
        </div>

        {/* Scrollable Content (Screenshot Page 15) */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Main Card with Photo & Metadata */}
          <div className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
              <img
                src={reporte.foto}
                alt={cat.nombre}
                referrerPolicy="no-referrer"
                className="w-full h-44 object-cover"
              />
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-bold shadow-sm"
                  style={{
                    backgroundColor: cat.colorFondo,
                    color: cat.colorIcono,
                  }}
                >
                  {reporte.subtipo || cat.nombre}
                </span>
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-bold shadow-sm"
                  style={{
                    backgroundColor: sev.colorFondo,
                    color: sev.colorTexto,
                  }}
                >
                  {sev.nombre}
                </span>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900">{reporte.ubicacion.direccion}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {esAutor ? 'Reportado por ti' : `Reportado por ${reporte.autorNombre}`} · {reporte.fechaHora}
              </p>
              {reporte.descripcion && (
                <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-2 italic">
                  "{reporte.descripcion}"
                </p>
              )}
            </div>
          </div>

          {/* Estado del reporte Header & Timeline */}
          <div className="pt-2">
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-sm font-bold text-slate-900">Estado del reporte</h3>
              <span
                className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: ESTADOS[reporte.estado].colorFondo,
                  color: ESTADOS[reporte.estado].colorTexto,
                }}
              >
                ● {ESTADOS[reporte.estado].nombre}
              </span>
            </div>

            {/* Vertical Timeline (Screenshot Page 15) */}
            <div className="relative pl-6 space-y-4 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
              {estadosOrden.map((estKey, idx) => {
                const estConfig = ESTADOS[estKey];
                const isPassedOrCurrent = idx <= estadoIndex;
                const isCurrent = estKey === reporte.estado;
                const historyEntry = reporte.historial.find((h) => h.estado === estKey);

                return (
                  <div key={estKey} className="relative group">
                    {/* Timeline Node dot */}
                    <div
                      className={`absolute -left-6 top-0.5 w-[22px] h-[22px] rounded-full flex items-center justify-center transition-all ${
                        isCurrent
                          ? 'bg-[#0A9DC4] text-white ring-4 ring-[#0A9DC4]/20'
                          : isPassedOrCurrent
                          ? 'bg-[#0A9DC4] text-white'
                          : 'bg-white border-2 border-slate-300 text-transparent'
                      }`}
                    >
                      {isPassedOrCurrent ? (
                        <Check className="w-3 h-3 stroke-[3]" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold ${
                            isCurrent
                              ? 'text-[#0A7FA3]'
                              : isPassedOrCurrent
                              ? 'text-slate-800'
                              : 'text-slate-400'
                          }`}
                        >
                          {estConfig.nombre}
                        </span>
                        {historyEntry && (
                          <span className="text-[10px] text-slate-400">
                            · {historyEntry.fecha}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {historyEntry
                          ? historyEntry.mensaje
                          : idx > estadoIndex
                          ? 'Pendiente'
                          : estConfig.descripcion}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Simulated public entity note */}
            <div className="mt-3.5 p-2 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-1.5 text-[11px] text-slate-500">
              <Info className="w-3.5 h-3.5 text-[#0A9DC4] shrink-0 mt-0.5" />
              <span>Prototipo académico: los estados institucionales son simulados para la demostración.</span>
            </div>
          </div>

          {/* Citizen Confirmation Box (Screenshot Page 15) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900">¿El daño sigue presente?</h4>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {reporte.confirmacionesSigue} personas confirmaron que sigue ahí · {reporte.confirmacionesReparado} indicaron reparación
              </p>
            </div>

            {/* Community repaired alert if >= 3 people indicated repaired */}
            {reporte.confirmacionesReparado >= 3 && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>La comunidad indica que este daño fue reparado.</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onConfirmarDanio(reporte.id, 'sigue')}
                className={`min-h-[44px] px-3 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 border active:scale-95 ${
                  reporte.usuarioConfirmo === 'sigue'
                    ? 'bg-[#0A9DC4] text-white border-[#0A9DC4] shadow-sm'
                    : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
                }`}
              >
                {reporte.usuarioConfirmo === 'sigue' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                <span>Sí, sigue ahí</span>
              </button>

              <button
                type="button"
                onClick={() => onConfirmarDanio(reporte.id, 'reparado')}
                className={`min-h-[44px] px-3 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 border active:scale-95 ${
                  reporte.usuarioConfirmo === 'reparado'
                    ? 'bg-[#1B6B3A] text-white border-[#1B6B3A] shadow-sm'
                    : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
                }`}
              >
                {reporte.usuarioConfirmo === 'reparado' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                <span>Ya fue reparado</span>
              </button>
            </div>
          </div>

          {/* Interactive Mini Map of Location */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Ubicación en el mapa</span>
              <button
                type="button"
                onClick={() => {
                  if (onOpenMapAtCoords) {
                    onOpenMapAtCoords(reporte.ubicacion.lat, reporte.ubicacion.lng);
                  }
                  onClose();
                }}
                className="text-[11px] text-[#0A7FA3] font-bold hover:underline"
              >
                Ver en mapa general
              </button>
            </div>
            <MiniMap
              lat={reporte.ubicacion.lat}
              lng={reporte.ubicacion.lng}
              categoria={reporte.categoria}
              interactive={false}
              heightClass="h-32"
            />
          </div>

          {/* Citizen Contributions Feed */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900">
                Aportes de la comunidad ({reporte.aportes.length})
              </h4>
              <button
                type="button"
                onClick={() => onOpenAporteModal(reporte)}
                className="text-[11px] text-[#0A7FA3] font-bold flex items-center gap-1 hover:underline"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                <span>Aportar info</span>
              </button>
            </div>

            {reporte.aportes.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <p className="text-xs text-slate-500">
                  Aún no hay comentarios ni fotos adicionales en este reporte.
                </p>
                <button
                  type="button"
                  onClick={() => onOpenAporteModal(reporte)}
                  className="mt-2 text-xs text-[#0A7FA3] font-semibold hover:underline"
                >
                  Sé el primero en aportar
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {reporte.aportes.map((ap) => (
                  <div
                    key={ap.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{ap.autor}</span>
                      <span className="text-[10px] text-slate-400">{ap.fecha}</span>
                    </div>
                    <p className="text-slate-700">{ap.texto}</p>
                    {ap.foto && (
                      <div className="rounded-xl overflow-hidden mt-1.5 border border-slate-200">
                        <img src={ap.foto} alt="Aporte ciudadano" className="w-full h-28 object-cover" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-100 shrink-0">
          <button
            onClick={() => onOpenAporteModal(reporte)}
            className="w-full min-h-[48px] rounded-full bg-[#0A9DC4] hover:bg-[#088ab0] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-transform active:scale-98"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Aportar información a este reporte</span>
          </button>
        </div>
      </div>
    </div>
  );
};
