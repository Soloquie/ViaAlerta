/** Formatos de fecha en español de Colombia (hora de Bogotá). La API entrega fechas ISO en UTC. */
const ZONA = 'America/Bogota';

function partes(fecha: Date) {
  const formato = new Intl.DateTimeFormat('es-CO', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit' });
  return formato.format(fecha);
}

function diasDeDiferencia(fecha: Date, ahora: Date): number {
  const aDia = (d: Date) => {
    const [dia, mes, anio] = partes(d).split('/').map(Number);
    return Date.UTC(anio, mes - 1, dia) / 86_400_000;
  };
  return aDia(ahora) - aDia(fecha);
}

/** "22 sep 2026, 5:42 p. m." */
export function fechaHoraLarga(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return iso;
  return fecha.toLocaleString('es-CO', { timeZone: ZONA, day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
}

/** "5:42 p. m." */
export function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-CO', { timeZone: ZONA, hour: 'numeric', minute: '2-digit', hour12: true });
}

/** "Ahora mismo", "Hace 5 min", "Hoy, 9:20 a. m.", "Ayer, 9:20 a. m.", "Hace 3 días" o la fecha corta. */
export function fechaRelativa(iso: string, ahora = new Date()): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return iso;
  const minutos = Math.floor((ahora.getTime() - fecha.getTime()) / 60_000);
  if (minutos < 1) return 'Ahora mismo';
  if (minutos < 60) return `Hace ${minutos} min`;
  const dias = diasDeDiferencia(fecha, ahora);
  if (dias === 0) return `Hoy, ${hora(iso)}`;
  if (dias === 1) return `Ayer, ${hora(iso)}`;
  if (dias < 7) return `Hace ${dias} días`;
  return fecha.toLocaleDateString('es-CO', { timeZone: ZONA, day: 'numeric', month: 'short', year: 'numeric' });
}

/** Hora para notificaciones de hoy/ayer y día de la semana ("Lun") para las anteriores. */
export function fechaNotificacion(iso: string, grupo: 'hoy' | 'ayer' | 'esta_semana'): string {
  const fecha = new Date(iso);
  if (grupo !== 'esta_semana') {
    return fecha.toLocaleTimeString('es-CO', { timeZone: ZONA, hour: '2-digit', minute: '2-digit', hour12: false });
  }
  const dia = fecha.toLocaleDateString('es-CO', { timeZone: ZONA, weekday: 'short' }).replace('.', '');
  return dia.charAt(0).toUpperCase() + dia.slice(1);
}
