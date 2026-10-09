import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';
import { ErrorApi } from '../utils/errores.js';

function responder(response: Response, estado: number, codigo: string, mensaje: string, datos?: Record<string, unknown>) {
  response.status(estado).json({ error: { codigo, mensaje, ...(datos ?? {}) } });
}

export function rutaNoEncontrada(_request: Request, response: Response): void {
  responder(response, 404, 'RUTA_NO_ENCONTRADA', 'La ruta solicitada no existe.');
}

export function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction): void {
  if (error instanceof ErrorApi) {
    responder(response, error.estado, error.codigo, error.message, error.datos);
    return;
  }
  if (error instanceof ZodError) {
    const primero = error.issues[0];
    responder(response, 400, 'DATOS_INVALIDOS', primero?.message ?? 'Los datos enviados no son válidos.', {
      campos: error.issues.map((issue) => ({ campo: issue.path.join('.'), mensaje: issue.message })),
    });
    return;
  }
  if (error instanceof multer.MulterError) {
    const mensaje = error.code === 'LIMIT_FILE_SIZE' ? 'La imagen supera el tamaño máximo de 5 MB.' : 'No fue posible procesar el archivo enviado.';
    responder(response, 400, error.code === 'LIMIT_FILE_SIZE' ? 'IMAGEN_MUY_GRANDE' : 'ARCHIVO_INVALIDO', mensaje);
    return;
  }
  if (error instanceof SyntaxError && 'body' in error) {
    responder(response, 400, 'JSON_INVALIDO', 'El cuerpo de la solicitud no es un JSON válido.');
    return;
  }
  const estadoHttp = (error as { status?: number; statusCode?: number })?.status ?? (error as { statusCode?: number })?.statusCode;
  if (estadoHttp === 404) {
    responder(response, 404, 'NO_ENCONTRADO', 'El archivo solicitado no existe.');
    return;
  }
  if (estadoHttp === 413) {
    responder(response, 413, 'CUERPO_MUY_GRANDE', 'La solicitud es demasiado grande.');
    return;
  }
  const codigoPrisma = (error as { code?: string })?.code;
  if (codigoPrisma === 'P2002') {
    responder(response, 409, 'REGISTRO_DUPLICADO', 'Ya existe un registro con esos datos.');
    return;
  }
  console.error(error);
  responder(response, 500, 'ERROR_INTERNO', 'Ocurrió un error inesperado.');
}
