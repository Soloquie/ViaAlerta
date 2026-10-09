import React, { useRef, useState } from 'react';
import { X, Camera, Send, MessageSquarePlus, RefreshCw } from 'lucide-react';
import { AporteCiudadano, Reporte, Usuario } from '../types';
import { CATEGORIAS } from '../data/categories';
import { compressImage } from '../utils/imageCompressor';

interface ContributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reporte: Reporte;
  usuario: Usuario;
  onAddAporte: (reporteId: string, aporte: AporteCiudadano) => void;
}

export const ContributeModal: React.FC<ContributeModalProps> = ({
  isOpen,
  onClose,
  reporte,
  usuario,
  onAddAporte,
}) => {
  const [texto, setTexto] = useState<string>('');
  const [foto, setFoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 900, 0.75);
      setFoto(compressed);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!texto.trim()) return;

    setIsSubmitting(true);
    const nuevoAporte: AporteCiudadano = {
      id: `ap_${Date.now()}`,
      autor: usuario.nombre,
      autorFoto: usuario.foto,
      texto: texto.trim(),
      foto: foto || undefined,
      fecha: 'Ahora mismo',
    };

    onAddAporte(reporte.id, nuevoAporte);
    setIsSubmitting(false);
    setTexto('');
    setFoto(null);
    onClose();
  };

  const cat = CATEGORIAS[reporte.categoria];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-fade-in">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoUpload}
        className="hidden"
      />

      <div className="w-full max-w-[430px] bg-white rounded-t-[28px] sm:rounded-[28px] p-5 shadow-2xl flex flex-col max-h-[85vh] animate-slide-up">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#0A9DC4]/15 text-[#0A7FA3] flex items-center justify-center">
              <MessageSquarePlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">Aportar información</h2>
              <p className="text-[11px] text-slate-500 font-medium">Suma datos o estado actual a este reporte</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Clear banner for target report (Test Improvement requirement) */}
        <div className="my-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Aportando al reporte:
          </span>
          <p className="font-bold text-slate-800 truncate mt-0.5">
            {cat.nombre} · {reporte.ubicacion.direccion}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 flex-1 overflow-y-auto">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Tu aporte o novedad
            </label>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Ej: 'Pusieron cinta amarilla preventiva' o 'El hueco se profundizó tras el aguacero'..."
              rows={3}
              required
              className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0A9DC4] resize-none"
            />
          </div>

          {/* Optional photo */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Foto complementaria (opcional)
            </label>
            {foto ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                <img src={foto} alt="Aporte" className="w-full h-32 object-cover" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/80 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Cambiar</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-3 border border-slate-200 rounded-xl flex items-center justify-center gap-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <Camera className="w-4 h-4 text-[#0A9DC4]" />
                <span>Agregar foto actualizada</span>
              </button>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!texto.trim() || isSubmitting}
              className={`w-full min-h-[46px] rounded-full text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all ${
                texto.trim()
                  ? 'bg-[#0A9DC4] hover:bg-[#088ab0] text-white active:scale-98'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Publicar aporte</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
