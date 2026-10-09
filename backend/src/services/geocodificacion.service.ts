import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';

/** Nominatim exige como máximo 1 solicitud por segundo; se serializan las llamadas externas. */
const INTERVALO_MINIMO_MS = 1100;
let cola: Promise<unknown> = Promise.resolve();
let ultimaLlamada = 0;

export function claveGeocodificacion(lat: number, lng: number): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

export function direccionDeRespaldo(lat: number, lng: number): string {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

type RespuestaNominatim = {
  display_name?: string;
  address?: Record<string, string | undefined>;
};

/** Construye una dirección corta al estilo colombiano a partir de la respuesta de Nominatim. */
export function formatearDireccion(datos: RespuestaNominatim): string | null {
  const direccion = datos.address;
  if (direccion) {
    const via = direccion.road || direccion.pedestrian || direccion.neighbourhood || direccion.suburb;
    const numero = direccion.house_number ? ` #${direccion.house_number}` : '';
    const ciudad = direccion.city || direccion.town || direccion.municipality || 'Armenia';
    if (via) return `${via}${numero}, ${ciudad}`;
  }
  if (datos.display_name) return datos.display_name.split(',').slice(0, 2).join(',').trim();
  return null;
}

async function consultarNominatim(lat: number, lng: number): Promise<string | null> {
  const turno = cola.then(async () => {
    const espera = INTERVALO_MINIMO_MS - (Date.now() - ultimaLlamada);
    if (espera > 0) await new Promise((resolver) => setTimeout(resolver, espera));
    ultimaLlamada = Date.now();
    const url = `${env.NOMINATIM_URL}/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const respuesta = await fetch(url, {
      headers: { 'User-Agent': env.NOMINATIM_USER_AGENT, 'Accept-Language': 'es' },
      signal: AbortSignal.timeout(6000),
    });
    if (!respuesta.ok) return null;
    return formatearDireccion((await respuesta.json()) as RespuestaNominatim);
  });
  cola = turno.catch(() => undefined);
  try {
    return await turno;
  } catch {
    return null;
  }
}

/**
 * Geocodificación inversa con caché en MySQL (`cache_geocodificacion`).
 * Las coordenadas se redondean a 4 decimales (~11 m). Si Nominatim falla, se devuelven las coordenadas.
 */
export async function geocodificarInversa(lat: number, lng: number): Promise<{ direccion: string; desdeCache: boolean }> {
  const clave = claveGeocodificacion(lat, lng);
  const enCache = await prisma.cacheGeocodificacion.findUnique({ where: { clave } });
  if (enCache) return { direccion: enCache.direccion, desdeCache: true };

  const direccion = env.GEOCODIFICACION_EXTERNA ? await consultarNominatim(lat, lng) : null;
  if (!direccion) return { direccion: direccionDeRespaldo(lat, lng), desdeCache: false };

  await prisma.cacheGeocodificacion.upsert({
    where: { clave },
    update: { direccion: direccion.slice(0, 255), fecha: new Date() },
    create: { clave, direccion: direccion.slice(0, 255), fecha: new Date() },
  });
  return { direccion, desdeCache: false };
}
