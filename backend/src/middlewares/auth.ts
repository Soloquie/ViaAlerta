import type { NextFunction, Request, Response } from 'express';
import { verificarToken } from '../services/auth.service.js';
import { noAutorizado } from '../utils/errores.js';

declare module 'express-serve-static-core' {
  interface Request {
    usuarioId?: string;
  }
}

function extraerToken(request: Request): string | undefined {
  const cabecera = request.headers.authorization;
  if (!cabecera?.startsWith('Bearer ')) return undefined;
  return cabecera.slice('Bearer '.length).trim() || undefined;
}

/** Exige un JWT válido en `Authorization: Bearer <token>`. */
export function requiereAuth(request: Request, _response: Response, next: NextFunction): void {
  const token = extraerToken(request);
  if (!token) throw noAutorizado();
  request.usuarioId = verificarToken(token);
  next();
}

/** Si hay token válido, identifica al usuario; si no, continúa como anónimo. */
export function authOpcional(request: Request, _response: Response, next: NextFunction): void {
  const token = extraerToken(request);
  if (token) {
    try {
      request.usuarioId = verificarToken(token);
    } catch {
      request.usuarioId = undefined;
    }
  }
  next();
}

/** Devuelve el id del usuario autenticado (para usar después de `requiereAuth`). */
export function usuarioDe(request: Request): string {
  if (!request.usuarioId) throw noAutorizado();
  return request.usuarioId;
}
