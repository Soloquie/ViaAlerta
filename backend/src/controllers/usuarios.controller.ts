import type { Request, Response } from 'express';
import { usuarioDe } from '../middlewares/auth.js';
import { eliminarImagen, guardarImagen } from '../services/archivos.service.js';
import * as usuariosService from '../services/usuarios.service.js';
import { idParamSchema } from '../validators/reportes.validators.js';
import { perfilSchema } from '../validators/usuarios.validators.js';

export async function actualizarPerfil(request: Request, response: Response): Promise<void> {
  const cambios = perfilSchema.parse(request.body);
  const fotoUrl = request.file ? await guardarImagen(request.file.buffer, 'perfiles') : undefined;
  try {
    response.json(await usuariosService.actualizarPerfil(usuarioDe(request), { ...cambios, fotoUrl }));
  } catch (error) {
    await eliminarImagen(fotoUrl);
    throw error;
  }
}

export async function comunidad(request: Request, response: Response): Promise<void> {
  response.json(await usuariosService.listarComunidad(usuarioDe(request)));
}

export async function seguidos(request: Request, response: Response): Promise<void> {
  response.json(await usuariosService.listarSeguidos(usuarioDe(request)));
}

export async function seguir(request: Request, response: Response): Promise<void> {
  const { id } = idParamSchema.parse(request.params);
  response.json(await usuariosService.seguirUsuario(usuarioDe(request), id));
}

export async function dejarDeSeguir(request: Request, response: Response): Promise<void> {
  const { id } = idParamSchema.parse(request.params);
  response.json(await usuariosService.dejarDeSeguirUsuario(usuarioDe(request), id));
}
