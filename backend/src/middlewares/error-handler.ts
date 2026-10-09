import type { NextFunction, Request, Response } from 'express';

export function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction): void {
  console.error(error);
  response.status(500).json({ error: { codigo: 'ERROR_INTERNO', mensaje: 'Ocurrió un error inesperado.' } });
}
