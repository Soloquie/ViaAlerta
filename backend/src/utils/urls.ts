import { env } from '../config/env.js';

/**
 * MySQL guarda rutas relativas como `/uploads/reportes/archivo.jpg`.
 * La API responde con la URL pública completa usando `URL_PUBLICA_UPLOADS`.
 */
export function urlPublica(ruta: string | null | undefined): string {
  if (!ruta) return '';
  if (/^https?:\/\//i.test(ruta) || ruta.startsWith('data:')) return ruta;
  const base = env.URL_PUBLICA_UPLOADS.replace(/\/+$/, '');
  const relativa = ruta.replace(/^\/?uploads\/?/, '');
  return `${base}/${relativa}`;
}
