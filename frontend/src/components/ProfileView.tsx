import React, { useRef, useState } from 'react';
import { ArrowLeft, Camera, Edit2, MapPin, Mail, Phone, ShieldCheck, Check, Upload } from 'lucide-react';
import { Usuario } from '../types';
import { compressImage } from '../utils/imageCompressor';

interface ProfileViewProps {
  usuario: Usuario;
  onClose: () => void;
  /** Guarda el perfil en el backend; debe lanzar un error si no se pudo guardar. */
  onUpdateUsuario: (updated: Usuario) => Promise<void>;
  onGoToMyReports: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  usuario,
  onClose,
  onUpdateUsuario,
  onGoToMyReports,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showImageSourcePicker, setShowImageSourcePicker] = useState<boolean>(false);

  // Form edit states (Screenshot Page 6)
  const [nombre, setNombre] = useState<string>(usuario.nombre);
  const [userHandle, setUserHandle] = useState<string>(usuario.usuario);
  const [correo, setCorreo] = useState<string>(usuario.correo);
  const [telefono, setTelefono] = useState<string>(usuario.telefono);
  const [ciudad, setCiudad] = useState<string>(usuario.ciudad);
  const [biografia, setBiografia] = useState<string>(usuario.biografia);
  const [foto, setFoto] = useState<string>(usuario.foto);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 400, 0.85);
      setFoto(compressed);
      setShowImageSourcePicker(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    const updated: Usuario = {
      ...usuario,
      nombre,
      usuario: userHandle,
      correo,
      telefono,
      ciudad,
      biografia,
      foto,
    };
    setIsSaving(true);
    setSaveError(null);
    try {
      await onUpdateUsuario(updated);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsEditing(false);
      }, 800);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'No se pudieron guardar los cambios.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-3 animate-fade-in">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageFile}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleImageFile}
        className="hidden"
      />

      <div className="w-full max-w-[430px] h-[92vh] max-h-[820px] bg-white rounded-t-[28px] sm:rounded-[28px] shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <button
              onClick={isEditing ? () => setIsEditing(false) : onClose}
              aria-label="Volver atrás"
              className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base font-bold text-slate-900">
              {isEditing ? 'Editar perfil' : 'Mi perfil'}
            </h1>
          </div>

          <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
            ● Básico
          </span>
        </div>

        {/* SCREENSHOT PAGE 6: EDITAR PERFIL */}
        {isEditing ? (
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* Avatar header card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full ring-2 ring-[#0A9DC4] p-0.5 overflow-hidden bg-slate-200 shrink-0">
                  <img
                    src={foto}
                    alt={nombre}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 leading-tight">{nombre}</h3>
                  <p className="text-xs text-slate-500">Toca para actualizar la foto</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowImageSourcePicker(true)}
                className="px-3.5 py-1.5 rounded-full border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-white"
              >
                Editar
              </button>
            </div>

            {/* Image Picker Modal / Sheet (Screenshot Page 7 & 8) */}
            {showImageSourcePicker && (
              <div className="p-4 rounded-2xl bg-sky-50/50 border border-[#0A9DC4]/30 space-y-2.5 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">Añadir imágenes</h4>
                  <button
                    type="button"
                    onClick={() => setShowImageSourcePicker(false)}
                    className="text-xs text-slate-400 hover:text-slate-700"
                  >
                    Cerrar
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">Elige cómo quieres actualizar tu foto de perfil:</p>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-left hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#0A9DC4]/10 text-[#0A7FA3] flex items-center justify-center">
                        <Upload className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">Elegir desde el dispositivo</span>
                        <span className="text-[10px] text-slate-500">Selecciona desde la galería</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-[#0A7FA3] bg-[#0A9DC4]/10 px-1.5 py-0.5 rounded">RECOMENDADO</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-200 flex items-center gap-2.5 text-left hover:bg-slate-50"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#0A9DC4]/10 text-[#0A7FA3] flex items-center justify-center">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Tomar una foto</span>
                      <span className="text-[10px] text-slate-500">Abre la cámara del dispositivo</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Form Fields: Personal info */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Información personal
              </span>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Nombre</label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0A9DC4]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Nombre de usuario</label>
                  <input
                    type="text"
                    value={userHandle}
                    onChange={(e) => setUserHandle(e.target.value)}
                    required
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0A9DC4]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Correo</label>
                <input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0A9DC4]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0A9DC4]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Ubicación</label>
                  <input
                    type="text"
                    value={ciudad}
                    onChange={(e) => setCiudad(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0A9DC4]"
                  />
                </div>
              </div>
            </div>

            {/* About You */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Sobre ti
              </span>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Biografía</label>
                <textarea
                  value={biografia}
                  onChange={(e) => setBiografia(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0A9DC4] resize-none"
                />
              </div>
            </div>

            {/* Privacy row */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Privacidad
              </span>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Visibilidad del perfil</span>
                  <span className="text-[10px] text-slate-500">Cualquier persona puede encontrarte</span>
                </div>
                <span className="text-xs font-bold text-[#0A7FA3] bg-[#0A9DC4]/10 px-2.5 py-1 rounded-full">
                  Público
                </span>
              </div>
            </div>

            <div className="pt-3 space-y-2">
              {saveError && (
                <p role="alert" className="p-2 rounded-xl bg-red-50 border border-red-200 text-[11px] font-semibold text-red-700">
                  {saveError}
                </p>
              )}
              <button
                type="submit"
                disabled={isSaving}
                className="w-full min-h-[48px] rounded-full bg-[#0A9DC4] hover:bg-[#088ab0] text-white font-bold text-xs shadow-md transition-transform active:scale-98 disabled:opacity-70 disabled:cursor-wait"
              >
                {saveSuccess ? '¡Cambios guardados!' : isSaving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        ) : (
          /* PROFILE DETAILS VIEW */
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* Top User Hero */}
            <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-4 text-center">
              <div className="relative w-20 h-20 mx-auto">
                <div className="w-full h-full rounded-full ring-3 ring-[#0A9DC4] p-1 overflow-hidden bg-slate-200 shadow-md">
                  <img
                    src={usuario.foto}
                    alt={usuario.nombre}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </div>

              <div>
                <h2 className="text-base font-extrabold text-slate-900">{usuario.nombre}</h2>
                <p className="text-xs text-slate-500 font-medium">{usuario.usuario}</p>
                <p className="text-xs text-slate-600 flex items-center justify-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  <span>{usuario.ciudad}</span>
                </p>
              </div>

              <p className="text-xs text-slate-600 max-w-xs mx-auto italic">
                "{usuario.biografia}"
              </p>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-200 text-center">
                <div>
                  <span className="block text-base font-extrabold text-slate-900 tabular-nums">
                    {usuario.alertasCount}
                  </span>
                  <span className="block text-[10px] text-slate-500">alertas</span>
                </div>
                <div>
                  <span className="block text-base font-extrabold text-slate-900 tabular-nums">
                    {usuario.zonasCount}
                  </span>
                  <span className="block text-[10px] text-slate-500">zonas</span>
                </div>
                <div>
                  <span className="block text-base font-extrabold text-slate-900 tabular-nums">
                    {usuario.incidentesCount}
                  </span>
                  <span className="block text-[10px] text-slate-500">incidentes</span>
                </div>
                <div>
                  <span className="block text-base font-extrabold text-slate-900 tabular-nums">
                    {usuario.actualizacionesCount}
                  </span>
                  <span className="block text-[10px] text-slate-500">actualiz.</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2.5">
              <button
                onClick={() => setIsEditing(true)}
                className="w-full min-h-[46px] rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Edit2 className="w-4 h-4 text-[#0A9DC4]" />
                <span>Editar mis datos personales</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onGoToMyReports();
                }}
                className="w-full min-h-[46px] rounded-2xl bg-[#0A9DC4] hover:bg-[#088ab0] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-transform active:scale-98"
              >
                <span>Ver y gestionar mis reportes</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
