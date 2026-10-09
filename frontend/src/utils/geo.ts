import { geocodificarInversa } from '../api/servicios';

// Coordenadas del centro de Armenia, Quindío
export const ARMENIA_CENTER = {
  lat: 4.5339,
  lng: -75.6811,
};

// Caché en memoria de la sesión; el backend mantiene además una caché persistente en MySQL.
const geocodeCache = new Map<string, string>();

/**
 * Geocodificación inversa a través del backend (que consulta OpenStreetMap Nominatim
 * respetando su límite de 1 solicitud por segundo y guarda el resultado en caché).
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const enCache = geocodeCache.get(key);
  if (enCache) return enCache;
  try {
    const direccion = await geocodificarInversa(lat, lng);
    geocodeCache.set(key, direccion);
    return direccion;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

/**
 * Fecha y hora en español de Colombia
 */
export function formatFechaHora(date: Date = new Date()): string {
  return date.toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
