import { z } from 'zod';

const latitud = z.coerce.number({ invalid_type_error: 'Latitud inválida.' }).min(-90).max(90);
const longitud = z.coerce.number({ invalid_type_error: 'Longitud inválida.' }).min(-180).max(180);

/** Campos del formulario multipart para crear un reporte (la foto llega en el campo `foto`). */
export const crearReporteSchema = z.object({
  categoria: z.string().trim().min(1, 'Selecciona una categoría.').max(50),
  subtipo: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((valor) => valor || undefined),
  severidad: z.enum(['leve', 'moderado', 'critico'], { errorMap: () => ({ message: 'Selecciona la severidad del daño.' }) }),
  descripcion: z.string().trim().max(200, 'La descripción puede tener máximo 200 caracteres.').optional(),
  lat: latitud,
  lng: longitud,
  direccion: z.string().trim().max(255).default('Armenia, Quindío'),
  forzar: z
    .enum(['true', 'false'])
    .optional()
    .transform((valor) => valor === 'true'),
});

export const duplicadoQuerySchema = z.object({
  categoria: z.string().trim().min(1).max(50),
  lat: latitud,
  lng: longitud,
});

export const confirmacionSchema = z.object({
  tipo: z.enum(['sigue', 'reparado'], { errorMap: () => ({ message: 'La confirmación debe ser "sigue" o "reparado".' }) }),
});

export const aporteSchema = z.object({
  texto: z.string().trim().min(1, 'Escribe tu aporte antes de enviarlo.').max(500, 'El aporte puede tener máximo 500 caracteres.'),
});

export const coordenadasQuerySchema = z.object({ lat: latitud, lng: longitud });

export const idParamSchema = z.object({ id: z.string().trim().min(1).max(36) });
