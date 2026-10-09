import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { PNG_MINIMO, app, bearer, iniciarSesion, prisma, publicarReporte, registrarCiudadano, reiniciarBaseDatos } from './ayudantes.js';

let tokenMartin: string;

beforeAll(async () => {
  await reiniciarBaseDatos();
  tokenMartin = await iniciarSesion();
});

const confirmar = (token: string, reporteId: string, tipo: 'sigue' | 'reparado') =>
  request(app).post(`/api/reportes/${reporteId}/confirmaciones`).set(...bearer(token)).send({ tipo });

describe('Confirmaciones ciudadanas', () => {
  it('permite una sola confirmación por usuario: repetir la misma opción la retira y elegir la otra la cambia', async () => {
    const { token } = await registrarCiudadano();
    const inicial = await request(app).get('/api/reportes/rep_2').set(...bearer(token));
    const sigueInicial = inicial.body.confirmacionesSigue;

    const primera = await confirmar(token, 'rep_2', 'sigue');
    expect(primera.body).toMatchObject({ confirmacionesSigue: sigueInicial + 1, usuarioConfirmo: 'sigue' });

    const cambio = await confirmar(token, 'rep_2', 'reparado');
    expect(cambio.body).toMatchObject({ confirmacionesSigue: sigueInicial, confirmacionesReparado: 1, usuarioConfirmo: 'reparado' });

    const retiro = await confirmar(token, 'rep_2', 'reparado');
    expect(retiro.body).toMatchObject({ confirmacionesSigue: sigueInicial, confirmacionesReparado: 0, usuarioConfirmo: null });
  });

  it('valida el tipo de confirmación', async () => {
    const respuesta = await confirmar(tokenMartin, 'rep_2', 'otro' as 'sigue');
    expect(respuesta.status).toBe(400);
  });

  it('con 3 indicaciones de "ya fue reparado" muestra el aviso comunitario y notifica, sin cambiar el estado', async () => {
    const creado = await publicarReporte(tokenMartin, { categoria: 'via_deteriorada', lat: 4.4700, lng: -75.6500 });
    const reporteId = creado.body.id;
    const vecinos = await Promise.all([registrarCiudadano(), registrarCiudadano(), registrarCiudadano()]);

    await confirmar(vecinos[0].token, reporteId, 'reparado');
    const dos = await confirmar(vecinos[1].token, reporteId, 'reparado');
    expect(dos.body.comunidadIndicaReparado).toBe(false);

    const tres = await confirmar(vecinos[2].token, reporteId, 'reparado');
    expect(tres.body).toMatchObject({ confirmacionesReparado: 3, comunidadIndicaReparado: true, estado: 'reportado' });

    const avisos = await prisma.notificacion.findMany({ where: { usuarioId: 'usr_martin', reporteId, tipo: 'verificacion' } });
    expect(avisos).toHaveLength(1);
  });
});

describe('Seguimiento de reportes', () => {
  it('seguir y dejar de seguir es idempotente', async () => {
    const { token, id } = await registrarCiudadano();
    const seguir = () => request(app).post('/api/reportes/rep_6/seguimiento').set(...bearer(token));
    expect((await seguir()).body.seguidores).toContain(id);
    const otraVez = await seguir();
    expect(otraVez.body.seguidores.filter((s: string) => s === id)).toHaveLength(1);

    const dejar = await request(app).delete('/api/reportes/rep_6/seguimiento').set(...bearer(token));
    expect(dejar.body.seguidores).not.toContain(id);

    const perfil = await request(app).get('/api/usuarios/yo').set(...bearer(token));
    expect(perfil.body.reportesSeguidos).not.toContain('rep_6');
  });
});

describe('Aportes ciudadanos', () => {
  it('agrega el aporte con foto opcional y notifica al autor y a los seguidores', async () => {
    const vecina = await registrarCiudadano('Paula Ríos');
    const seguidora = await registrarCiudadano('Seguidora');
    await request(app).post('/api/reportes/rep_1/seguimiento').set(...bearer(seguidora.token));

    const respuesta = await request(app)
      .post('/api/reportes/rep_1/aportes')
      .set(...bearer(vecina.token))
      .field('texto', 'Hoy pusieron conos alrededor del hueco.')
      .attach('foto', PNG_MINIMO, { filename: 'aporte.png', contentType: 'image/png' });
    expect(respuesta.status).toBe(201);
    expect(respuesta.body.aportes[0]).toMatchObject({ autor: 'Paula Ríos', texto: 'Hoy pusieron conos alrededor del hueco.' });
    expect(respuesta.body.aportes[0].foto).toMatch(/\/uploads\/aportes\//);

    const alAutor = await prisma.notificacion.findMany({ where: { usuarioId: 'usr_martin', reporteId: 'rep_1', tipo: 'comentario' } });
    expect(alAutor.some((n) => n.titulo === 'Paula comentó tu reporte')).toBe(true);
    expect(await prisma.notificacion.count({ where: { usuarioId: seguidora.id, reporteId: 'rep_1', tipo: 'comentario' } })).toBe(1);
    expect(await prisma.notificacion.count({ where: { usuarioId: vecina.id, tipo: 'comentario' } })).toBe(0);
  });

  it('respeta la preferencia "nuevo comentario" del autor', async () => {
    const autora = await registrarCiudadano('Autora');
    const creado = await publicarReporte(autora.token, { categoria: 'hueco', lat: 4.4500, lng: -75.6500 });
    await request(app)
      .put('/api/notificaciones/preferencias')
      .set(...bearer(autora.token))
      .send({ nuevoComentario: false, actualizacionEstado: true, reporteSolucionado: true, reportesCerca: true, respuestasComentarios: true });

    await request(app).post(`/api/reportes/${creado.body.id}/aportes`).set(...bearer(tokenMartin)).field('texto', 'Confirmo el daño.');
    expect(await prisma.notificacion.count({ where: { usuarioId: autora.id, tipo: 'comentario' } })).toBe(0);
  });

  it('rechaza aportes vacíos', async () => {
    const respuesta = await request(app).post('/api/reportes/rep_1/aportes').set(...bearer(tokenMartin)).field('texto', '   ');
    expect(respuesta.status).toBe(400);
  });
});
