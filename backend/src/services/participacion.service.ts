import { randomUUID } from 'node:crypto';
import { prisma } from '../config/prisma.js';
import { solicitudInvalida } from '../utils/errores.js';
import { eliminarImagen, guardarImagen } from './archivos.service.js';
import { UMBRAL_AVISO_REPARADO, type ReporteDto } from './mapeadores.js';
import { notificarVarios } from './notificaciones.service.js';
import { asegurarReporte, obtenerReporte } from './reportes.service.js';

export type TipoConfirmacion = 'sigue' | 'reparado';

/**
 * Confirmación ciudadana "¿El daño sigue presente?".
 * Cada usuario tiene como máximo una confirmación por reporte:
 * - Si elige la misma opción que ya tenía, se retira (deshacer).
 * - Si elige la otra opción, se cambia.
 * Cuando el reporte alcanza 3 indicaciones de "ya fue reparado" se avisa al autor y a los seguidores,
 * pero el estado NO cambia automáticamente: el aviso es solo comunitario.
 */
export async function confirmarDanio(reporteId: string, usuarioId: string, tipo: TipoConfirmacion): Promise<ReporteDto> {
  const reporte = await asegurarReporte(reporteId);
  const reparadoAntes = await prisma.confirmacion.count({ where: { reporteId, tipo: 'reparado' } });

  const existente = await prisma.confirmacion.findUnique({ where: { reporteId_usuarioId: { reporteId, usuarioId } } });
  if (existente?.tipo === tipo) {
    await prisma.confirmacion.delete({ where: { id: existente.id } });
  } else if (existente) {
    await prisma.confirmacion.update({ where: { id: existente.id }, data: { tipo, fecha: new Date() } });
  } else {
    await prisma.confirmacion.create({ data: { id: randomUUID(), reporteId, usuarioId, tipo, fecha: new Date() } });
  }

  const reparadoDespues = await prisma.confirmacion.count({ where: { reporteId, tipo: 'reparado' } });
  if (reparadoAntes < UMBRAL_AVISO_REPARADO && reparadoDespues >= UMBRAL_AVISO_REPARADO) {
    const seguidores = await prisma.seguimientoReporte.findMany({ where: { reporteId }, select: { usuarioId: true } });
    await notificarVarios([reporte.autorId, ...seguidores.map((s) => s.usuarioId)], {
      tipo: 'verificacion',
      motivo: 'reporteSolucionado',
      titulo: 'La comunidad indica que el daño fue reparado',
      mensaje: `${reparadoDespues} vecinos indicaron que ${reporte.direccion} ya fue reparado. El estado del reporte no cambia automáticamente.`,
      reporteId,
    });
  }
  return obtenerReporte(reporteId, usuarioId);
}

/** Seguir un reporte para recibir sus actualizaciones (idempotente). */
export async function seguirReporte(reporteId: string, usuarioId: string): Promise<ReporteDto> {
  await asegurarReporte(reporteId);
  await prisma.seguimientoReporte.upsert({
    where: { usuarioId_reporteId: { usuarioId, reporteId } },
    update: {},
    create: { usuarioId, reporteId, fecha: new Date() },
  });
  return obtenerReporte(reporteId, usuarioId);
}

export async function dejarDeSeguirReporte(reporteId: string, usuarioId: string): Promise<ReporteDto> {
  await asegurarReporte(reporteId);
  await prisma.seguimientoReporte.deleteMany({ where: { usuarioId, reporteId } });
  return obtenerReporte(reporteId, usuarioId);
}

/**
 * Aporte ciudadano (comentario con foto opcional). Notifica al autor del reporte
 * (preferencia "nuevo comentario") y a los demás seguidores (preferencia "respuestas a comentarios").
 */
export async function crearAporte(reporteId: string, autorId: string, texto: string, foto?: Buffer): Promise<ReporteDto> {
  const reporte = await asegurarReporte(reporteId);
  const limpio = texto.trim();
  if (!limpio) throw solicitudInvalida('TEXTO_REQUERIDO', 'Escribe tu aporte antes de enviarlo.');

  const fotoUrl = foto ? await guardarImagen(foto, 'aportes') : null;
  try {
    await prisma.aporte.create({ data: { id: randomUUID(), reporteId, autorId, texto: limpio, fotoUrl, fecha: new Date() } });
  } catch (error) {
    await eliminarImagen(fotoUrl);
    throw error;
  }

  const autor = await prisma.usuario.findUniqueOrThrow({ where: { id: autorId }, select: { nombre: true } });
  const resumen = limpio.length > 75 ? `${limpio.slice(0, 75)}…` : limpio;
  if (reporte.autorId !== autorId) {
    await notificarVarios([reporte.autorId], {
      tipo: 'comentario',
      motivo: 'nuevoComentario',
      titulo: `${autor.nombre.split(' ')[0]} comentó tu reporte`,
      mensaje: `“${resumen}”`,
      reporteId,
    });
  }
  const seguidores = await prisma.seguimientoReporte.findMany({ where: { reporteId }, select: { usuarioId: true } });
  await notificarVarios(
    seguidores.map((s) => s.usuarioId).filter((id) => id !== autorId && id !== reporte.autorId),
    {
      tipo: 'comentario',
      motivo: 'respuestasComentarios',
      titulo: 'Nuevo aporte en un reporte que sigues',
      mensaje: `“${resumen}” por ${autor.nombre}`,
      reporteId,
    },
  );
  return obtenerReporte(reporteId, autorId);
}
