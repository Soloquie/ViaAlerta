/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { TabId, BottomNav } from './components/BottomNav';
import { Header } from './components/Header';
import { MapView } from './components/MapView';
import { NewsView } from './components/NewsView';
import { SocialView } from './components/SocialView';
import { NotificationsView } from './components/NotificationsView';
import { ReportModal } from './components/ReportModal';
import { ReportDetailModal } from './components/ReportDetailModal';
import { ContributeModal } from './components/ContributeModal';
import { ProfileView } from './components/ProfileView';
import { SettingsView } from './components/SettingsView';
import { MyReportsView } from './components/MyReportsView';
import { AuthScreen, LogoHexagono } from './components/AuthScreen';

import { AlertaVial, NotificacionItem, PreferenciasNotificaciones, Reporte, Usuario } from './types';
import { alCerrarSesionPorExpiracion, mensajeDeError, obtenerToken } from './api/cliente';
import * as api from './api/servicios';

const PREFERENCIAS_POR_DEFECTO: PreferenciasNotificaciones = {
  nuevoComentario: true,
  actualizacionEstado: true,
  reporteSolucionado: true,
  reportesCerca: true,
  respuestasComentarios: true,
};

type EstadoSesion = 'verificando' | 'anonimo' | 'cargando' | 'lista' | 'error';

export default function App() {
  // Sesión
  const [estadoSesion, setEstadoSesion] = useState<EstadoSesion>(obtenerToken() ? 'verificando' : 'anonimo');
  const [avisoSesion, setAvisoSesion] = useState<string | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [modoDemo, setModoDemo] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);

  // Datos (provienen del backend; no se guardan en localStorage)
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [alertas, setAlertas] = useState<AlertaVial[]>([]);
  const [notificaciones, setNotificaciones] = useState<NotificacionItem[]>([]);
  const [preferencias, setPreferencias] = useState<PreferenciasNotificaciones>(PREFERENCIAS_POR_DEFECTO);
  const [comunidad, setComunidad] = useState<Usuario[]>([]);
  const [seguidosUsuarios, setSeguidosUsuarios] = useState<string[]>([]);

  // Navigation & Modals State
  const [activeTab, setActiveTab] = useState<TabId>('inicio');
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [selectedReporte, setSelectedReporte] = useState<Reporte | null>(null);
  const [aporteTargetReporte, setAporteTargetReporte] = useState<Reporte | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isMyReportsOpen, setIsMyReportsOpen] = useState<boolean>(false);
  const [selectedMapReporteId, setSelectedMapReporteId] = useState<string | null>(null);

  const mostrarError = useCallback((error: unknown) => {
    setToast(mensajeDeError(error));
    window.setTimeout(() => setToast(null), 4000);
  }, []);

  const limpiarSesion = useCallback((aviso: string | null = null) => {
    api.cerrarSesion();
    setUsuario(null);
    setReportes([]);
    setNotificaciones([]);
    setComunidad([]);
    setSeguidosUsuarios([]);
    setSelectedReporte(null);
    setAporteTargetReporte(null);
    setIsProfileOpen(false);
    setIsSettingsOpen(false);
    setIsMyReportsOpen(false);
    setIsReportModalOpen(false);
    setActiveTab('inicio');
    setAvisoSesion(aviso);
    setEstadoSesion('anonimo');
  }, []);

  /**
   * Carga todos los datos de la sesión desde la API.
   * En modo silencioso no muestra la pantalla de carga (se usa al restablecer los datos de prueba).
   */
  const cargarDatos = useCallback(async (usuarioInicial?: Usuario, silencioso = false) => {
    if (!silencioso) setEstadoSesion('cargando');
    setErrorCarga(null);
    try {
      const [yo, listaReportes, listaAlertas, listaNotificaciones, prefs, listaComunidad, seguidos] = await Promise.all([
        usuarioInicial ? Promise.resolve(usuarioInicial) : api.obtenerUsuarioActual(),
        api.listarReportes(),
        api.listarAlertas(),
        api.listarNotificaciones(),
        api.obtenerPreferencias(),
        api.listarComunidad(),
        api.listarSeguidos(),
      ]);
      setUsuario(yo);
      setReportes(listaReportes);
      setAlertas(listaAlertas);
      setNotificaciones(listaNotificaciones);
      setPreferencias(prefs);
      setComunidad(listaComunidad);
      setSeguidosUsuarios(seguidos);
      setEstadoSesion('lista');
    } catch (error) {
      if (!obtenerToken()) return; // La sesión expiró: el manejador de 401 ya mostró el acceso.
      if (silencioso) throw error;
      setErrorCarga(mensajeDeError(error));
      setEstadoSesion('error');
    }
  }, []);

  // Arranque: estado del modo demo, cierre de sesión por token vencido y carga inicial.
  useEffect(() => {
    api.estadoModoDemo().then(setModoDemo);
    alCerrarSesionPorExpiracion(() => limpiarSesion('Tu sesión expiró. Inicia sesión nuevamente.'));
    if (obtenerToken()) cargarDatos();
    return () => alCerrarSesionPorExpiracion(null);
  }, [cargarDatos, limpiarSesion]);

  /** Reemplaza un reporte actualizado por el servidor en todas las vistas. */
  const actualizarReporteLocal = useCallback((actualizado: Reporte) => {
    setReportes((lista) => {
      const existe = lista.some((r) => r.id === actualizado.id);
      return existe ? lista.map((r) => (r.id === actualizado.id ? actualizado : r)) : [actualizado, ...lista];
    });
    setSelectedReporte((actual) => (actual?.id === actualizado.id ? actualizado : actual));
    setAporteTargetReporte((actual) => (actual?.id === actualizado.id ? actualizado : actual));
  }, []);

  /** Refresca el perfil (contadores) y las notificaciones después de una acción. */
  const refrescarPerfilYNotificaciones = useCallback(async () => {
    try {
      const [yo, lista] = await Promise.all([api.obtenerUsuarioActual(), api.listarNotificaciones()]);
      setUsuario(yo);
      setNotificaciones(lista);
    } catch {
      // No es crítico: se actualizará en la próxima carga.
    }
  }, []);

  // Tab change handler
  const handleSelectTab = (tab: TabId) => {
    if (tab === 'contribuir') {
      setIsReportModalOpen(true);
      return;
    }
    setActiveTab(tab);
    setIsMyReportsOpen(false);
  };

  // Create new report (ya guardado en el backend por ReportModal)
  const handleReporteCreado = (nuevoReporte: Reporte) => {
    actualizarReporteLocal(nuevoReporte);
    refrescarPerfilYNotificaciones();
    setActiveTab('inicio');
    setIsMyReportsOpen(false);
    setSelectedMapReporteId(nuevoReporte.id);
  };

  // Confirm existing report (from duplicate check)
  const handleConfirmarExistente = async (reporteId: string) => {
    const reporte = reportes.find((r) => r.id === reporteId);
    // Si ya había confirmado "sigue ahí", no se envía de nuevo (enviarlo otra vez lo retiraría).
    if (reporte?.usuarioConfirmo !== 'sigue') await handleConfirmarDanio(reporteId, 'sigue');
    setActiveTab('inicio');
    setIsMyReportsOpen(false);
    setSelectedMapReporteId(reporteId);
  };

  // Follow / Unfollow report
  const handleToggleSeguirReporte = async (reporteId: string) => {
    if (!usuario) return;
    const reporte = reportes.find((r) => r.id === reporteId);
    const seguir = !reporte?.seguidores.includes(usuario.id);
    try {
      const actualizado = await api.seguirReporte(reporteId, seguir);
      actualizarReporteLocal(actualizado);
      setUsuario((u) =>
        u
          ? {
              ...u,
              reportesSeguidos: seguir ? [...new Set([...u.reportesSeguidos, reporteId])] : u.reportesSeguidos.filter((id) => id !== reporteId),
            }
          : u,
      );
      if (seguir) api.registrarEvento('reporte_seguido', { reporteId });
    } catch (error) {
      mostrarError(error);
    }
  };

  // Citizen Confirmation ("sigue" / "reparado"): la regla de una confirmación por usuario vive en el backend
  const handleConfirmarDanio = async (reporteId: string, tipo: 'sigue' | 'reparado') => {
    try {
      const actualizado = await api.confirmarDanio(reporteId, tipo);
      actualizarReporteLocal(actualizado);
      api.registrarEvento('confirmacion_enviada', { reporteId, tipo });
      refrescarPerfilYNotificaciones();
    } catch (error) {
      mostrarError(error);
    }
  };

  // Add citizen contribution (aporte)
  const handleAddAporte = async (reporteId: string, texto: string, foto: string | null) => {
    const actualizado = await api.aportarInformacion(reporteId, texto, foto);
    actualizarReporteLocal(actualizado);
    refrescarPerfilYNotificaciones();
  };

  // Demo mode: advance status
  const handleAvanzarEstado = async (reporteId: string) => {
    const actualizado = await api.avanzarEstadoDemo(reporteId);
    actualizarReporteLocal(actualizado);
    await refrescarPerfilYNotificaciones();
  };

  // Reset data to defaults (modo demostración)
  const handleResetData = async () => {
    await api.restablecerDatosDemo();
    setSelectedReporte(null);
    setSelectedMapReporteId(null);
    await cargarDatos(undefined, true);
  };

  // Toggle follow user in social
  const handleToggleSeguirUsuario = async (targetUserId: string) => {
    const seguir = !seguidosUsuarios.includes(targetUserId);
    try {
      setSeguidosUsuarios(await api.seguirUsuario(targetUserId, seguir));
    } catch (error) {
      mostrarError(error);
    }
  };

  // Mark all notifications as read
  const handleMarcarTodasLeidas = async () => {
    const anteriores = notificaciones;
    setNotificaciones((lista) => lista.map((n) => ({ ...n, leida: true })));
    try {
      await api.marcarTodasLeidas();
    } catch (error) {
      setNotificaciones(anteriores);
      mostrarError(error);
    }
  };

  // Save preferences
  const handleSavePreferencias = async (prefs: PreferenciasNotificaciones) => {
    const anteriores = preferencias;
    setPreferencias(prefs);
    try {
      setPreferencias(await api.guardarPreferencias(prefs));
    } catch (error) {
      setPreferencias(anteriores);
      mostrarError(error);
    }
  };

  const handleUpdateUsuario = async (actualizado: Usuario) => {
    const guardado = await api.actualizarPerfil({
      nombre: actualizado.nombre,
      usuario: actualizado.usuario,
      correo: actualizado.correo,
      telefono: actualizado.telefono,
      ciudad: actualizado.ciudad,
      biografia: actualizado.biografia,
      foto: actualizado.foto !== usuario?.foto ? actualizado.foto : undefined,
    });
    setUsuario(guardado);
    // El nombre y la foto aparecen en los reportes y aportes: se recargan.
    api.listarReportes().then(setReportes).catch(() => undefined);
  };

  const handleSelectNotificacion = (reporteId: string) => {
    const target = reportes.find((r) => r.id === reporteId);
    if (target) setSelectedReporte(target);
  };

  // Jump to map at the report's location
  const handleOpenMapAtCoords = () => {
    if (selectedReporte) setSelectedMapReporteId(selectedReporte.id);
    setIsMyReportsOpen(false);
    setActiveTab('inicio');
  };

  const unreadNotifsCount = notificaciones.filter((n) => !n.leida).length;

  const marco = (contenido: React.ReactNode) => (
    <div className="min-h-screen bg-[#141518] flex items-center justify-center sm:p-4 text-[#222428] font-['Poppins',sans-serif]">
      {/* Mobile Smartphone Frame Container (390px - 430px) */}
      <main className="relative w-full max-w-[430px] h-[100dvh] sm:h-[890px] sm:max-h-[95vh] bg-[#222428] sm:rounded-[36px] shadow-2xl overflow-hidden flex flex-col border sm:border-[#383b42]">
        {contenido}
      </main>
    </div>
  );

  if (estadoSesion === 'anonimo') {
    return marco(
      <AuthScreen
        modoDemo={modoDemo}
        aviso={avisoSesion}
        onAutenticado={(u) => {
          setAvisoSesion(null);
          cargarDatos(u);
        }}
      />,
    );
  }

  if (estadoSesion !== 'lista' || !usuario) {
    return marco(
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <LogoHexagono className="w-14 h-14" />
        {estadoSesion === 'error' ? (
          <>
            <div className="mt-6 flex items-center gap-2 text-amber-400 text-sm font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>No pudimos cargar la información</span>
            </div>
            <p className="mt-2 text-xs text-slate-400 max-w-[280px]">{errorCarga}</p>
            <button
              onClick={() => cargarDatos()}
              className="mt-6 min-h-[44px] px-6 rounded-full bg-[#0A9DC4] hover:bg-[#088ab0] text-white text-xs font-bold flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reintentar</span>
            </button>
            <button onClick={() => limpiarSesion()} className="mt-3 min-h-[40px] text-xs font-semibold text-slate-400 hover:text-white">
              Cerrar sesión
            </button>
          </>
        ) : (
          <div className="mt-6 flex items-center gap-2 text-slate-300 text-xs font-semibold" role="status">
            <RefreshCw className="w-4 h-4 animate-spin text-[#0A9DC4]" />
            <span>Cargando reportes de la comunidad…</span>
          </div>
        )}
      </div>,
    );
  }

  return marco(
    <>
      {/* App Dark Header */}
      <Header
        usuario={usuario}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <section className="flex-1 relative flex flex-col overflow-hidden bg-[#222428]">
        {/* INICIO TAB: FULL-SCREEN INTERACTIVE MAP */}
        {activeTab === 'inicio' && !isMyReportsOpen && (
          <div className="w-full h-full relative">
            <MapView
              reportes={reportes}
              usuarioId={usuario.id}
              onSelectReporte={(rep) => setSelectedReporte(rep)}
              onToggleSeguir={handleToggleSeguirReporte}
              onOpenAporteModal={(rep) => setAporteTargetReporte(rep)}
              selectedReporteId={selectedMapReporteId}
            />
          </div>
        )}

        {/* MY REPORTS VIEW (from Header avatar or Settings) */}
        {isMyReportsOpen && (
          <div className="w-full h-full bg-white rounded-t-[28px] overflow-hidden flex flex-col shadow-inner">
            <MyReportsView
              reportes={reportes}
              usuario={usuario}
              onSelectReporte={(rep) => setSelectedReporte(rep)}
              onStartReport={() => setIsReportModalOpen(true)}
            />
          </div>
        )}

        {/* NOTICIAS TAB */}
        {activeTab === 'noticias' && !isMyReportsOpen && (
          <div className="w-full h-full bg-white rounded-t-[28px] overflow-hidden flex flex-col shadow-inner">
            <NewsView
              alertas={alertas}
              reportes={reportes}
              onSelectReporte={(rep) => setSelectedReporte(rep)}
              onSelectAlertaMap={() => {
                setActiveTab('inicio');
              }}
            />
          </div>
        )}

        {/* SOCIAL TAB */}
        {activeTab === 'social' && !isMyReportsOpen && (
          <div className="w-full h-full bg-white rounded-t-[28px] overflow-hidden flex flex-col shadow-inner">
            {comunidad.length > 0 ? (
              <SocialView
                usuarios={comunidad}
                reportes={reportes}
                seguidosIds={seguidosUsuarios}
                onToggleSeguirUsuario={handleToggleSeguirUsuario}
                onSelectReporte={(rep) => setSelectedReporte(rep)}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-center text-xs text-slate-500">
                Aún no hay otros ciudadanos con reportes en la comunidad.
              </div>
            )}
          </div>
        )}

        {/* NOTIFICACIONES TAB */}
        {activeTab === 'notificaciones' && !isMyReportsOpen && (
          <div className="w-full h-full bg-white rounded-t-[28px] overflow-hidden flex flex-col shadow-inner">
            <NotificationsView
              notificaciones={notificaciones}
              preferencias={preferencias}
              onMarcarTodasLeidas={handleMarcarTodasLeidas}
              onSavePreferencias={handleSavePreferencias}
              onSelectReporteId={handleSelectNotificacion}
            />
          </div>
        )}
      </section>

      {/* Fixed Bottom Navigation (5 tabs) */}
      <BottomNav activeTab={activeTab} onSelectTab={handleSelectTab} unreadCount={unreadNotifsCount} />

      {/* Errores de acciones rápidas (seguir, confirmar, preferencias...) */}
      {toast && (
        <div
          role="alert"
          className="absolute left-4 right-4 bottom-24 z-[70] p-3 rounded-2xl bg-[#2B2D31] text-white text-xs font-semibold shadow-2xl flex items-start gap-2 animate-fade-in"
        >
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="flex-1">{toast}</span>
          <button onClick={() => setToast(null)} aria-label="Cerrar aviso" className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MODAL 1: REPORTAR UN PROBLEMA (4-Step flow) */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        usuario={usuario}
        onReporteCreado={handleReporteCreado}
        onConfirmarExistente={handleConfirmarExistente}
      />

      {/* MODAL 2: DETALLE DEL REPORTE */}
      <ReportDetailModal
        reporte={selectedReporte}
        usuario={usuario}
        onClose={() => setSelectedReporte(null)}
        onToggleSeguir={handleToggleSeguirReporte}
        onConfirmarDanio={handleConfirmarDanio}
        onOpenAporteModal={(rep) => setAporteTargetReporte(rep)}
        onOpenMapAtCoords={handleOpenMapAtCoords}
      />

      {/* MODAL 3: APORTAR INFORMACIÓN A UN REPORTE */}
      {aporteTargetReporte && (
        <ContributeModal
          isOpen={true}
          onClose={() => setAporteTargetReporte(null)}
          reporte={aporteTargetReporte}
          usuario={usuario}
          onAddAporte={handleAddAporte}
        />
      )}

      {/* MODAL 4: PERFIL DE USUARIO */}
      {isProfileOpen && (
        <ProfileView
          usuario={usuario}
          onClose={() => setIsProfileOpen(false)}
          onUpdateUsuario={handleUpdateUsuario}
          onGoToMyReports={() => {
            setIsProfileOpen(false);
            setIsMyReportsOpen(true);
          }}
        />
      )}

      {/* MODAL 5: CONFIGURACIÓN & MODO DEMOSTRACIÓN */}
      {isSettingsOpen && (
        <SettingsView
          usuario={usuario}
          reportes={reportes}
          modoDemo={modoDemo}
          onClose={() => setIsSettingsOpen(false)}
          onOpenProfile={() => {
            setIsSettingsOpen(false);
            setIsProfileOpen(true);
          }}
          onOpenMyReports={() => {
            setIsSettingsOpen(false);
            setIsMyReportsOpen(true);
          }}
          onAvanzarEstadoReporte={handleAvanzarEstado}
          onResetDatos={handleResetData}
          onCambiarContrasena={api.cambiarContrasena}
          onCerrarSesion={() => limpiarSesion()}
        />
      )}
    </>,
  );
}
