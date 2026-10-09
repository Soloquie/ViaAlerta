import { z } from 'zod';
import { EVENTOS_USO } from '../services/eventos.service.js';
import { nombreUsuarioSchema } from './auth.validators.js';

/** Edición del perfil (multipart: la foto opcional llega en el campo `foto`). */
export const perfilSchema = z.object({
  nombre: z.string().trim().min(2, 'Escribe tu nombre.').max(120).optional(),
  usuario: nombreUsuarioSchema.optional(),
  correo: z.string().trim().toLowerCase().email('Escribe un correo válido.').max(150).optional(),
  telefono: z.string().trim().max(30).optional(),
  ciudad: z.string().trim().max(120).optional(),
  biografia: z.string().trim().max(500, 'La biografía puede tener máximo 500 caracteres.').optional(),
});

export const preferenciasSchema = z.object({
  nuevoComentario: z.boolean(),
  actualizacionEstado: z.boolean(),
  reporteSolucionado: z.boolean(),
  reportesCerca: z.boolean(),
  respuestasComentarios: z.boolean(),
});

export const eventoSchema = z.object({
  evento: z.enum(EVENTOS_USO),
  datos: z.record(z.unknown()).optional(),
});

export const resumenEventosQuerySchema = z.object({
  desde: z.coerce.date().optional(),
});
