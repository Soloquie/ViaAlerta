import { randomUUID } from 'node:crypto';
import { prisma } from '../config/prisma.js';
import { conflicto, noEncontrado, solicitudInvalida } from '../utils/errores.js';
import { cajaAlrededor, distanciaMetros } from '../utils/geo.js';
import { eliminarImagen, guardarImagen } from './archivos.service.js';
import { aReporteDto, incluirReporteCompleto, type ReporteDto } from './mapeadores.js';
import { notificarVarios } from './notificaciones.service.js';

/** Radio en metros dentro del cual un reporte activo de la misma categoría se considera duplicado. */
export const RADIO_DUPLICADO_METROS = 30;
/** Radio en metros para avisar a vecinos que han reportado cerca ("reportes cerca de ti"). */
export const RADIO_REPORTES_CERCA_METROS = 1000;
export const DESCRIPCION_POR_DEFECTO = 'Reporte de daño vial registrado por la comunidad.';
export const MENSAJE_REPORTE_PUBLICADO = 'Tu reporte se publicó en el mapa y en la red ciudadana.';

export type Severidad = 'leve' | 'moderado' | 'critico';

export interface DatosNuevoReporte {
  categoria: string;
  subtipo?: string;
  severidad: Severidad;
  descripcion?: string;
  lat: number;
  lng: number;
  direccion: string;
  /** Publicar aunque exista un posible duplicado (el usuario eligió "Publicar nuevo de todos modos"). */
  forzar?: boolean;
}

export async function listarReportes(usuarioActualId?: string): Promise<ReporteDto[]> {
  const reportes = await prisma.reporte.findMany({ include: incluirReporteCompleto, orderBy: { fechaReporte: 'desc' } });
  return reportes.map((reporte) => aReporteDto(reporte, usuarioActualId));
}

export async function obtenerReporte(reporteId: string, usuarioActualId?: string): Promise<ReporteDto> {
  const reporte = await prisma.reporte.findUnique({ where: { id: reporteId }, include: incluirReporteCompleto });
  if (!reporte) throw noEncontrado('El reporte no existe.');
  return aReporteDto(reporte, usuarioActualId);
}

/** Verifica que el reporte exista (para servicios que operan sobre un reporte). */
export async function asegurarReporte(reporteId: string) {
  const reporte = await prisma.reporte.findUnique({ where: { id: reporteId }, select: { id: true, autorId: true, direccion: true, estado: true } });
  if (!reporte) throw noEncontrado('El reporte no existe.');
  return reporte;
}

/**
 * Regla de duplicados: existe un reporte de la misma categoría, que no esté solucionado,
 * a una distancia menor o igual a 30 metros. Devuelve el más cercano.
 */
export async function buscarDuplicado(categoria: string, lat: number, lng: number, usuarioActualId?: string): Promise<ReporteDto | null> {
  const caja = cajaAlrededor(lat, lng, RADIO_DUPLICADO_METROS);
  const candidatos = await prisma.reporte.findMany({
    where: {
      categoriaId: categoria,
      estado: { not: 'solucionado' },
      latitud: { gte: caja.latMin, lte: caja.latMax },
      longitud: { gte: caja.lngMin, lte: caja.lngMax },
    },
    include: incluirReporteCompleto,
  });
  const cercanos = candidatos
    .map((reporte) => ({ reporte, distancia: distanciaMetros(lat, lng, Number(reporte.latitud), Number(reporte.longitud)) }))
    .filter(({ distancia }) => distancia <= RADIO_DUPLICADO_METROS)
    .sort((a, b) => a.distancia - b.distancia);
  return cercanos.length ? aReporteDto(cercanos[0].reporte, usuarioActualId) : null;
}

async function validarCategoria(categoria: string, subtipo?: string): Promise<string | null> {
  const existe = await prisma.categoria.findUnique({ where: { id: categoria }, include: { subtipos: true } });
  if (!existe) throw solicitudInvalida('CATEGORIA_INVALIDA', 'La categoría seleccionada no existe.');
  if (!subtipo) return null;
  const encontrado = existe.subtipos.find((s) => s.nombre === subtipo);
  if (!encontrado) throw solicitudInvalida('SUBTIPO_INVALIDO', 'El subtipo no corresponde a la categoría seleccionada.');
  return encontrado.id;
}

/**
 * Crea un reporte. La foto es obligatoria. Al publicar:
 * el autor queda siguiendo el reporte, cuenta como primera confirmación "sigue ahí"
 * y se registra el estado inicial "reportado" en el historial.
 */
export async function crearReporte(autorId: string, datos: DatosNuevoReporte, foto: Buffer | undefined): Promise<ReporteDto> {
  if (!foto) throw solicitudInvalida('FOTO_REQUERIDA', 'La fotografía del daño es obligatoria para verificar el reporte.');
  const subtipoId = await validarCategoria(datos.categoria, datos.subtipo);

  if (!datos.forzar) {
    const duplicado = await buscarDuplicado(datos.categoria, datos.lat, datos.lng, autorId);
    if (duplicado) {
      throw conflicto('REPORTE_DUPLICADO', 'Parece que este daño ya fue reportado a menos de 30 metros.', { duplicado });
    }
  }

  const fotoUrl = await guardarImagen(foto, 'reportes');
  const id = randomUUID();
  const ahora = new Date();
  try {
    await prisma.$transaction(async (tx) => {
      await tx.reporte.create({
        data: {
          id,
          autorId,
          categoriaId: datos.categoria,
          subtipoId,
          severidad: datos.severidad,
          descripcion: datos.descripcion?.trim() || DESCRIPCION_POR_DEFECTO,
          fotoUrl,
          latitud: datos.lat,
          longitud: datos.lng,
          direccion: datos.direccion.trim() || 'Armenia, Quindío',
          estado: 'reportado',
          fechaReporte: ahora,
        },
      });
      await tx.historialEstado.create({
        data: { id: randomUUID(), reporteId: id, estado: 'reportado', mensaje: MENSAJE_REPORTE_PUBLICADO, fecha: ahora, cambiadoPorId: autorId },
      });
      await tx.confirmacion.create({ data: { id: randomUUID(), reporteId: id, usuarioId: autorId, tipo: 'sigue', fecha: ahora } });
      await tx.seguimientoReporte.create({ data: { usuarioId: autorId, reporteId: id, fecha: ahora } });
    });
  } catch (error) {
    await eliminarImagen(fotoUrl);
    throw error;
  }

  await notificarVecinos(id, autorId, datos);
  return obtenerReporte(id, autorId);
}

/** Avisa a ciudadanos que han reportado a menos de 1 km (preferencia "reportes cerca"). */
async function notificarVecinos(reporteId: string, autorId: string, datos: DatosNuevoReporte): Promise<void> {
  const caja = cajaAlrededor(datos.lat, datos.lng, RADIO_REPORTES_CERCA_METROS);
  const cercanos = await prisma.reporte.findMany({
    where: {
      id: { not: reporteId },
      autorId: { not: autorId },
      latitud: { gte: caja.latMin, lte: caja.latMax },
      longitud: { gte: caja.lngMin, lte: caja.lngMax },
    },
    select: { autorId: true, latitud: true, longitud: true },
  });
  const vecinos = cercanos
    .filter((r) => distanciaMetros(datos.lat, datos.lng, Number(r.latitud), Number(r.longitud)) <= RADIO_REPORTES_CERCA_METROS)
    .map((r) => r.autorId);
  const categoria = await prisma.categoria.findUnique({ where: { id: datos.categoria }, select: { nombre: true } });
  await notificarVarios(vecinos, {
    tipo: 'alerta',
    motivo: 'reportesCerca',
    titulo: 'Nuevo reporte cerca de tu zona',
    mensaje: `${datos.subtipo || categoria?.nombre || 'Daño vial'} en ${datos.direccion}. Transita con precaución.`,
    reporteId,
  });
}

export async function listarReportesDeUsuario(autorId: string, usuarioActualId?: string): Promise<ReporteDto[]> {
  const reportes = await prisma.reporte.findMany({ where: { autorId }, include: incluirReporteCompleto, orderBy: { fechaReporte: 'desc' } });
  return reportes.map((reporte) => aReporteDto(reporte, usuarioActualId));
}
