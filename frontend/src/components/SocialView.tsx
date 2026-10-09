import React, { useState } from 'react';
import { UserPlus, Check, MapPin, Award, ChevronRight } from 'lucide-react';
import { Reporte, Usuario } from '../types';
import { CATEGORIAS } from '../data/categories';
import { CategoryIcon } from './categoryIcons';

interface SocialViewProps {
  usuarios: Usuario[];
  reportes: Reporte[];
  seguidosIds: string[];
  onToggleSeguirUsuario: (usuarioId: string) => void;
  onSelectReporte: (reporte: Reporte) => void;
}

export const SocialView: React.FC<SocialViewProps> = ({
  usuarios,
  reportes,
  seguidosIds,
  onToggleSeguirUsuario,
  onSelectReporte,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(usuarios[0]?.id || '');

  const usuarioSeleccionado = usuarios.find((u) => u.id === selectedUserId) || usuarios[0];
  const isSeguido = seguidosIds.includes(usuarioSeleccionado?.id);

  // Reports created by this user
  const reportesUsuario = reportes.filter((r) => r.autorId === usuarioSeleccionado?.id);

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-white animate-fade-in">
      {/* Title & Clarifying Subtitle (Mejora del test) */}
      <div className="pb-1 border-b border-slate-100">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Social</h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">Comunidad ciudadana activa en Armenia y Quindío</p>
      </div>

      {/* Citizen Selector Horizontal Carousel */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {usuarios.map((u) => {
          const isSelected = u.id === usuarioSeleccionado?.id;
          return (
            <button
              key={u.id}
              onClick={() => setSelectedUserId(u.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border whitespace-nowrap min-h-[40px] ${
                isSelected
                  ? 'bg-[#222428] text-white border-[#222428] shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <img
                src={u.foto}
                alt={u.nombre}
                referrerPolicy="no-referrer"
                className="w-5 h-5 rounded-full object-cover"
              />
              <span>{u.nombre}</span>
            </button>
          );
        })}
      </div>

      {/* User Profile Card (Screenshot Page 9 & 10) */}
      {usuarioSeleccionado && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200 space-y-3.5 shadow-xs">
            {/* Top row: Avatar, Name, Handle, Follow Button */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full ring-2 ring-[#0A9DC4] p-0.5 overflow-hidden bg-slate-200 shrink-0">
                  <img
                    src={usuarioSeleccionado.foto}
                    alt={usuarioSeleccionado.nombre}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-sm font-bold text-slate-900 leading-tight">
                      {usuarioSeleccionado.nombre}
                    </h2>
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded-full">
                      <Award className="w-3 h-3 text-emerald-600" />
                      <span>Protector activo</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">{usuarioSeleccionado.usuario}</p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-red-500" />
                    <span>{usuarioSeleccionado.ciudad}</span>
                  </p>
                </div>
              </div>

              {/* Follow Button */}
              <button
                onClick={() => onToggleSeguirUsuario(usuarioSeleccionado.id)}
                aria-label={isSeguido ? 'Dejar de seguir a este ciudadano' : 'Seguir ciudadano'}
                className={`min-h-[38px] px-4 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs active:scale-95 ${
                  isSeguido
                    ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    : 'bg-[#0A9DC4] hover:bg-[#088ab0] text-white'
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

            {/* Bio */}
            <p className="text-xs text-slate-600 leading-relaxed">
              {usuarioSeleccionado.biografia}
            </p>

            {/* 4 Quantitative Stats (Screenshot Page 9) */}
            <div className="grid grid-cols-4 gap-2 pt-1 border-t border-slate-200 text-center">
              <div className="p-1.5">
                <span className="block text-base font-extrabold text-slate-900 tabular-nums">
                  {usuarioSeleccionado.alertasCount}
                </span>
                <span className="block text-[10px] font-medium text-slate-500">alertas</span>
              </div>
              <div className="p-1.5">
                <span className="block text-base font-extrabold text-slate-900 tabular-nums">
                  {usuarioSeleccionado.zonasCount}
                </span>
                <span className="block text-[10px] font-medium text-slate-500">zonas</span>
              </div>
              <div className="p-1.5">
                <span className="block text-base font-extrabold text-slate-900 tabular-nums">
                  {usuarioSeleccionado.incidentesCount}
                </span>
                <span className="block text-[10px] font-medium text-slate-500">incidentes</span>
              </div>
              <div className="p-1.5">
                <span className="block text-base font-extrabold text-slate-900 tabular-nums">
                  {usuarioSeleccionado.actualizacionesCount}
                </span>
                <span className="block text-[10px] font-medium text-slate-500">actualiz.</span>
              </div>
            </div>

            {/* Specialties / Interests tags */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px] text-slate-600">
              <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-medium">
                Seguridad vial
              </span>
              <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-medium">
                Movilidad urbana
              </span>
              <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-medium">
                Reportes ciudadanos
              </span>
            </div>
          </div>

          {/* Incidents reported by this user (Screenshot Page 9 & 10) */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Incidentes reportados ({reportesUsuario.length})
              </h3>
            </div>

            {reportesUsuario.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                No hay incidentes reportados recientemente por este usuario.
              </p>
            ) : (
              <div className="space-y-2">
                {reportesUsuario.map((rep) => {
                  const cat = CATEGORIAS[rep.categoria];
                  return (
                    <button
                      key={rep.id}
                      onClick={() => onSelectReporte(rep)}
                      className="w-full text-left p-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 flex items-center gap-3 transition-colors group shadow-xs"
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                        style={{ backgroundColor: cat.colorFondo, borderColor: cat.colorBorde }}
                      >
                        <CategoryIcon categoria={rep.categoria} size={18} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {rep.subtipo || cat.nombre}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">{rep.ubicacion.direccion}</p>
                      </div>

                      <span className="text-[10px] text-slate-400 font-medium shrink-0">
                        {rep.fechaHora.split(',')[0]}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
