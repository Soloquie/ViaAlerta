import React, { useState } from 'react';
import { ArrowLeft, User, Bell, FileText, Moon, Lock, Shield, HelpCircle, Info, ChevronRight, Play, RotateCcw, Check, Sparkles } from 'lucide-react';
import { Reporte, Usuario } from '../types';
import { ESTADOS } from '../data/categories';

interface SettingsViewProps {
  usuario: Usuario;
  reportes: Reporte[];
  onClose: () => void;
  onOpenProfile: () => void;
  onOpenMyReports: () => void;
  onAvanzarEstadoReporte: (reporteId: string) => void;
  onResetDatos: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  usuario,
  reportes,
  onClose,
  onOpenProfile,
  onOpenMyReports,
  onAvanzarEstadoReporte,
  onResetDatos,
}) => {
  const [selectedDemoReporteId, setSelectedDemoReporteId] = useState<string>(
    reportes.find((r) => r.estado !== 'solucionado')?.id || reportes[0]?.id || ''
  );
  const [demoFeedback, setDemoFeedback] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [showAyudaModal, setShowAyudaModal] = useState<boolean>(false);

  const selectedReporte = reportes.find((r) => r.id === selectedDemoReporteId) || reportes[0];

  const handleAvanzar = () => {
    if (!selectedDemoReporteId) return;
    onAvanzarEstadoReporte(selectedDemoReporteId);
    setDemoFeedback('¡Estado avanzado con éxito y notificación generada!');
    setTimeout(() => setDemoFeedback(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-3 animate-fade-in">
      <div className="w-full max-w-[430px] h-[92vh] max-h-[820px] bg-white rounded-t-[28px] sm:rounded-[28px] shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        {/* Header (Screenshot Page 4) */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              aria-label="Volver atrás"
              className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base font-bold text-slate-900">Configuración</h1>
          </div>

          <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
            ● Básico
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* User Card */}
          <div
            onClick={onOpenProfile}
            className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full ring-2 ring-[#0A9DC4] p-0.5 overflow-hidden bg-slate-200 shrink-0">
                <img
                  src={usuario.foto}
                  alt={usuario.nombre}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div>
                <h2 className="font-bold text-sm text-slate-900 leading-tight">{usuario.nombre}</h2>
                <p className="text-xs text-slate-500">{usuario.correo}</p>
              </div>
            </div>
            <div className="text-slate-400">
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>

          {/* Section: CUENTA Y PREFERENCIAS */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block px-1">
              Cuenta y preferencias
            </span>

            <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden bg-white">
              <button
                onClick={onOpenProfile}
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-slate-500" />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Cuenta</span>
                    <span className="text-[10px] text-slate-400">Datos personales y correo</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <div className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-800">Notificaciones push</span>
                </div>
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  className="w-5 h-5 accent-[#0A9DC4] rounded"
                />
              </div>

              <button
                onClick={() => {
                  onClose();
                  onOpenMyReports();
                }}
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Mis reportes</span>
                    <span className="text-[10px] text-slate-400">Ver historial de mis daños</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <div className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Moon className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-800">Apariencia</span>
                </div>
                <span className="text-xs text-slate-500 font-medium">Sistema</span>
              </div>
            </div>
          </div>

          {/* Section: MODO DEMOSTRACIÓN (CRÍTICO PARA EVALUACIÓN ACADÉMICA) */}
          <div className="space-y-2 p-4 rounded-2xl bg-sky-50/60 border border-[#0A9DC4]/30">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-[#0A9DC4]" />
              <span>Modo Demostración Académica</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Permite simular el avance de estado de cualquier reporte vial (Reportado → En revisión → En proceso → Solucionado), actualizando la línea de tiempo y enviando la notificación a sus seguidores.
            </p>

            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-semibold text-slate-700 block">
                Selecciona un reporte para avanzar:
              </label>
              <select
                value={selectedDemoReporteId}
                onChange={(e) => setSelectedDemoReporteId(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0A9DC4]"
              >
                {reportes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.ubicacion.direccion} · [{ESTADOS[r.estado].nombre}]
                  </option>
                ))}
              </select>
            </div>

            {selectedReporte && (
              <div className="text-[11px] text-slate-600 bg-white/80 p-2.5 rounded-xl border border-slate-200">
                <span>Estado actual: </span>
                <strong className="text-[#0A7FA3]">{ESTADOS[selectedReporte.estado].nombre}</strong>
              </div>
            )}

            <button
              onClick={handleAvanzar}
              className="w-full min-h-[44px] rounded-full bg-[#0A9DC4] hover:bg-[#088ab0] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-98"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Avanzar estado del reporte</span>
            </button>

            {demoFeedback && (
              <div className="p-2 bg-emerald-50 text-emerald-800 text-[11px] font-semibold rounded-xl text-center border border-emerald-200 flex items-center justify-center gap-1.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>{demoFeedback}</span>
              </div>
            )}

            <button
              onClick={() => {
                onResetDatos();
                setDemoFeedback('Datos restablecidos a valores iniciales');
                setTimeout(() => setDemoFeedback(null), 2500);
              }}
              className="w-full min-h-[38px] rounded-xl text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/80 flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer datos de prueba</span>
            </button>
          </div>

          {/* Section: PRIVACIDAD Y SEGURIDAD */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block px-1">
              Privacidad y seguridad
            </span>

            <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden bg-white">
              <div className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-slate-500" />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Privacidad</span>
                    <span className="text-[10px] text-slate-400">Permisos y geolocalización</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              <div className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Lock className="w-4 h-4 text-slate-500" />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Seguridad</span>
                    <span className="text-[10px] text-slate-400">Contraseña y acceso</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Section: SOPORTE */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block px-1">
              Soporte
            </span>

            <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden bg-white">
              <button
                onClick={() => setShowAyudaModal(true)}
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-4 h-4 text-slate-500" />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Ayuda</span>
                    <span className="text-[10px] text-slate-400">Preguntas frecuentes y contacto</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => setShowInfoModal(true)}
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <Info className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-800">Información de la app</span>
                </div>
                <span className="text-xs text-slate-400">v2.4.0</span>
              </button>
            </div>
          </div>

          {/* Logout button (simulated) */}
          <div className="pt-2 pb-4">
            <button
              onClick={() => alert('Sesión simulada para el piloto de Armenia.')}
              className="w-full min-h-[44px] text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-2xl transition-colors text-center"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      {/* Info Modal (Academic requirement) */}
      {showInfoModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-[#0A9DC4]/15 text-[#0A7FA3] flex items-center justify-center mx-auto">
              <Info className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Reporte Vías</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Prototipo académico — Universidad del Quindío, Seminario de Ingeniería, 2026.
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Desarrollado bajo metodología Design Thinking para el piloto ciudadano en Armenia, Quindío.
            </p>
            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full min-h-[44px] rounded-full bg-[#0A9DC4] text-white text-xs font-bold"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Ayuda Modal */}
      {showAyudaModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 text-left shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">¿Cómo usar Reporte Vías?</h3>
            <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <p><strong>1. Reportar:</strong> Toca el botón (+) central, selecciona la categoría, severidad y sube una foto con tu ubicación.</p>
              <p><strong>2. Visualizar:</strong> En el mapa verás los daños clasificados por colores e íconos.</p>
              <p><strong>3. Seguimiento:</strong> Puedes seguir reportes, confirmar si siguen ahí o indicar si fueron reparados.</p>
            </div>
            <button
              onClick={() => setShowAyudaModal(false)}
              className="w-full min-h-[44px] rounded-full bg-[#0A9DC4] text-white text-xs font-bold"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
