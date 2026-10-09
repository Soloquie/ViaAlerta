import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env.js';
import { solicitudInvalida } from '../utils/errores.js';

export const TAMANO_MAXIMO_IMAGEN = 5 * 1024 * 1024; // 5 MB

export type CarpetaImagenes = 'reportes' | 'aportes' | 'perfiles';

/** Detecta el formato real de la imagen por su firma (no se confía en la extensión ni en el MIME enviado). */
export function detectarFormatoImagen(contenido: Buffer): 'jpg' | 'png' | 'webp' | null {
  if (contenido.length >= 3 && contenido[0] === 0xff && contenido[1] === 0xd8 && contenido[2] === 0xff) return 'jpg';
  if (contenido.length >= 8 && contenido.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (contenido.length >= 12 && contenido.toString('ascii', 0, 4) === 'RIFF' && contenido.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}

/** Valida y guarda una imagen en `uploads/<carpeta>`. Devuelve la ruta relativa que se almacena en MySQL. */
export async function guardarImagen(contenido: Buffer, carpeta: CarpetaImagenes): Promise<string> {
  if (contenido.length === 0) throw solicitudInvalida('IMAGEN_VACIA', 'La imagen está vacía.');
  if (contenido.length > TAMANO_MAXIMO_IMAGEN) throw solicitudInvalida('IMAGEN_MUY_GRANDE', 'La imagen supera el tamaño máximo de 5 MB.');
  const formato = detectarFormatoImagen(contenido);
  if (!formato) throw solicitudInvalida('FORMATO_IMAGEN_INVALIDO', 'Solo se aceptan imágenes JPG, PNG o WebP.');

  const directorio = path.resolve(env.DIRECTORIO_UPLOADS, carpeta);
  await mkdir(directorio, { recursive: true });
  const nombre = `${randomUUID()}.${formato}`;
  await writeFile(path.join(directorio, nombre), contenido);
  return `/uploads/${carpeta}/${nombre}`;
}

/** Elimina un archivo subido previamente (se ignora si no existe o si es de la semilla). */
export async function eliminarImagen(ruta: string | null | undefined): Promise<void> {
  if (!ruta || !ruta.startsWith('/uploads/') || ruta.startsWith('/uploads/seed/')) return;
  const relativa = ruta.replace(/^\/uploads\//, '');
  await unlink(path.resolve(env.DIRECTORIO_UPLOADS, relativa)).catch(() => undefined);
}
