import { ALERTAS_INICIALES, NOTIFICACIONES_INICIALES, PREFERENCIAS_INICIALES, REPORTES_INICIALES, USUARIO_ACTUAL } from '../data/mockData';
import { AlertaVial, EstadoReporte, NotificacionItem, PreferenciasNotificaciones, Reporte, Usuario } from '../types';

const STORAGE_KEYS = {
  REPORTES: 'reportevias_reportes_v1',
  USUARIO: 'reportevias_usuario_v1',
  ALERTAS: 'reportevias_alertas_v1',
  NOTIFICACIONES: 'reportevias_notificaciones_v1',
  PREFERENCIAS: 'reportevias_preferencias_v1',
  SEGUIDOS_USUARIOS: 'reportevias_seguidos_usr_v1',
};

export function getStoredReportes(): Reporte[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REPORTES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error al leer reportes de localStorage', e);
  }
  saveStoredReportes(REPORTES_INICIALES);
  return REPORTES_INICIALES;
}

export function saveStoredReportes(reportes: Reporte[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.REPORTES, JSON.stringify(reportes));
  } catch (e) {
    console.error('Error al guardar reportes en localStorage', e);
  }
}

export function getStoredUsuario(): Usuario {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USUARIO);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error al leer usuario de localStorage', e);
  }
  saveStoredUsuario(USUARIO_ACTUAL);
  return USUARIO_ACTUAL;
}

export function saveStoredUsuario(usuario: Usuario): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USUARIO, JSON.stringify(usuario));
  } catch (e) {
    console.error('Error al guardar usuario en localStorage', e);
  }
}

export function getStoredAlertas(): AlertaVial[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ALERTAS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error al leer alertas de localStorage', e);
  }
  return ALERTAS_INICIALES;
}

export function getStoredNotificaciones(): NotificacionItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICACIONES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error al leer notificaciones de localStorage', e);
  }
  saveStoredNotificaciones(NOTIFICACIONES_INICIALES);
  return NOTIFICACIONES_INICIALES;
}

export function saveStoredNotificaciones(notifs: NotificacionItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.NOTIFICACIONES, JSON.stringify(notifs));
  } catch (e) {
    console.error('Error al guardar notificaciones en localStorage', e);
  }
}

export function getStoredPreferencias(): PreferenciasNotificaciones {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PREFERENCIAS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error al leer preferencias de localStorage', e);
  }
  return PREFERENCIAS_INICIALES;
}

export function saveStoredPreferencias(prefs: PreferenciasNotificaciones): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PREFERENCIAS, JSON.stringify(prefs));
  } catch (e) {
    console.error('Error al guardar preferencias en localStorage', e);
  }
}

export function getStoredSeguidosUsuarios(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SEGUIDOS_USUARIOS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error al leer usuarios seguidos', e);
  }
  return ['usr_curtis'];
}

export function saveStoredSeguidosUsuarios(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SEGUIDOS_USUARIOS, JSON.stringify(ids));
  } catch (e) {
    console.error('Error al guardar usuarios seguidos', e);
  }
}

export function resetAllDataToDefault(): void {
  localStorage.clear();
  saveStoredReportes(REPORTES_INICIALES);
  saveStoredUsuario(USUARIO_ACTUAL);
  saveStoredNotificaciones(NOTIFICACIONES_INICIALES);
  saveStoredPreferencias(PREFERENCIAS_INICIALES);
  saveStoredSeguidosUsuarios(['usr_curtis']);
}

/**
 * Demo Mode helper: advances the state of a report to the next level
 * and triggers an automatic history message + notification
 */
export function avanzarEstadoReporte(reporteId: string): { reporte: Reporte | null; nuevoEstado: EstadoReporte } | null {
  const reportes = getStoredReportes();
  const index = reportes.findIndex((r) => r.id === reporteId);
  if (index === -1) return null;

  const actual = reportes[index];
  const estadosOrden: EstadoReporte[] = ['reportado', 'en_revision', 'en_proceso', 'solucionado'];
  const currentIndex = estadosOrden.indexOf(actual.estado);
  const nextIndex = (currentIndex + 1) % estadosOrden.length;
  const nuevoEstado = estadosOrden[nextIndex];

  const mensajesPorEstado: Record<EstadoReporte, string> = {
    reportado: 'Reporte reabierto por revisión ciudadana.',
    en_revision: 'La Secretaría de Infraestructura ha tomado nota del caso para inspección técnica.',
    en_proceso: 'Cuadrilla operativa asignada y programada para labores en sitio.',
    solucionado: 'Reparación vial concluida satisfactoriamente y validada en terreno.',
  };

  const fechaNow = new Date().toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const nuevoHistorial = [
    ...actual.historial,
    {
      estado: nuevoEstado,
      fecha: fechaNow,
      mensaje: mensajesPorEstado[nuevoEstado],
    },
  ];

  const updated: Reporte = {
    ...actual,
    estado: nuevoEstado,
    historial: nuevoHistorial,
  };

  reportes[index] = updated;
  saveStoredReportes(reportes);

  // Generate notification
  const notificaciones = getStoredNotificaciones();
  const nuevaNotif: NotificacionItem = {
    id: `notif_${Date.now()}`,
    titulo: `Actualización: ${updated.ubicacion.direccion}`,
    mensaje: `El estado avanzó a "${nuevoEstado.replace('_', ' ').toUpperCase()}": ${mensajesPorEstado[nuevoEstado]}`,
    fecha: 'Ahora',
    grupo: 'hoy',
    leida: false,
    tipo: 'estado',
    reporteId: updated.id,
  };
  saveStoredNotificaciones([nuevaNotif, ...notificaciones]);

  return { reporte: updated, nuevoEstado };
}
