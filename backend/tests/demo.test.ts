import request from 'supertest';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { env } from '../src/config/env.js';
import { app, bearer, iniciarSesion, prisma, publicarReporte, registrarCiudadano, reiniciarBaseDatos } from './ayudantes.js';

let token: string;

beforeAll(async () => {
  await reiniciarBaseDatos();
  token = await iniciarSesion();
});

afterEach(() => {
  env.MODO_DEMO = true;
});

const avanzar = (reporteId: string) => request(app).post(`/api/reportes/${reporteId}/avanzar-estado`).set(...bearer(token));

describe('Modo demostración: avance de estados simulados', () => {
  it('avanza en orden lineal, registra mensajes simulados y se detiene en "solucionado"', async () => {
    const creado = await publicarReporte(token, { categoria: 'hueco', lat: 4.4400, lng: -75.6400 });
    const id = creado.body.id;

    expect((await avanzar(id)).body.estado).toBe('en_revision');
    expect((await avanzar(id)).body.estado).toBe('en_proceso');
    const final = await avanzar(id);
    expect(final.body.estado).toBe('solucionado');
    expect(final.body.historial.map((h: { estado: string }) => h.estado)).toEqual(['reportado', 'en_revision', 'en_proceso', 'solucionado']);
    for (const entrada of final.body.historial.slice(1)) {
      expect(entrada.mensaje).toMatch(/simulad/i);
      expect(entrada.mensaje).not.toMatch(/Secretar[ií]a/);
    }

    const otraVez = await avanzar(id);
    expect(otraVez.status).toBe(409);
    expect(otraVez.body.error.codigo).toBe('ESTADO_FINAL');
  });

  it('notifica a los seguidores el cambio de estado', async () => {
    const antes = await prisma.notificacion.count({ where: { usuarioId: 'usr_curtis', reporteId: 'rep_1', tipo: 'estado' } });
    await avanzar('rep_1');
    const despues = await prisma.notificacion.count({ where: { usuarioId: 'usr_curtis', reporteId: 'rep_1', tipo: 'estado' } });
    expect(despues).toBe(antes + 1);
  });

  it('solo un administrador puede avanzar estados o restablecer datos', async () => {
    const ciudadano = await registrarCiudadano();
    const avance = await request(app).post('/api/reportes/rep_2/avanzar-estado').set(...bearer(ciudadano.token));
    expect(avance.status).toBe(403);
    expect(avance.body.error.codigo).toBe('SOLO_ADMIN');
    const restablecer = await request(app).post('/api/demo/restablecer').set(...bearer(ciudadano.token));
    expect(restablecer.status).toBe(403);

    const perfil = await request(app).get('/api/auth/yo').set(...bearer(token));
    expect(perfil.body.rol).toBe('admin');
  });

  it('no está disponible si MODO_DEMO=false', async () => {
    env.MODO_DEMO = false;
    const respuesta = await avanzar('rep_2');
    expect(respuesta.status).toBe(403);
    expect(respuesta.body.error.codigo).toBe('MODO_DEMO_INACTIVO');
  });

  it('restablece los datos de prueba', async () => {
    await avanzar('rep_3');
    expect((await prisma.reporte.findUniqueOrThrow({ where: { id: 'rep_3' } })).estado).not.toBe('reportado');
    const respuesta = await request(app).post('/api/demo/restablecer').set(...bearer(token));
    expect(respuesta.status).toBe(204);
    expect((await prisma.reporte.findUniqueOrThrow({ where: { id: 'rep_3' } })).estado).toBe('reportado');
    expect(await prisma.reporte.count()).toBe(11);
  });
});
