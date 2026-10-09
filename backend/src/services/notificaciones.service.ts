import { randomUUID } from 'node:crypto';
import { prisma } from '../config/prisma.js';
import { noEncontrado } from '../utils/errores.js';
import { aNotificacionDto } from './mapeadores.js';

export type TipoNotificacion = 'alerta' | 'comentario' | 'verificacion' | 'estado' | 'seguidor';

/** Preferencia del usuario que habilita cada motivo de notificación. */
export type MotivoNotificacion =
  | 'nuevoComentario'
  | 'respuestasComentarios'
  | 'actualizacionEstado'
  | 'reporteSolucionado'
  | 'reportesCerca';

export interface DatosNotificacion {
  usuarioId: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  reporteId?: string | null;
  /** Si se indica, solo se crea cuando el usuario tiene activa esa preferencia. */
  motivo?: MotivoNotificacion;
}

const PREFERENCIAS_POR_DEFECTO = {
  nuevoComentario: true,
  actualizacionEstado: true,
  reporteSolucionado: true,
  reportesCerca: true,
  respuestasComentarios: true,
};

export type Preferencias = typeof PREFERENCIAS_POR_DEFECTO;

export async function obtenerPreferencias(usuarioId: string): Promise<Preferencias> {
  const preferencia = await prisma.preferenciaNotificacion.findUnique({ where: { usuarioId } });
  if (!preferencia) return { ...PREFERENCIAS_POR_DEFECTO };
  return {
    nuevoComentario: preferencia.nuevoComentario,
    actualizacionEstado: preferencia.actualizacionEstado,
    reporteSolucionado: preferencia.reporteSolucionado,
    reportesCerca: preferencia.reportesCerca,
    respuestasComentarios: preferencia.respuestasComentarios,
  };
}

export async function guardarPreferencias(usuarioId: string, preferencias: Preferencias): Promise<Preferencias> {
  await prisma.preferenciaNotificacion.upsert({
    where: { usuarioId },
    update: preferencias,
    create: { usuarioId, ...preferencias },
  });
  return obtenerPreferencias(usuarioId);
}

/** Crea una notificación respetando las preferencias del destinatario. Devuelve `true` si se creó. */
export async function crearNotificacion(datos: DatosNotificacion): Promise<boolean> {
  if (datos.motivo) {
    const preferencias = await obtenerPreferencias(datos.usuarioId);
    if (!preferencias[datos.motivo]) return false;
  }
  await prisma.notificacion.create({
    data: {
      id: randomUUID(),
      usuarioId: datos.usuarioId,
      tipo: datos.tipo,
      titulo: datos.titulo.slice(0, 150),
      mensaje: datos.mensaje.slice(0, 500),
      reporteId: datos.reporteId ?? null,
      leida: false,
      fecha: new Date(),
    },
  });
  return true;
}

/** Notifica a varios destinatarios (sin duplicados) con los mismos datos. */
export async function notificarVarios(usuarioIds: Iterable<string>, datos: Omit<DatosNotificacion, 'usuarioId'>): Promise<number> {
  let creadas = 0;
  for (const usuarioId of new Set(usuarioIds)) {
    if (await crearNotificacion({ ...datos, usuarioId })) creadas += 1;
  }
  return creadas;
}

export async function listarNotificaciones(usuarioId: string) {
  const notificaciones = await prisma.notificacion.findMany({
    where: { usuarioId },
    orderBy: { fecha: 'desc' },
    take: 100,
  });
  const ahora = new Date();
  return notificaciones.map((n) => aNotificacionDto(n, ahora));
}

export async function marcarTodasLeidas(usuarioId: string): Promise<void> {
  await prisma.notificacion.updateMany({ where: { usuarioId, leida: false }, data: { leida: true } });
}

export async function marcarLeida(usuarioId: string, notificacionId: string): Promise<void> {
  const resultado = await prisma.notificacion.updateMany({ where: { id: notificacionId, usuarioId }, data: { leida: true } });
  if (resultado.count === 0) throw noEncontrado('La notificación no existe.');
}
