import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { ErrorApi, conflicto } from '../utils/errores.js';
import { ejecutarSemilla } from '../../prisma/semilla/ejecutar.js';
import type { ReporteDto } from './mapeadores.js';
import { notificarVarios } from './notificaciones.service.js';
import { asegurarReporte, obtenerReporte } from './reportes.service.js';

export type EstadoReporte = 'reportado' | 'en_revision' | 'en_proceso' | 'solucionado';

export const ORDEN_ESTADOS: EstadoReporte[] = ['reportado', 'en_revision', 'en_proceso', 'solucionado'];

const NOMBRE_ESTADO: Record<EstadoReporte, string> = {
  reportado: 'Reportado',
  en_revision: 'En revisión',
  en_proceso: 'En proceso',
  solucionado: 'Solucionado',
};

/** Mensajes del historial en modo demostración. Son simulados: no hay integración con entidades públicas. */
export const MENSAJES_SIMULADOS: Record<Exclude<EstadoReporte, 'reportado'>, string> = {
  en_revision: 'Revisión simulada: el reporte quedó en cola de inspección técnica.',
  en_proceso: 'Proceso simulado: se programaron labores de reparación en el sitio.',
  solucionado: 'Solución simulada: el daño se marcó como reparado.',
};

function exigirModoDemo(): void {
  if (!env.MODO_DEMO) {
    throw new ErrorApi(403, 'MODO_DEMO_INACTIVO', 'El modo demostración está desactivado en este servidor.');
  }
}

/**
 * Modo demostración: avanza el reporte al siguiente estado institucional simulado.
 * El flujo es lineal y se detiene en "solucionado" (no vuelve a empezar).
 */
export async function avanzarEstado(reporteId: string, usuarioId: string): Promise<ReporteDto> {
  exigirModoDemo();
  const reporte = await asegurarReporte(reporteId);
  const indice = ORDEN_ESTADOS.indexOf(reporte.estado);
  if (indice === ORDEN_ESTADOS.length - 1) {
    throw conflicto('ESTADO_FINAL', 'Este reporte ya está solucionado; no hay un estado siguiente.');
  }
  const nuevoEstado = ORDEN_ESTADOS[indice + 1] as Exclude<EstadoReporte, 'reportado'>;
  const ahora = new Date();
  await prisma.$transaction([
    prisma.reporte.update({ where: { id: reporteId }, data: { estado: nuevoEstado } }),
    prisma.historialEstado.create({
      data: { id: randomUUID(), reporteId, estado: nuevoEstado, mensaje: MENSAJES_SIMULADOS[nuevoEstado], fecha: ahora, cambiadoPorId: usuarioId },
    }),
  ]);

  const seguidores = await prisma.seguimientoReporte.findMany({ where: { reporteId }, select: { usuarioId: true } });
  await notificarVarios([reporte.autorId, ...seguidores.map((s) => s.usuarioId)], {
    tipo: 'estado',
    motivo: nuevoEstado === 'solucionado' ? 'reporteSolucionado' : 'actualizacionEstado',
    titulo: `Actualización: ${reporte.direccion}`,
    mensaje: `El estado avanzó a "${NOMBRE_ESTADO[nuevoEstado]}": ${MENSAJES_SIMULADOS[nuevoEstado]}`,
    reporteId,
  });
  return obtenerReporte(reporteId, usuarioId);
}

/** Restablece los datos de demostración (reportes semilla, notificaciones y preferencias). */
export async function restablecerDatos(): Promise<void> {
  exigirModoDemo();
  await ejecutarSemilla(prisma, { directorioUploads: env.DIRECTORIO_UPLOADS, restablecerTodo: true });
}

export function estadoModoDemo() {
  return { modoDemo: env.MODO_DEMO };
}
