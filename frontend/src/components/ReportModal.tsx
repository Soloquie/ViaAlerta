import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, X, Camera, RefreshCw, AlertTriangle, CheckCircle2, ChevronRight, MapPin, Edit3 } from 'lucide-react';
import { CategoriaReporte, Reporte, SeveridadReporte, Usuario } from '../types';
import { CATEGORIAS, SEVERIDADES } from '../data/categories';
import { ARMENIA_CENTER, formatFechaHora, reverseGeocode } from '../utils/geo';
import { buscarDuplicado, crearReporte, registrarEvento } from '../api/servicios';
import { ErrorApi, mensajeDeError } from '../api/cliente';
import { compressImage } from '../utils/imageCompressor';
import { CategoryIcon } from './categoryIcons';
import { MiniMap } from './MiniMap';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuario: Usuario;
  onReporteCreado: (nuevoReporte: Reporte) => void;
  onConfirmarExistente: (reporteExistenteId: string) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  onReporteCreado,
  onConfirmarExistente,
}) => {
  const [paso, setPaso] = useState<number>(1);
  const [categoria, setCategoria] = useState<CategoriaReporte | null>(null);
  const [subtipo, setSubtipo] = useState<string>('');
  const [severidad, setSeveridad] = useState<SeveridadReporte | null>(null);
  const [descripcion, setDescripcion] = useState<string>('');
  const [foto, setFoto] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>(ARMENIA_CENTER);
  const [direccion, setDireccion] = useState<string>('Armenia, Quindío');
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const [fotoError, setFotoError] = useState<string | null>(null);
  const [duplicadoDetectado, setDuplicadoDetectado] = useState<Reporte | null>(null);
  const [showConfirmacionExitosa, setShowConfirmacionExitosa] = useState<boolean>(false);
  const [reporteGenerado, setReporteGenerado] = useState<Reporte | null>(null);
  const [isLocatingGPS, setIsLocatingGPS] = useState<boolean>(false);
  const [isVerificando, setIsVerificando] = useState<boolean>(false);
  const [isPublicando, setIsPublicando] = useState<boolean>(false);
  const [publicarDeTodosModos, setPublicarDeTodosModos] = useState<boolean>(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize or reset flow on open
  useEffect(() => {
    if (isOpen) {
      setPaso(1);
      setCategoria(null);
      setSubtipo('');
      setSeveridad(null);
      setDescripcion('');
      setFoto(null);
      setFotoError(null);
      setDuplicadoDetectado(null);
      setShowConfirmacionExitosa(false);
      setReporteGenerado(null);
      setPublicarDeTodosModos(false);
      setErrorEnvio(null);
      setIsPublicando(false);
      setIsVerificando(false);
      registrarEvento('reporte_iniciado');

      // Attempt to get user GPS position
      if (navigator.geolocation) {
        setIsLocatingGPS(true);
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const newCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setCoords(newCoords);
            setIsLocatingGPS(false);
            setIsGeocoding(true);
            const addr = await reverseGeocode(newCoords.lat, newCoords.lng);
            setDireccion(addr);
            setIsGeocoding(false);
          },
          async () => {
            setIsLocatingGPS(false);
            setCoords(ARMENIA_CENTER);
            const addr = await reverseGeocode(ARMENIA_CENTER.lat, ARMENIA_CENTER.lng);
            setDireccion(addr || 'Carrera 15 con Calle 4 Norte, Armenia');
          },
          { timeout: 6000 }
        );
      }
    }
  }, [isOpen]);

  // Métrica: cada vez que se avanza a un paso nuevo del flujo de reporte
  useEffect(() => {
    if (isOpen && paso > 1) registrarEvento('reporte_paso_completado', { paso: paso - 1 });
  }, [paso, isOpen]);

  if (!isOpen) return null;

  // Handle location change from draggable pin
  const handleCoordsChange = async (newCoords: { lat: number; lng: number }) => {
    setCoords(newCoords);
    setIsGeocoding(true);
    const addr = await reverseGeocode(newCoords.lat, newCoords.lng);
    setDireccion(addr);
    setIsGeocoding(false);
  };

  // Handle camera capture or photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setFotoError(null);
      const compressed = await compressImage(file, 1000, 0.78);
      setFoto(compressed);
    } catch (err) {
      console.error(err);
      setFotoError('No se pudo procesar la foto. Intenta nuevamente.');
    }
  };

  // Next from Step 3 -> el backend verifica duplicados (misma categoría, activo, a 30 m o menos) -> Step 4
  const handleAvanzarAPaso4 = async () => {
    if (!foto) {
      setFotoError('La fotografía del daño es obligatoria para verificar el reporte.');
      return;
    }
    setFotoError(null);
    if (!categoria) return;

    setIsVerificando(true);
    try {
      const dup = await buscarDuplicado(categoria, coords.lat, coords.lng);
      if (dup) {
        setDuplicadoDetectado(dup);
      } else {
        setPublicarDeTodosModos(false);
        setPaso(4);
      }
    } catch {
      // Si la verificación falla se continúa: el backend vuelve a validar al publicar.
      setPaso(4);
    } finally {
      setIsVerificando(false);
    }
  };

  // Confirm existing duplicate instead of creating new
  const handleConfirmarDuplicadoExistente = () => {
    if (duplicadoDetectado) {
      onConfirmarExistente(duplicadoDetectado.id);
      onClose();
    }
  };

  // Publish report
  const handlePublicar = async () => {
    if (!categoria || !severidad || !foto || isPublicando) return;

    setIsPublicando(true);
    setErrorEnvio(null);
    try {
      const nuevoReporte = await crearReporte({
        categoria,
        subtipo: subtipo || undefined,
        severidad,
        descripcion,
        lat: coords.lat,
        lng: coords.lng,
        direccion: direccion || 'Armenia, Quindío',
        foto,
        forzar: publicarDeTodosModos,
      });
      setReporteGenerado(nuevoReporte);
      onReporteCreado(nuevoReporte);
      registrarEvento('reporte_publicado', { categoria, severidad });
      setShowConfirmacionExitosa(true);
    } catch (error) {
      if (error instanceof ErrorApi && error.codigo === 'REPORTE_DUPLICADO' && error.datos.duplicado) {
        // Otro ciudadano publicó el mismo daño mientras se completaba el formulario.
        setDuplicadoDetectado(error.datos.duplicado as Reporte);
      } else {
        setErrorEnvio(mensajeDeError(error));
      }
    } finally {
      setIsPublicando(false);
    }
  };

  // Categorías array for grid
  const categoriesKeys: CategoriaReporte[] = [
    'hueco',
    'via_deteriorada',
    'inundacion',
    'arbol_obstaculo',
    'senalizacion',
    'cierre_via',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in">
      {/* Hidden file input for camera/gallery */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoUpload}
        className="hidden"
      />

      <div className="relative w-full max-w-[430px] h-[92vh] max-h-[820px] bg-white rounded-t-[28px] sm:rounded-[28px] shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        {/* SUCCESS CONFIRMATION SCREEN (Screenshot Page 17) */}
        {showConfirmacionExitosa ? (
          <div className="flex-1 flex flex-col items-center justify-between p-8 text-center bg-white animate-fade-in">
            <div className="w-full flex justify-end">
              <button
                onClick={onClose}
                aria-label="Cerrar confirmación"
                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center my-auto">
              {/* Hexagon Logo */}
              <div className="w-20 h-20 mb-6 flex items-center justify-center">
                <svg viewBox="0 0 48 48" className="w-16 h-16 drop-shadow-md" fill="none">
                  <polygon
                    points="24,3 44,14 44,34 24,45 4,34 4,14"
                    stroke="#0A9DC4"
                    strokeWidth="3.2"
                    strokeLinejoin="round"
                    fill="#ffffff"
                  />
                  <path
                    d="M 24 35 L 24 25 M 24 25 L 16 16 M 16 16 L 16 20 M 16 16 L 20 16 M 24 25 L 32 16 M 32 16 L 32 20 M 32 16 L 28 16"
                    stroke="#0A9DC4"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <h2 className="text-4xl font-extrabold text-[#0A7FA3] tracking-tight">Gracias</h2>
              <p className="text-xl font-medium text-slate-700 mt-2">¡por tu contribución!</p>
              <p className="text-xs text-slate-500 max-w-xs mt-4">
                Tu reporte ya está visible en el mapa para toda la comunidad de Armenia.
              </p>
            </div>

            <div className="w-full space-y-3 pt-6">
              <button
                onClick={onClose}
                className="w-full min-h-[48px] rounded-full bg-[#0A9DC4] hover:bg-[#088ab0] text-white font-bold text-sm shadow-md transition-transform active:scale-98"
              >
                Continuar
              </button>
            </div>
          </div>
        ) : duplicadoDetectado ? (
          /* DUPLICATE WARNING MODAL */
          <div className="flex-1 flex flex-col justify-between p-6 bg-white animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-amber-600 font-semibold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span>Posible reporte duplicado</span>
              </div>
              <button
                onClick={() => setDuplicadoDetectado(null)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-auto py-4 text-center">
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Parece que este daño ya fue reportado
              </h3>
              <p className="text-xs text-slate-600 max-w-xs mx-auto mb-4">
                Hay un reporte activo de la misma categoría a menos de 30 metros de tu ubicación:
              </p>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-left mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-xs text-slate-800">
                    {CATEGORIAS[duplicadoDetectado.categoria].nombre}
                  </span>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                    {duplicadoDetectado.estado.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{duplicadoDetectado.ubicacion.direccion}</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {duplicadoDetectado.confirmacionesSigue} personas ya confirmaron este daño.
                </p>
              </div>

              <p className="text-xs text-slate-500">
                Puedes sumar tu confirmación para darle más visibilidad sin crear reportes duplicados.
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={handleConfirmarDuplicadoExistente}
                className="w-full min-h-[48px] rounded-full bg-[#0A9DC4] hover:bg-[#088ab0] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-transform active:scale-98"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar reporte existente (+1)</span>
              </button>

              <button
                onClick={() => {
                  setDuplicadoDetectado(null);
                  setPublicarDeTodosModos(true);
                  setPaso(4);
                }}
                className="w-full min-h-[44px] rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                Publicar nuevo de todos modos
              </button>
            </div>
          </div>
        ) : (
          /* REGULAR STEP CONTAINER */
          <>
            {/* Modal Header */}
            <div className="px-5 pt-4 pb-3 border-b border-slate-100 shrink-0">
              {/* Progress bar */}
              <div className="flex items-center gap-1.5 mb-3">
                {[1, 2, 3, 4].map((stepIdx) => (
                  <div
                    key={stepIdx}
                    className={`h-1.5 flex-1 rounded-full transition-all ${
                      paso >= stepIdx ? 'bg-[#0A9DC4]' : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {paso > 1 ? (
                    <button
                      onClick={() => setPaso(paso - 1)}
                      aria-label="Volver al paso anterior"
                      className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-700 transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      onClick={onClose}
                      aria-label="Cerrar modal de reporte"
                      className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-700 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                  <h1 className="text-base font-bold text-slate-900">
                    {paso === 1 && 'Reportar un problema'}
                    {paso === 2 && 'Severidad del daño'}
                    {paso === 3 && 'Detalles y foto'}
                    {paso === 4 && 'Revisar reporte'}
                  </h1>
                </div>

                <span className="text-xs font-semibold text-slate-400">Paso {paso} de 4</span>
              </div>
            </div>

            {/* Modal Body with dynamic step content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* PASO 1 · SELECCIÓN DE CATEGORÍA (Screenshot Page 16) */}
              {paso === 1 && (
                <div className="animate-fade-in">
                  <p className="text-xs text-slate-500 mb-4">
                    Selecciona el tipo de daño u obstáculo que deseas reportar en la vía:
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {categoriesKeys.map((catKey) => {
                      const cat = CATEGORIAS[catKey];
                      return (
                        <button
                          key={catKey}
                          onClick={() => {
                            setCategoria(catKey);
                            setSubtipo('');
                            setPaso(2);
                          }}
                          aria-label={`Seleccionar categoría ${cat.nombre}`}
                          className="flex flex-col items-center justify-center p-3 rounded-2xl transition-all active:scale-95 border min-h-[110px] text-center hover:shadow-md group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A9DC4]"
                          style={{
                            backgroundColor: cat.colorFondo,
                            borderColor: cat.colorBorde,
                          }}
                        >
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                            <CategoryIcon categoria={catKey} size={30} />
                          </div>
                          <span
                            className="text-xs font-semibold leading-tight text-slate-800 line-clamp-2"
                          >
                            {cat.nombre}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PASO 2 · SUBTIPO Y SEVERIDAD (Screenshots Page 18, 19, 20, 21, 22, 23) */}
              {paso === 2 && categoria && (
                <div className="space-y-4 animate-fade-in">
                  {/* Selected category banner */}
                  <div
                    className="p-3.5 rounded-2xl border flex items-center gap-3"
                    style={{
                      backgroundColor: CATEGORIAS[categoria].colorFondo,
                      borderColor: CATEGORIAS[categoria].colorBorde,
                    }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center shrink-0">
                      <CategoryIcon categoria={categoria} size={24} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Categoría seleccionada
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 leading-tight">
                        {CATEGORIAS[categoria].nombre}
                      </h3>
                    </div>
                  </div>

                  {/* Subtype selector for Inundación, Árbol/Obstáculo, Señalización dañada */}
                  {CATEGORIAS[categoria].subtipos && CATEGORIAS[categoria].subtipos!.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <label className="text-xs font-bold text-slate-800 block">
                        ¿Qué tipo de problema es?
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {CATEGORIAS[categoria].subtipos!.map((st) => {
                          const isSubSelected = subtipo === st;
                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => setSubtipo(st)}
                              className={`w-full min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-medium text-left flex items-center justify-between border transition-all ${
                                isSubSelected
                                  ? 'bg-[#0A9DC4]/10 border-[#0A9DC4] text-[#0A7FA3] font-semibold'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <span>{st}</span>
                              {isSubSelected && <CheckCircle2 className="w-4 h-4 text-[#0A9DC4]" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Severity selector (Leve, Moderado, Crítico) */}
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-bold text-slate-800 block text-center">
                      ¿Cuál es la severidad?
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {(['leve', 'moderado', 'critico'] as SeveridadReporte[]).map((sev) => {
                        const sevConfig = SEVERIDADES[sev];
                        const isSelected = severidad === sev;
                        return (
                          <button
                            key={sev}
                            type="button"
                            onClick={() => setSeveridad(sev)}
                            className={`min-h-[96px] p-2.5 rounded-2xl flex flex-col items-center justify-center text-center transition-all border ${
                              isSelected
                                ? 'ring-2 ring-[#0A9DC4] shadow-md scale-[1.02]'
                                : 'hover:bg-slate-50 border-slate-200 bg-white'
                            }`}
                            style={{
                              backgroundColor: isSelected ? sevConfig.colorFondo : '#ffffff',
                              borderColor: isSelected ? sevConfig.colorBorde : '#e2e8f0',
                            }}
                          >
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center mb-1.5 text-xs font-bold"
                              style={{
                                color: sevConfig.colorTexto,
                                backgroundColor: isSelected ? '#ffffff' : sevConfig.colorFondo,
                              }}
                            >
                              !
                            </div>
                            <span
                              className="text-xs font-bold"
                              style={{ color: sevConfig.colorTexto }}
                            >
                              {sevConfig.nombre}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-slate-400 text-center pt-1">
                      Selecciona la severidad para continuar con el reporte.
                    </p>
                  </div>
                </div>
              )}

              {/* PASO 3 · DETALLES Y FOTO (Screenshot Page 25) */}
              {paso === 3 && categoria && severidad && (
                <div className="space-y-4 animate-fade-in">
                  {/* Readonly Summary Chips */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-medium block">Tipo de daño</span>
                      <span className="text-xs font-bold text-slate-800 truncate block">
                        {subtipo || CATEGORIAS[categoria].nombre}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-medium block">Severidad</span>
                      <span
                        className="text-xs font-bold truncate block"
                        style={{ color: SEVERIDADES[severidad].colorTexto }}
                      >
                        {SEVERIDADES[severidad].nombre}
                      </span>
                    </div>
                  </div>

                  {/* Automatic Date and Time */}
                  <div className="flex items-center justify-between text-xs px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-600">
                    <span className="font-medium text-slate-500">Fecha y hora:</span>
                    <span className="font-semibold text-slate-700">{formatFechaHora()} · automática</span>
                  </div>

                  {/* Location with interactive mini map and draggable pin */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#0A9DC4]" />
                        <span>Ubicación</span>
                      </label>
                      <span className="text-[11px] text-[#0A7FA3] font-semibold">
                        {isGeocoding ? 'Detectando dirección...' : 'Ajustable en el mapa'}
                      </span>
                    </div>

                    <MiniMap
                      lat={coords.lat}
                      lng={coords.lng}
                      categoria={categoria}
                      interactive={true}
                      onLocationChange={handleCoordsChange}
                      heightClass="h-36"
                    />

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <p className="font-semibold text-slate-800 truncate">{direccion}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)} · GPS / Ajuste manual
                      </p>
                    </div>
                  </div>

                  {/* Description textarea */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">Descripción del daño</label>
                      <span className="text-[10px] text-slate-400">{descripcion.length}/200</span>
                    </div>
                    <textarea
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value.slice(0, 200))}
                      placeholder="Describe la ubicación exacta o características del daño (ej: carril derecho, frente al paradero)..."
                      rows={3}
                      className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0A9DC4] resize-none"
                    />
                  </div>

                  {/* Photo Capture Section (MANDATORY) */}
                  <div className="space-y-2 pt-1">
                    <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                      <span>Fotografía del daño <span className="text-red-500">*</span></span>
                      {foto && <span className="text-[10px] text-emerald-600 font-semibold">Foto cargada</span>}
                    </label>

                    {foto ? (
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                        <img
                          src={foto}
                          alt="Fotografía del daño vial"
                          className="w-full h-44 object-cover"
                        />
                        <div className="absolute bottom-2 left-2 right-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 min-h-[40px] bg-white/90 backdrop-blur-md text-slate-800 text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 hover:bg-white"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Repetir foto</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full min-h-[56px] border-2 border-dashed border-[#0A9DC4]/40 hover:border-[#0A9DC4] bg-[#0A9DC4]/5 hover:bg-[#0A9DC4]/10 rounded-2xl p-4 flex items-center justify-center gap-3 transition-colors text-slate-700"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#0A9DC4] text-white flex items-center justify-center shadow-sm">
                          <Camera className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-bold block text-slate-800">Tomar una foto</span>
                          <span className="text-[11px] text-slate-500 block">
                            Abre la cámara del celular o selecciona archivo
                          </span>
                        </div>
                      </button>
                    )}

                    {fotoError && (
                      <p className="text-xs text-red-600 font-medium bg-red-50 p-2.5 rounded-xl border border-red-200">
                        {fotoError}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* PASO 4 · REVISAR REPORTE (Screenshot Page 13) */}
              {paso === 4 && categoria && severidad && (
                <div className="space-y-3.5 animate-fade-in">
                  {/* Photo with Change Photo button */}
                  {foto && (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
                      <img
                        src={foto}
                        alt="Foto del reporte"
                        className="w-full h-44 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-2.5 right-2.5 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-[11px] font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Cambiar foto</span>
                      </button>
                    </div>
                  )}

                  {/* Metadata Row: Tipo de daño & Fecha y hora */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Tipo de daño
                      </span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: CATEGORIAS[categoria].colorFondo }}
                        >
                          <CategoryIcon categoria={categoria} size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {subtipo || CATEGORIAS[categoria].nombre}
                          </p>
                          <span
                            className="text-[10px] font-bold"
                            style={{ color: SEVERIDADES[severidad].colorTexto }}
                          >
                            {SEVERIDADES[severidad].nombre}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Fecha y hora
                      </span>
                      <p className="text-xs font-bold text-slate-800 mt-1">
                        {new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {new Date().toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true })} · automática
                      </p>
                    </div>
                  </div>

                  {/* Location Card with Mini Map */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Ubicación
                      </span>
                      <button
                        type="button"
                        onClick={() => setPaso(3)}
                        className="text-[11px] text-[#0A7FA3] font-bold hover:underline"
                      >
                        Ajustar en el mapa
                      </button>
                    </div>

                    <MiniMap
                      lat={coords.lat}
                      lng={coords.lng}
                      categoria={categoria}
                      interactive={false}
                      heightClass="h-28"
                    />

                    <p className="text-xs font-bold text-slate-800">{direccion}</p>
                    <p className="text-[10px] text-slate-500">Ubicación tomada por GPS / Ajuste manual</p>
                  </div>

                  {/* Description Card */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Descripción
                      </span>
                      <button
                        type="button"
                        onClick={() => setPaso(3)}
                        className="text-[11px] text-[#0A7FA3] font-bold hover:underline"
                      >
                        Editar
                      </button>
                    </div>
                    <p className="text-xs text-slate-700 italic">
                      "{descripcion || 'Sin descripción adicional.'}"
                    </p>
                  </div>

                  {/* Explanatory footer text */}
                  <p className="text-[11px] text-slate-500 text-center px-4 leading-relaxed">
                    Tu reporte aparecerá en el mapa y podrás seguir su estado en <strong>Mis reportes</strong>.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Bottom CTA Bar */}
            <div className="p-4 bg-white border-t border-slate-100 shrink-0 space-y-2">
              {paso === 1 && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full min-h-[44px] rounded-full text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancelar
                </button>
              )}

              {paso === 2 && (
                <button
                  type="button"
                  disabled={!severidad}
                  onClick={() => setPaso(3)}
                  className={`w-full min-h-[48px] rounded-full font-bold text-xs flex items-center justify-center gap-1.5 transition-transform ${
                    severidad
                      ? 'bg-[#0A9DC4] hover:bg-[#088ab0] text-white shadow-md active:scale-98'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span>Continuar</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {paso === 3 && (
                <button
                  type="button"
                  onClick={handleAvanzarAPaso4}
                  disabled={isVerificando}
                  className="w-full min-h-[48px] rounded-full bg-[#0A9DC4] hover:bg-[#088ab0] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-transform active:scale-98 disabled:opacity-70 disabled:cursor-wait"
                >
                  {isVerificando ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verificando reportes cercanos…</span>
                    </>
                  ) : (
                    <>
                      <span>Continuar a revisión</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}

              {paso === 4 && (
                <div className="space-y-2">
                  {errorEnvio && (
                    <div role="alert" className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-[11px] font-semibold text-red-700 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{errorEnvio}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handlePublicar}
                    disabled={isPublicando}
                    className="w-full min-h-[50px] rounded-full bg-[#0A9DC4] hover:bg-[#088ab0] text-white font-bold text-sm shadow-lg shadow-[#0A9DC4]/25 transition-transform active:scale-98 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                  >
                    {isPublicando && <RefreshCw className="w-4 h-4 animate-spin" />}
                    <span>{isPublicando ? 'Publicando…' : 'Publicar reporte'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaso(3)}
                    className="w-full min-h-[40px] text-xs font-semibold text-[#0A7FA3] hover:underline text-center"
                  >
                    Editar reporte
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
