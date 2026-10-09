import { Router } from 'express';
import * as auth from '../controllers/auth.controller.js';
import * as general from '../controllers/general.controller.js';
import { healthController } from '../controllers/health.controller.js';
import * as notificaciones from '../controllers/notificaciones.controller.js';
import * as reportes from '../controllers/reportes.controller.js';
import * as usuarios from '../controllers/usuarios.controller.js';
import { authOpcional, requiereAuth } from '../middlewares/auth.js';
import { crearLimiteLogin, crearLimiteReportes } from '../middlewares/limites.js';
import { subirFoto } from '../middlewares/subida.js';

export interface OpcionesRutas {
  limiteLogin: number;
  limiteReportes: number;
}

export function crearRutas(opciones: OpcionesRutas): Router {
  const rutas = Router();
  const limiteLogin = crearLimiteLogin(opciones.limiteLogin);
  const limiteReportes = crearLimiteReportes(opciones.limiteReportes);

  rutas.get('/salud', healthController);

  // Autenticación
  rutas.post('/auth/registro', limiteLogin, auth.registro);
  rutas.post('/auth/login', limiteLogin, auth.login);
  rutas.get('/auth/yo', requiereAuth, auth.sesionActual);
  rutas.put('/auth/contrasena', requiereAuth, auth.cambiarContrasena);

  // Reportes
  rutas.get('/reportes', authOpcional, reportes.listar);
  rutas.get('/reportes/duplicados', authOpcional, reportes.buscarDuplicado);
  rutas.get('/reportes/mios', requiereAuth, reportes.misReportes);
  rutas.get('/reportes/:id', authOpcional, reportes.obtener);
  rutas.post('/reportes', requiereAuth, limiteReportes, subirFoto, reportes.crear);
  rutas.post('/reportes/:id/confirmaciones', requiereAuth, reportes.confirmar);
  rutas.post('/reportes/:id/seguimiento', requiereAuth, reportes.seguir);
  rutas.delete('/reportes/:id/seguimiento', requiereAuth, reportes.dejarDeSeguir);
  rutas.post('/reportes/:id/aportes', requiereAuth, subirFoto, reportes.aportar);
  rutas.post('/reportes/:id/avanzar-estado', requiereAuth, reportes.avanzarEstado);

  // Usuarios, perfil y comunidad
  rutas.get('/usuarios/yo', requiereAuth, auth.sesionActual);
  rutas.patch('/usuarios/yo', requiereAuth, subirFoto, usuarios.actualizarPerfil);
  rutas.get('/usuarios/comunidad', requiereAuth, usuarios.comunidad);
  rutas.get('/usuarios/seguidos', requiereAuth, usuarios.seguidos);
  rutas.post('/usuarios/:id/seguimiento', requiereAuth, usuarios.seguir);
  rutas.delete('/usuarios/:id/seguimiento', requiereAuth, usuarios.dejarDeSeguir);

  // Notificaciones y preferencias
  rutas.get('/notificaciones', requiereAuth, notificaciones.listar);
  rutas.patch('/notificaciones/leidas', requiereAuth, notificaciones.marcarTodas);
  rutas.patch('/notificaciones/:id/leida', requiereAuth, notificaciones.marcarUna);
  rutas.get('/notificaciones/preferencias', requiereAuth, notificaciones.obtenerPreferencias);
  rutas.put('/notificaciones/preferencias', requiereAuth, notificaciones.guardarPreferencias);

  // Noticias, geocodificación, métricas y modo demostración
  rutas.get('/alertas', general.alertas);
  rutas.get('/geocodificacion/inversa', authOpcional, general.geocodificacion);
  rutas.post('/eventos', authOpcional, general.evento);
  rutas.get('/eventos/resumen', requiereAuth, general.metricas);
  rutas.get('/demo', general.estadoDemo);
  rutas.post('/demo/restablecer', requiereAuth, general.restablecerDemo);

  return rutas;
}
