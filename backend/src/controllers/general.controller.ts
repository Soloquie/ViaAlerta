import type { Request, Response } from 'express';
import { usuarioDe } from '../middlewares/auth.js';
import { listarAlertas } from '../services/alertas.service.js';
import * as demoService from '../services/demo.service.js';
import { registrarEvento, resumenEventos } from '../services/eventos.service.js';
import { geocodificarInversa } from '../services/geocodificacion.service.js';
import { coordenadasQuerySchema } from '../validators/reportes.validators.js';
import { eventoSchema, resumenEventosQuerySchema } from '../validators/usuarios.validators.js';

export async function alertas(_request: Request, response: Response): Promise<void> {
  response.json(await listarAlertas());
}

export async function geocodificacion(request: Request, response: Response): Promise<void> {
  const { lat, lng } = coordenadasQuerySchema.parse(request.query);
  response.json(await geocodificarInversa(lat, lng));
}

export async function evento(request: Request, response: Response): Promise<void> {
  const { evento, datos } = eventoSchema.parse(request.body);
  await registrarEvento(evento, request.usuarioId, datos);
  response.status(204).end();
}

export async function metricas(request: Request, response: Response): Promise<void> {
  usuarioDe(request);
  const { desde } = resumenEventosQuerySchema.parse(request.query);
  response.json(await resumenEventos(desde));
}

export async function estadoDemo(_request: Request, response: Response): Promise<void> {
  response.json(demoService.estadoModoDemo());
}

export async function restablecerDemo(request: Request, response: Response): Promise<void> {
  usuarioDe(request);
  await demoService.restablecerDatos();
  response.status(204).end();
}
