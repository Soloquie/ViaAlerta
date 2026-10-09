import type { Request, Response } from 'express';
import { usuarioDe } from '../middlewares/auth.js';
import * as demoService from '../services/demo.service.js';
import * as participacion from '../services/participacion.service.js';
import * as reportesService from '../services/reportes.service.js';
import { aporteSchema, confirmacionSchema, crearReporteSchema, duplicadoQuerySchema, idParamSchema } from '../validators/reportes.validators.js';

export async function listar(request: Request, response: Response): Promise<void> {
  response.json(await reportesService.listarReportes(request.usuarioId));
}

export async function obtener(request: Request, response: Response): Promise<void> {
  const { id } = idParamSchema.parse(request.params);
  response.json(await reportesService.obtenerReporte(id, request.usuarioId));
}

export async function buscarDuplicado(request: Request, response: Response): Promise<void> {
  const { categoria, lat, lng } = duplicadoQuerySchema.parse(request.query);
  response.json({ duplicado: await reportesService.buscarDuplicado(categoria, lat, lng, request.usuarioId) });
}

export async function crear(request: Request, response: Response): Promise<void> {
  const datos = crearReporteSchema.parse(request.body);
  const reporte = await reportesService.crearReporte(usuarioDe(request), datos, request.file?.buffer);
  response.status(201).json(reporte);
}

export async function confirmar(request: Request, response: Response): Promise<void> {
  const { id } = idParamSchema.parse(request.params);
  const { tipo } = confirmacionSchema.parse(request.body);
  response.json(await participacion.confirmarDanio(id, usuarioDe(request), tipo));
}

export async function seguir(request: Request, response: Response): Promise<void> {
  const { id } = idParamSchema.parse(request.params);
  response.json(await participacion.seguirReporte(id, usuarioDe(request)));
}

export async function dejarDeSeguir(request: Request, response: Response): Promise<void> {
  const { id } = idParamSchema.parse(request.params);
  response.json(await participacion.dejarDeSeguirReporte(id, usuarioDe(request)));
}

export async function aportar(request: Request, response: Response): Promise<void> {
  const { id } = idParamSchema.parse(request.params);
  const { texto } = aporteSchema.parse(request.body);
  response.status(201).json(await participacion.crearAporte(id, usuarioDe(request), texto, request.file?.buffer));
}

export async function avanzarEstado(request: Request, response: Response): Promise<void> {
  const { id } = idParamSchema.parse(request.params);
  response.json(await demoService.avanzarEstado(id, usuarioDe(request)));
}

export async function misReportes(request: Request, response: Response): Promise<void> {
  const usuarioId = usuarioDe(request);
  response.json(await reportesService.listarReportesDeUsuario(usuarioId, usuarioId));
}
