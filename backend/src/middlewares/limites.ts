import type { Request } from 'express';
import rateLimit from 'express-rate-limit';

const respuesta = (codigo: string, mensaje: string) => ({ error: { codigo, mensaje } });

/** Límite de intentos de inicio de sesión por IP (ventana de 15 minutos). */
export function crearLimiteLogin(maximo: number) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: maximo,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: respuesta('DEMASIADOS_INTENTOS', 'Demasiados intentos de inicio de sesión. Espera unos minutos e inténtalo de nuevo.'),
  });
}

/** Límite de reportes creados por usuario (o por IP si no hay sesión) en una hora. */
export function crearLimiteReportes(maximo: number) {
  return rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: maximo,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (request: Request) => request.usuarioId ?? request.ip ?? 'anonimo',
    message: respuesta('DEMASIADOS_REPORTES', 'Has publicado muchos reportes en poco tiempo. Inténtalo de nuevo más tarde.'),
  });
}
