import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { grupoDeFecha } from '../src/utils/fechas.js';
import { app, bearer, iniciarSesion, registrarCiudadano, reiniciarBaseDatos } from './ayudantes.js';

let token: string;

beforeAll(async () => {
  await reiniciarBaseDatos();
  token = await iniciarSesion();
});

describe('Agrupación por fecha (hora de Colombia)', () => {
  it('clasifica en hoy, ayer y esta semana', () => {
    const ahora = new Date('2026-10-09T20:00:00Z'); // 3:00 p. m. en Colombia
    expect(grupoDeFecha(new Date('2026-10-09T06:00:00Z'), ahora)).toBe('hoy'); // 1:00 a. m. del mismo día
    expect(grupoDeFecha(new Date('2026-10-09T04:00:00Z'), ahora)).toBe('ayer'); // 11:00 p. m. del día anterior
    expect(grupoDeFecha(new Date('2026-10-05T15:00:00Z'), ahora)).toBe('esta_semana');
  });
});

describe('Notificaciones', () => {
  it('lista las notificaciones del usuario con su grupo', async () => {
    const respuesta = await request(app).get('/api/notificaciones').set(...bearer(token));
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.length).toBeGreaterThanOrEqual(6);
    expect(respuesta.body[0]).toMatchObject({ id: expect.any(String), grupo: expect.stringMatching(/hoy|ayer|esta_semana/) });
  });

  it('marca todas como leídas', async () => {
    await request(app).patch('/api/notificaciones/leidas').set(...bearer(token)).expect(204);
    const respuesta = await request(app).get('/api/notificaciones').set(...bearer(token));
    expect(respuesta.body.every((n: { leida: boolean }) => n.leida)).toBe(true);
  });

  it('cada usuario solo ve y modifica sus notificaciones', async () => {
    const otro = await registrarCiudadano();
    const ajenas = await request(app).get('/api/notificaciones').set(...bearer(otro.token));
    expect(ajenas.body).toHaveLength(0);
    const respuesta = await request(app).patch('/api/notificaciones/notif_1/leida').set(...bearer(otro.token));
    expect(respuesta.status).toBe(404);
  });

  it('guarda las preferencias de notificación', async () => {
    const { token: tokenNuevo } = await registrarCiudadano();
    const inicial = await request(app).get('/api/notificaciones/preferencias').set(...bearer(tokenNuevo));
    expect(inicial.body).toEqual({ nuevoComentario: true, actualizacionEstado: true, reporteSolucionado: true, reportesCerca: true, respuestasComentarios: true });

    const nuevas = { nuevoComentario: false, actualizacionEstado: true, reporteSolucionado: false, reportesCerca: true, respuestasComentarios: false };
    const guardadas = await request(app).put('/api/notificaciones/preferencias').set(...bearer(tokenNuevo)).send(nuevas);
    expect(guardadas.body).toEqual(nuevas);
  });
});
