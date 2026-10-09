import React, { useState } from 'react';
import { Eye, EyeOff, LogIn, RefreshCw, ShieldCheck, UserPlus } from 'lucide-react';
import { mensajeDeError } from '../api/cliente';
import { iniciarSesion, registrarse } from '../api/servicios';
import { Usuario } from '../types';

interface AuthScreenProps {
  onAutenticado: (usuario: Usuario) => void;
  /** Muestra el acceso rápido con la cuenta de demostración (solo si el servidor tiene MODO_DEMO=true). */
  modoDemo: boolean;
  /** Mensaje opcional, p. ej. cuando la sesión expiró. */
  aviso?: string | null;
}

const CUENTA_DEMO = { identificador: 'martin.martinez@email.com', contrasena: 'ReporteVias2026!' };

export const LogoHexagono: React.FC<{ className?: string }> = ({ className = 'w-14 h-14' }) => (
  <svg viewBox="0 0 48 48" className={`${className} drop-shadow-md`} fill="none" aria-hidden="true">
    <polygon points="24,3 44,14 44,34 24,45 4,34 4,14" stroke="#0A9DC4" strokeWidth="3.2" strokeLinejoin="round" fill="#ffffff" />
    <path
      d="M 24 35 L 24 25 M 24 25 L 16 16 M 16 16 L 16 20 M 16 16 L 20 16 M 24 25 L 32 16 M 32 16 L 32 20 M 32 16 L 28 16"
      stroke="#0A9DC4"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const claseInput =
  'w-full p-3 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0A9DC4] placeholder:text-slate-400';
const claseEtiqueta = 'text-[11px] font-semibold text-slate-600 block mb-1';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAutenticado, modoDemo, aviso }) => {
  const [modo, setModo] = useState<'login' | 'registro'>('login');
  const [identificador, setIdentificador] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [nombre, setNombre] = useState('');
  const [usuario, setUsuario] = useState('');
  const [correo, setCorreo] = useState('');
  const [aceptaDatos, setAceptaDatos] = useState(false);
  const [verContrasena, setVerContrasena] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cambiarModo = (nuevo: 'login' | 'registro') => {
    setModo(nuevo);
    setError(null);
    setContrasena('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enviando) return;
    setError(null);
    if (modo === 'registro' && !aceptaDatos) {
      setError('Debes autorizar el tratamiento de tus datos personales para registrarte.');
      return;
    }
    setEnviando(true);
    try {
      const sesion =
        modo === 'login'
          ? await iniciarSesion(identificador, contrasena)
          : await registrarse({ nombre, usuario, correo, contrasena, aceptoTratamientoDatos: aceptaDatos });
      onAutenticado(sesion);
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  };

  const usarCuentaDemo = () => {
    setModo('login');
    setIdentificador(CUENTA_DEMO.identificador);
    setContrasena(CUENTA_DEMO.contrasena);
    setError(null);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#222428]">
      {/* Marca */}
      <div className="px-6 pt-10 pb-8 flex flex-col items-center text-center shrink-0">
        <LogoHexagono className="w-16 h-16" />
        <h1 className="mt-4 text-2xl font-extrabold text-white tracking-tight">Reporte Vías</h1>
        <p className="mt-1 text-xs text-slate-400 max-w-[260px]">
          Reporta daños en las vías de Armenia y sigue su estado junto a tu comunidad.
        </p>
      </div>

      {/* Hoja blanca con el formulario */}
      <div className="flex-1 bg-white rounded-t-[28px] overflow-y-auto px-5 pt-5 pb-6 animate-slide-up">
        <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-slate-100 mb-5" role="tablist" aria-label="Acceso">
          {(['login', 'registro'] as const).map((opcion) => (
            <button
              key={opcion}
              type="button"
              role="tab"
              aria-selected={modo === opcion}
              onClick={() => cambiarModo(opcion)}
              className={`min-h-[40px] rounded-full text-xs font-bold transition-all ${
                modo === opcion ? 'bg-white text-[#0A7FA3] shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {opcion === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          ))}
        </div>

        {aviso && (
          <p className="mb-4 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-800">{aviso}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {modo === 'registro' && (
            <>
              <div>
                <label htmlFor="nombre" className={claseEtiqueta}>Nombre completo</label>
                <input
                  id="nombre"
                  className={claseInput}
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  autoComplete="name"
                  placeholder="Ej: Laura Gómez"
                  required
                  minLength={2}
                  maxLength={120}
                />
              </div>
              <div>
                <label htmlFor="usuario" className={claseEtiqueta}>Nombre de usuario</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">@</span>
                  <input
                    id="usuario"
                    className={`${claseInput} pl-7`}
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value.replace(/^@/, '').toLowerCase())}
                    autoComplete="username"
                    placeholder="laura.gomez"
                    required
                    minLength={3}
                    maxLength={50}
                    pattern="[a-z0-9._]+"
                    title="Solo letras minúsculas, números, puntos y guion bajo"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="correo" className={claseEtiqueta}>Correo electrónico</label>
                <input
                  id="correo"
                  type="email"
                  className={claseInput}
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  autoComplete="email"
                  placeholder="tucorreo@ejemplo.com"
                  required
                />
              </div>
            </>
          )}

          {modo === 'login' && (
            <div>
              <label htmlFor="identificador" className={claseEtiqueta}>Correo o usuario</label>
              <input
                id="identificador"
                className={claseInput}
                value={identificador}
                onChange={(e) => setIdentificador(e.target.value)}
                autoComplete="username"
                placeholder="tucorreo@ejemplo.com o @usuario"
                required
              />
            </div>
          )}

          <div>
            <label htmlFor="contrasena" className={claseEtiqueta}>Contraseña</label>
            <div className="relative">
              <input
                id="contrasena"
                type={verContrasena ? 'text' : 'password'}
                className={`${claseInput} pr-11`}
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
                required
                minLength={modo === 'registro' ? 8 : 1}
              />
              <button
                type="button"
                onClick={() => setVerContrasena((v) => !v)}
                aria-label={verContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                {verContrasena ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {modo === 'registro' && <span className="text-[10px] text-slate-400">Mínimo 8 caracteres, con letras y números.</span>}
          </div>

          {modo === 'registro' && (
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={aceptaDatos}
                onChange={(e) => setAceptaDatos(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#0A9DC4] shrink-0"
              />
              <span className="text-[11px] text-slate-600 leading-relaxed">
                Autorizo el tratamiento de mis datos personales para el funcionamiento de Reporte Vías, conforme a la
                <strong className="text-slate-800"> Ley 1581 de 2012</strong>. Mis reportes y mi nombre de usuario serán visibles para la comunidad.
              </span>
            </label>
          )}

          {error && (
            <p role="alert" className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-[11px] font-semibold text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full min-h-[48px] rounded-full bg-[#0A9DC4] hover:bg-[#088ab0] text-white font-bold text-sm shadow-lg shadow-[#0A9DC4]/25 transition-transform active:scale-98 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait"
          >
            {enviando ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : modo === 'login' ? (
              <LogIn className="w-4 h-4" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            <span>{enviando ? 'Un momento…' : modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</span>
          </button>
        </form>

        {modoDemo && modo === 'login' && (
          <div className="mt-5 p-3.5 rounded-2xl bg-sky-50/70 border border-[#0A9DC4]/30 space-y-2">
            <p className="text-[11px] text-slate-600 leading-relaxed">
              <strong className="text-slate-800">Demostración académica:</strong> puedes entrar con la cuenta de Martín Martínez para explorar los reportes de prueba.
            </p>
            <button
              type="button"
              onClick={usarCuentaDemo}
              className="w-full min-h-[40px] rounded-full bg-white border border-[#0A9DC4]/40 text-[#0A7FA3] text-xs font-bold hover:bg-sky-50"
            >
              Usar cuenta de demostración
            </button>
          </div>
        )}

        <p className="mt-5 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 text-center">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Prototipo académico · Universidad del Quindío</span>
        </p>
      </div>
    </div>
  );
};
