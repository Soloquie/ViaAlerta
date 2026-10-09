import React, { useState } from 'react';
import { Bell, CheckCheck, Sliders, ArrowLeft, MessageSquare, RefreshCw, CheckCircle2, UserPlus, AlertTriangle } from 'lucide-react';
import { NotificacionItem, PreferenciasNotificaciones } from '../types';

interface NotificationsViewProps {
  notificaciones: NotificacionItem[];
  preferencias: PreferenciasNotificaciones;
  onMarcarTodasLeidas: () => void;
  onSavePreferencias: (prefs: PreferenciasNotificaciones) => void;
  onSelectReporteId?: (reporteId: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notificaciones,
  preferencias,
  onMarcarTodasLeidas,
  onSavePreferencias,
  onSelectReporteId,
}) => {
  const [showGestionar, setShowGestionar] = useState<boolean>(false);
  const [prefsState, setPrefsState] = useState<PreferenciasNotificaciones>(preferencias);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const unreadCount = notificaciones.filter((n) => !n.leida).length;

  const hoy = notificaciones.filter((n) => n.grupo === 'hoy');
  const ayer = notificaciones.filter((n) => n.grupo === 'ayer');
  const estaSemana = notificaciones.filter((n) => n.grupo === 'esta_semana');

  const handleSavePrefs = (e: React.FormEvent) => {
    e.preventDefault();
    onSavePreferencias(prefsState);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setShowGestionar(false);
    }, 1000);
  };

  // Helper for notification icons
  const getNotifIcon = (tipo: string) => {
    switch (tipo) {
      case 'alerta':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'comentario':
        return <MessageSquare className="w-4 h-4 text-[#0A9DC4]" />;
      case 'verificacion':
      case 'estado':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'seguidor':
        return <UserPlus className="w-4 h-4 text-purple-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  // SCREENSHOT PAGE 1: PREFERENCIAS DE NOTIFICACIONES
  if (showGestionar) {
    return (
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 bg-white animate-fade-in">
        {/* Header with Back button */}
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
          <button
            onClick={() => setShowGestionar(false)}
            aria-label="Volver a lista de notificaciones"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 leading-tight">Gestionar notificaciones</h1>
            <p className="text-xs text-slate-500">Elige qué avisos quieres recibir</p>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Puedes cambiar estas preferencias en cualquier momento.
        </p>

        <form onSubmit={handleSavePrefs} className="space-y-6">
          {/* Section: Actividad en mis reportes */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Actividad en mis reportes
            </span>

            <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <label className="flex items-center justify-between py-1.5 cursor-pointer">
                <span className="text-xs font-semibold text-slate-800">
                  Nuevo comentario en mi reporte.
                </span>
                <input
                  type="checkbox"
                  checked={prefsState.nuevoComentario}
                  onChange={(e) =>
                    setPrefsState({ ...prefsState, nuevoComentario: e.target.checked })
                  }
                  className="w-5 h-5 accent-[#0A9DC4] rounded"
                />
              </label>

              <label className="flex items-center justify-between py-1.5 cursor-pointer border-t border-slate-200">
                <span className="text-xs font-semibold text-slate-800">
                  Actualización del estado de mi reporte.
                </span>
                <input
                  type="checkbox"
                  checked={prefsState.actualizacionEstado}
                  onChange={(e) =>
                    setPrefsState({ ...prefsState, actualizacionEstado: e.target.checked })
                  }
                  className="w-5 h-5 accent-[#0A9DC4] rounded"
                />
              </label>

              <label className="flex items-center justify-between py-1.5 cursor-pointer border-t border-slate-200">
                <span className="text-xs font-semibold text-slate-800">
                  Reporte solucionado.
                </span>
                <input
                  type="checkbox"
                  checked={prefsState.reporteSolucionado}
                  onChange={(e) =>
                    setPrefsState({ ...prefsState, reporteSolucionado: e.target.checked })
                  }
                  className="w-5 h-5 accent-[#0A9DC4] rounded"
                />
              </label>
            </div>
          </div>

          {/* Section: Comunidad */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Comunidad
            </span>

            <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <label className="flex items-center justify-between py-1.5 cursor-pointer">
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">
                    Nuevos reportes cerca de mí.
                  </span>
                  <span className="text-[10px] text-slate-500">Alertas a menos de 2 km</span>
                </div>
                <input
                  type="checkbox"
                  checked={prefsState.reportesCerca}
                  onChange={(e) =>
                    setPrefsState({ ...prefsState, reportesCerca: e.target.checked })
                  }
                  className="w-5 h-5 accent-[#0A9DC4] rounded"
                />
              </label>

              <label className="flex items-center justify-between py-1.5 cursor-pointer border-t border-slate-200">
                <span className="text-xs font-semibold text-slate-800">
                  Respuestas a mis comentarios.
                </span>
                <input
                  type="checkbox"
                  checked={prefsState.respuestasComentarios}
                  onChange={(e) =>
                    setPrefsState({ ...prefsState, respuestasComentarios: e.target.checked })
                  }
                  className="w-5 h-5 accent-[#0A9DC4] rounded"
                />
              </label>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full min-h-[48px] rounded-full bg-[#0A9DC4] hover:bg-[#088ab0] text-white font-bold text-xs shadow-md transition-transform active:scale-98"
            >
              {savedSuccess ? '¡Cambios guardados!' : 'Guardar cambios'}
            </button>
            <p className="text-[10px] text-slate-400 text-center mt-2">
              Los cambios se aplicarán a tus notificaciones de la aplicación.
            </p>
          </div>
        </form>
      </div>
    );
  }

  // SCREENSHOT PAGE 5: BANDEJA DE NOTIFICACIONES
  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-white animate-fade-in">
      {/* Title & Gestionar Button */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Notificaciones</h1>
          {unreadCount > 0 && (
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {unreadCount} nuevas
            </span>
          )}
        </div>

        <button
          onClick={() => setShowGestionar(true)}
          className="text-xs font-bold text-[#0A7FA3] hover:underline flex items-center gap-1 min-h-[38px] px-2"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Gestionar</span>
        </button>
      </div>

      {/* Sub Header: Todas & Marcar leídas */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-slate-700">Todas</span>
        <button
          onClick={onMarcarTodasLeidas}
          className="font-bold text-[#0A7FA3] hover:underline flex items-center gap-1"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          <span>Marcar leídas</span>
        </button>
      </div>

      {/* Group: HOY */}
      {hoy.length > 0 && (
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Hoy
          </span>
          <div className="space-y-2">
            {hoy.map((n) => (
              <div
                key={n.id}
                onClick={() => n.reporteId && onSelectReporteId?.(n.reporteId)}
                className={`p-3.5 rounded-2xl border transition-all ${
                  n.leida
                    ? 'bg-white border-slate-200'
                    : 'bg-sky-50/50 border-[#0A9DC4]/30 shadow-xs'
                } ${n.reporteId ? 'cursor-pointer hover:bg-slate-50' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                      {getNotifIcon(n.tipo)}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 leading-tight">{n.titulo}</h3>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.mensaje}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-[10px] text-slate-400">{n.fecha}</span>
                    {!n.leida && (
                      <span className="w-2 h-2 rounded-full bg-[#0A9DC4] mt-1.5" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Group: AYER */}
      {ayer.length > 0 && (
        <div className="space-y-2 pt-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Ayer
          </span>
          <div className="space-y-2">
            {ayer.map((n) => (
              <div
                key={n.id}
                onClick={() => n.reporteId && onSelectReporteId?.(n.reporteId)}
                className={`p-3.5 rounded-2xl border bg-white border-slate-200 ${
                  n.reporteId ? 'cursor-pointer hover:bg-slate-50' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                      {getNotifIcon(n.tipo)}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 leading-tight">{n.titulo}</h3>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.mensaje}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">{n.fecha}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Group: ESTA SEMANA */}
      {estaSemana.length > 0 && (
        <div className="space-y-2 pt-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Esta semana
          </span>
          <div className="space-y-2">
            {estaSemana.map((n) => (
              <div
                key={n.id}
                className="p-3.5 rounded-2xl border bg-white border-slate-200"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                      {getNotifIcon(n.tipo)}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 leading-tight">{n.titulo}</h3>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.mensaje}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">{n.fecha}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
