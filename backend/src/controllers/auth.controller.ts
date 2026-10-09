import type { Request, Response } from 'express';
import { usuarioDe } from '../middlewares/auth.js';
import * as authService from '../services/auth.service.js';
import { obtenerPerfil } from '../services/usuarios.service.js';
import { cambioContrasenaSchema, loginSchema, registroSchema } from '../validators/auth.validators.js';

export async function registro(request: Request, response: Response): Promise<void> {
  const datos = registroSchema.parse(request.body);
  response.status(201).json(await authService.registrar(datos));
}

export async function login(request: Request, response: Response): Promise<void> {
  const { identificador, contrasena } = loginSchema.parse(request.body);
  response.json(await authService.iniciarSesion(identificador, contrasena));
}

export async function sesionActual(request: Request, response: Response): Promise<void> {
  response.json(await obtenerPerfil(usuarioDe(request)));
}

export async function cambiarContrasena(request: Request, response: Response): Promise<void> {
  const { actual, nueva } = cambioContrasenaSchema.parse(request.body);
  await authService.cambiarContrasena(usuarioDe(request), actual, nueva);
  response.status(204).end();
}
