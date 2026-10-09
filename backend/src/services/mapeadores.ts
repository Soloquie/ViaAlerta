import type { Prisma } from '../../generated/client/index.js';
import { grupoDeFecha } from '../utils/fechas.js';
import { urlPublica } from '../utils/urls.js';

/** Número mínimo de vecinos que deben indicar "ya fue reparado" para mostrar el aviso comunitario. */
export const UMBRAL_AVISO_REPARADO = 3;

const ORDEN_FLUJO = ['reportado', 'en_revision', 'en_proceso', 'solucionado'];

export const incluirReporteCompleto = {
  autor: true,
  subtipo: true,
  historialEstados: { orderBy: { fecha: 'asc' } },
  confirmaciones: { select: { usuarioId: true, tipo: true } },
  seguimientos: { select: { usuarioId: true } },
  aportes: { include: { autor: true }, orderBy: { fecha: 'desc' } },
} satisfies Prisma.ReporteInclude;

export type ReporteCompleto = Prisma.ReporteGetPayload<{ include: typeof incluirReporteCompleto }>;

export function aUsuarioPublico(usuario: { usuario: string }) {
  return `@${usuario.usuario}`;
}

/** Convierte un reporte de Prisma a la forma `Reporte` que usa el frontend. */
export function aReporteDto(reporte: ReporteCompleto, usuarioActualId?: string) {
  const confirmacionesSigue = reporte.confirmaciones.filter((c) => c.tipo === 'sigue').length;
  const confirmacionesReparado = reporte.confirmaciones.filter((c) => c.tipo === 'reparado').length;
  const propia = usuarioActualId ? reporte.confirmaciones.find((c) => c.usuarioId === usuarioActualId) : undefined;

  return {
    id: reporte.id,
    categoria: reporte.categoriaId,
    subtipo: reporte.subtipo?.nombre ?? undefined,
    severidad: reporte.severidad,
    descripcion: reporte.descripcion,
    foto: urlPublica(reporte.fotoUrl),
    ubicacion: { lat: Number(reporte.latitud), lng: Number(reporte.longitud), direccion: reporte.direccion },
    fechaHora: reporte.fechaReporte.toISOString(),
    autorId: reporte.autorId,
    autorNombre: reporte.autor.nombre,
    autorUsuario: aUsuarioPublico(reporte.autor),
    autorFoto: urlPublica(reporte.autor.fotoUrl),
    estado: reporte.estado,
    // DATETIME guarda segundos: si dos cambios ocurren en el mismo segundo se desempata por el orden del flujo.
    historial: [...reporte.historialEstados]
      .sort((a, b) => a.fecha.getTime() - b.fecha.getTime() || ORDEN_FLUJO.indexOf(a.estado) - ORDEN_FLUJO.indexOf(b.estado))
      .map((h) => ({ estado: h.estado, fecha: h.fecha.toISOString(), mensaje: h.mensaje })),
    confirmacionesSigue,
    confirmacionesReparado,
    comunidadIndicaReparado: confirmacionesReparado >= UMBRAL_AVISO_REPARADO,
    seguidores: reporte.seguimientos.map((s) => s.usuarioId),
    aportes: reporte.aportes.map((a) => ({
      id: a.id,
      autorId: a.autorId,
      autor: a.autor.nombre,
      autorFoto: urlPublica(a.autor.fotoUrl) || undefined,
      texto: a.texto,
      foto: a.fotoUrl ? urlPublica(a.fotoUrl) : undefined,
      fecha: a.fecha.toISOString(),
    })),
    usuarioConfirmo: propia?.tipo ?? null,
  };
}

export type ReporteDto = ReturnType<typeof aReporteDto>;

export function aNotificacionDto(n: { id: string; titulo: string; mensaje: string; fecha: Date; leida: boolean; tipo: string; reporteId: string | null }, ahora = new Date()) {
  return {
    id: n.id,
    titulo: n.titulo,
    mensaje: n.mensaje,
    fecha: n.fecha.toISOString(),
    grupo: grupoDeFecha(n.fecha, ahora),
    leida: n.leida,
    tipo: n.tipo,
    reporteId: n.reporteId ?? undefined,
  };
}

export function aAlertaDto(a: {
  id: string; titulo: string; descripcion: string; sector: string; municipio: string; latitud: unknown; longitud: unknown;
  fecha: Date; rutaAlterna: string | null; lineaEmergencias: string | null; hashtag: string | null;
}) {
  return {
    id: a.id,
    titulo: a.titulo,
    descripcion: a.descripcion,
    sector: a.sector,
    municipio: a.municipio,
    ubicacion: { lat: Number(a.latitud), lng: Number(a.longitud) },
    fecha: a.fecha.toISOString(),
    rutaAlterna: a.rutaAlterna ?? undefined,
    lineaEmergencias: a.lineaEmergencias ?? undefined,
    hashtag: a.hashtag ?? undefined,
  };
}
