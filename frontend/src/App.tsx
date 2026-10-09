/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
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

import { AporteCiudadano, NotificacionItem, PreferenciasNotificaciones, Reporte, Usuario } from './types';
import { OTROS_USUARIOS } from './data/mockData';
import {
  avanzarEstadoReporte,
  getStoredAlertas,
  getStoredNotificaciones,
  getStoredPreferencias,
  getStoredReportes,
  getStoredSeguidosUsuarios,
  getStoredUsuario,
  resetAllDataToDefault,
  saveStoredNotificaciones,
  saveStoredPreferencias,
  saveStoredReportes,
  saveStoredSeguidosUsuarios,
  saveStoredUsuario,
} from './utils/storage';

export default function App() {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [usuario, setUsuario] = useState<Usuario>(getStoredUsuario());
  const [alertas, setAlertas] = useState(getStoredAlertas());
  const [notificaciones, setNotificaciones] = useState<NotificacionItem[]>([]);
  const [preferencias, setPreferencias] = useState<PreferenciasNotificaciones>(getStoredPreferencias());
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

  // Load from storage on mount
  useEffect(() => {
    setReportes(getStoredReportes());
    setUsuario(getStoredUsuario());
    setAlertas(getStoredAlertas());
    setNotificaciones(getStoredNotificaciones());
    setPreferencias(getStoredPreferencias());
    setSeguidosUsuarios(getStoredSeguidosUsuarios());
  }, []);

  // Update selectedReporte when reportes list changes
  useEffect(() => {
    if (selectedReporte) {
      const refreshed = reportes.find((r) => r.id === selectedReporte.id);
      if (refreshed) {
        setSelectedReporte(refreshed);
      }
    }
  }, [reportes]);

  // Tab change handler
  const handleSelectTab = (tab: TabId) => {
    if (tab === 'contribuir') {
      setIsReportModalOpen(true);
      return;
    }
    setActiveTab(tab);
    setIsMyReportsOpen(false);
  };

  // Create new report
  const handleReporteCreado = (nuevoReporte: Reporte) => {
    const updated = [nuevoReporte, ...reportes];
    setReportes(updated);
    saveStoredReportes(updated);

    // Update user stats
    const updatedUsr = {
      ...usuario,
      incidentesCount: usuario.incidentesCount + 1,
      actualizacionesCount: usuario.actualizacionesCount + 1,
      reportesSeguidos: [...usuario.reportesSeguidos, nuevoReporte.id],
    };
    setUsuario(updatedUsr);
    saveStoredUsuario(updatedUsr);

    // Switch to map & focus on new report
    setActiveTab('inicio');
    setSelectedMapReporteId(nuevoReporte.id);
  };

  // Confirm existing report (from duplicate check)
  const handleConfirmarExistente = (reporteId: string) => {
    handleConfirmarDanio(reporteId, 'sigue');
    setActiveTab('inicio');
    setSelectedMapReporteId(reporteId);
  };

  // Follow / Unfollow report
  const handleToggleSeguirReporte = (reporteId: string) => {
    const updated = reportes.map((r) => {
      if (r.id !== reporteId) return r;
      const isFollowing = r.seguidores.includes(usuario.id);
      const newSeguidores = isFollowing
        ? r.seguidores.filter((id) => id !== usuario.id)
        : [...r.seguidores, usuario.id];
      return { ...r, seguidores: newSeguidores };
    });

    setReportes(updated);
    saveStoredReportes(updated);

    const isFollowing = usuario.reportesSeguidos.includes(reporteId);
    const updatedUser: Usuario = {
      ...usuario,
      reportesSeguidos: isFollowing
        ? usuario.reportesSeguidos.filter((id) => id !== reporteId)
        : [...usuario.reportesSeguidos, reporteId],
    };
    setUsuario(updatedUser);
    saveStoredUsuario(updatedUser);
  };

  // Citizen Confirmation ("sigue" / "reparado")
  const handleConfirmarDanio = (reporteId: string, tipo: 'sigue' | 'reparado') => {
    const updated = reportes.map((r) => {
      if (r.id !== reporteId) return r;

      let confirmacionesSigue = r.confirmacionesSigue;
      let confirmacionesReparado = r.confirmacionesReparado;
      const prevConfirm = r.usuarioConfirmo;

      // If already selected the same option, toggle it off (undo)
      if (prevConfirm === tipo) {
        if (tipo === 'sigue') confirmacionesSigue = Math.max(0, confirmacionesSigue - 1);
        if (tipo === 'reparado') confirmacionesReparado = Math.max(0, confirmacionesReparado - 1);
        return {
          ...r,
          confirmacionesSigue,
          confirmacionesReparado,
          usuarioConfirmo: null,
        };
      }

      // Switch selection
      if (prevConfirm === 'sigue') confirmacionesSigue = Math.max(0, confirmacionesSigue - 1);
      if (prevConfirm === 'reparado') confirmacionesReparado = Math.max(0, confirmacionesReparado - 1);

      if (tipo === 'sigue') confirmacionesSigue += 1;
      if (tipo === 'reparado') confirmacionesReparado += 1;

      return {
        ...r,
        confirmacionesSigue,
        confirmacionesReparado,
        usuarioConfirmo: tipo,
      };
    });

    setReportes(updated);
    saveStoredReportes(updated);
  };

  // Add citizen contribution (aporte)
  const handleAddAporte = (reporteId: string, aporte: AporteCiudadano) => {
    const updated = reportes.map((r) => {
      if (r.id !== reporteId) return r;
      return {
        ...r,
        aportes: [aporte, ...r.aportes],
      };
    });

    setReportes(updated);
    saveStoredReportes(updated);

    // Push notification
    const newNotif: NotificacionItem = {
      id: `notif_${Date.now()}`,
      titulo: 'Nuevo aporte en reporte vial',
      mensaje: `"${aporte.texto.slice(0, 75)}..." por ${aporte.autor}`,
      fecha: 'Ahora',
      grupo: 'hoy',
      leida: false,
      tipo: 'comentario',
      reporteId,
    };
    const updatedNotifs = [newNotif, ...notificaciones];
    setNotificaciones(updatedNotifs);
    saveStoredNotificaciones(updatedNotifs);
  };

  // Demo mode: advance status
  const handleAvanzarEstado = (reporteId: string) => {
    const res = avanzarEstadoReporte(reporteId);
    if (res && res.reporte) {
      setReportes(getStoredReportes());
      setNotificaciones(getStoredNotificaciones());
      if (selectedReporte && selectedReporte.id === reporteId) {
        setSelectedReporte(res.reporte);
      }
    }
  };

  // Reset data to defaults
  const handleResetData = () => {
    resetAllDataToDefault();
    setReportes(getStoredReportes());
    setUsuario(getStoredUsuario());
    setAlertas(getStoredAlertas());
    setNotificaciones(getStoredNotificaciones());
    setPreferencias(getStoredPreferencias());
    setSeguidosUsuarios(getStoredSeguidosUsuarios());
  };

  // Toggle follow user in social
  const handleToggleSeguirUsuario = (targetUserId: string) => {
    const isFollowing = seguidosUsuarios.includes(targetUserId);
    const updated = isFollowing
      ? seguidosUsuarios.filter((id) => id !== targetUserId)
      : [...seguidosUsuarios, targetUserId];
    setSeguidosUsuarios(updated);
    saveStoredSeguidosUsuarios(updated);
  };

  // Mark all notifications as read
  const handleMarcarTodasLeidas = () => {
    const updated = notificaciones.map((n) => ({ ...n, leida: true }));
    setNotificaciones(updated);
    saveStoredNotificaciones(updated);
  };

  // Save preferences
  const handleSavePreferencias = (prefs: PreferenciasNotificaciones) => {
    setPreferencias(prefs);
    saveStoredPreferencias(prefs);
  };

  // Jump to map at coordinate
  const handleOpenMapAtCoords = (lat: number, lng: number) => {
    setActiveTab('inicio');
    // Map will be focused
  };

  const unreadNotifsCount = notificaciones.filter((n) => !n.leida).length;

  return (
    <div className="min-h-screen bg-[#141518] flex items-center justify-center sm:p-4 text-[#222428] font-['Poppins',sans-serif]">
      {/* Mobile Smartphone Frame Container (390px - 430px) */}
      <main className="relative w-full max-w-[430px] h-[100dvh] sm:h-[890px] sm:max-h-[95vh] bg-[#222428] sm:rounded-[36px] shadow-2xl overflow-hidden flex flex-col border sm:border-[#383b42]">
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
                onSelectAlertaMap={(lat, lng) => {
                  setActiveTab('inicio');
                }}
              />
            </div>
          )}

          {/* SOCIAL TAB */}
          {activeTab === 'social' && !isMyReportsOpen && (
            <div className="w-full h-full bg-white rounded-t-[28px] overflow-hidden flex flex-col shadow-inner">
              <SocialView
                usuarios={OTROS_USUARIOS}
                reportes={reportes}
                seguidosIds={seguidosUsuarios}
                onToggleSeguirUsuario={handleToggleSeguirUsuario}
                onSelectReporte={(rep) => setSelectedReporte(rep)}
              />
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
                onSelectReporteId={(repId) => {
                  const target = reportes.find((r) => r.id === repId);
                  if (target) setSelectedReporte(target);
                }}
              />
            </div>
          )}
        </section>

        {/* Fixed Bottom Navigation (5 tabs) */}
        <BottomNav
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          unreadCount={unreadNotifsCount}
        />

        {/* MODAL 1: REPORTAR UN PROBLEMA (4-Step flow) */}
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          usuario={usuario}
          reportesExistentes={reportes}
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
            onUpdateUsuario={(upd) => {
              setUsuario(upd);
              saveStoredUsuario(upd);
            }}
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
          />
        )}
      </main>
    </div>
  );
}
