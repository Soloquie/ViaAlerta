import type { Request, Response } from 'express';
import { usuarioDe } from '../middlewares/auth.js';
import * as notificaciones from '../services/notificaciones.service.js';
import { idParamSchema } from '../validators/reportes.validators.js';
import { preferenciasSchema } from '../validators/usuarios.validators.js';

export async function listar(request: Request, response: Response): Promise<void> {
  response.json(await notificaciones.listarNotificaciones(usuarioDe(request)));
}

export async function marcarTodas(request: Request, response: Response): Promise<void> {
  await notificaciones.marcarTodasLeidas(usuarioDe(request));
  response.status(204).end();
}

export async function marcarUna(request: Request, response: Response): Promise<void> {
  const { id } = idParamSchema.parse(request.params);
  await notificaciones.marcarLeida(usuarioDe(request), id);
  response.status(204).end();
}

export async function obtenerPreferencias(request: Request, response: Response): Promise<void> {
  response.json(await notificaciones.obtenerPreferencias(usuarioDe(request)));
}

export async function guardarPreferencias(request: Request, response: Response): Promise<void> {
  const preferencias = preferenciasSchema.parse(request.body);
  response.json(await notificaciones.guardarPreferencias(usuarioDe(request), preferencias));
}
