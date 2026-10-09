import { randomUUID } from 'node:crypto';
import { prisma } from '../config/prisma.js';

export const EVENTOS_USO = [
  'mapa_abierto',
  'marcador_tocado',
  'reporte_iniciado',
  'reporte_paso_completado',
  'reporte_publicado',
  'reporte_seguido',
  'confirmacion_enviada',
  'mis_reportes_abierto',
  'alerta_abierta',
] as const;

export type EventoUso = (typeof EVENTOS_USO)[number];

/** Registra un evento de uso para las métricas del proyecto (Design Thinking: fase de testeo). */
export async function registrarEvento(evento: EventoUso, usuarioId: string | undefined, datos?: Record<string, unknown>): Promise<void> {
  await prisma.eventoUsoRegistro.create({
    data: { id: randomUUID(), evento, usuarioId: usuarioId ?? null, datos: datos ? JSON.parse(JSON.stringify(datos)) : undefined, fecha: new Date() },
  });
}

/** Resumen de métricas: total de eventos y usuarios distintos por tipo de evento, opcionalmente desde una fecha. */
export async function resumenEventos(desde?: Date) {
  const where = desde ? { fecha: { gte: desde } } : {};
  const [porEvento, usuarios] = await Promise.all([
    prisma.eventoUsoRegistro.groupBy({ by: ['evento'], where, _count: { _all: true } }),
    prisma.eventoUsoRegistro.findMany({ where: { ...where, usuarioId: { not: null } }, select: { evento: true, usuarioId: true }, distinct: ['evento', 'usuarioId'] }),
  ]);
  return EVENTOS_USO.map((evento) => ({
    evento,
    total: porEvento.find((fila) => fila.evento === evento)?._count._all ?? 0,
    usuariosDistintos: usuarios.filter((fila) => fila.evento === evento).length,
  }));
}
