/** Zona horaria usada para agrupar notificaciones (Colombia no tiene horario de verano: UTC-5). */
const DESFASE_COLOMBIA_MS = -5 * 60 * 60 * 1000;

function diaLocal(fecha: Date): number {
  return Math.floor((fecha.getTime() + DESFASE_COLOMBIA_MS) / 86_400_000);
}

export type GrupoNotificacion = 'hoy' | 'ayer' | 'esta_semana';

/** Agrupa una fecha UTC en "hoy", "ayer" o "esta_semana" según la hora de Colombia. */
export function grupoDeFecha(fecha: Date, ahora: Date = new Date()): GrupoNotificacion {
  const diferencia = diaLocal(ahora) - diaLocal(fecha);
  if (diferencia <= 0) return 'hoy';
  if (diferencia === 1) return 'ayer';
  return 'esta_semana';
}
