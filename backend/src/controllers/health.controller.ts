import type { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

export async function healthController(_request: Request, response: Response): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    response.status(200).json({ estado: 'ok', baseDatos: 'conectada' });
  } catch {
    response.status(503).json({ error: { codigo: 'BASE_DATOS_NO_DISPONIBLE', mensaje: 'No fue posible conectar con la base de datos.' } });
  }
}
