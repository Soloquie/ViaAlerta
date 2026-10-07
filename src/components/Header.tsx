import React from 'react';
import { Settings, Wifi, Battery } from 'lucide-react';
import { Usuario } from '../types';

interface HeaderProps {
  usuario: Usuario;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  usuario,
  onOpenProfile,
  onOpenSettings,
}) => {
  return (
    <header className="bg-[#222428] text-white select-none shrink-0 relative z-30">
      {/* Mobile OS Status bar simulation */}
      <div className="flex items-center justify-between px-6 pt-2 pb-1 text-xs text-slate-300 font-medium tracking-tight">
        <span>9:41</span>
        <div className="flex items-center gap-1.5">
          {/* Signal bars */}
          <div className="flex items-end gap-0.5 h-3">
            <span className="w-0.5 h-1 bg-white rounded-full"></span>
            <span className="w-0.5 h-1.5 bg-white rounded-full"></span>
            <span className="w-0.5 h-2 bg-white rounded-full"></span>
            <span className="w-0.5 h-3 bg-white rounded-full"></span>
          </div>
          <Wifi className="w-3.5 h-3.5 stroke-[2.2]" />
          <Battery className="w-4 h-4 stroke-[2.2]" />
        </div>
      </div>

      {/* Main App Bar */}
      <div className="flex items-center justify-between px-4 py-2.5">
        {/* Left: User Avatar (opens Profile) */}
        <button
          onClick={onOpenProfile}
          aria-label="Abrir mi perfil de usuario"
          className="relative min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-transform active:scale-95 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A9DC4]"
        >
          <div className="w-9 h-9 rounded-full ring-2 ring-[#0A9DC4] p-[1.5px] overflow-hidden bg-slate-800">
            <img
              src={usuario.foto}
              alt={usuario.nombre}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
        </button>

        {/* Center: Brand Logo - Hexagon with branching road arrow */}
        <div className="flex items-center justify-center py-1">
          <div className="relative w-11 h-11 flex items-center justify-center" aria-label="Logo Reporte Vías">
            <svg viewBox="0 0 48 48" className="w-10 h-10 drop-shadow-sm" fill="none">
              {/* Hexagon outline */}
              <polygon
                points="24,3 44,14 44,34 24,45 4,34 4,14"
                stroke="#0A9DC4"
                strokeWidth="3.2"
                strokeLinejoin="round"
                fill="#222428"
              />
              {/* Branching road arrow icon (Y shaped split) */}
              <path
                d="M 24 35 L 24 25 M 24 25 L 16 16 M 16 16 L 16 20 M 16 16 L 20 16 M 24 25 L 32 16 M 32 16 L 32 20 M 32 16 L 28 16"
                stroke="#0A9DC4"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Right: Settings gear */}
        <button
          onClick={onOpenSettings}
          aria-label="Abrir configuración y opciones"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-200 hover:text-white transition-colors active:scale-95 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A9DC4]"
        >
          <Settings className="w-6 h-6 stroke-[1.8]" />
        </button>
      </div>
    </header>
  );
};
