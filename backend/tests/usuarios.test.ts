import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { PNG_MINIMO, app, bearer, iniciarSesion, prisma, registrarCiudadano, reiniciarBaseDatos } from './ayudantes.js';

let token: string;

beforeAll(async () => {
  await reiniciarBaseDatos();
  token = await iniciarSesion();
});

describe('Perfil', () => {
  it('calcula las estadísticas del perfil a partir de la actividad real', async () => {
    const respuesta = await request(app).get('/api/usuarios/yo').set(...bearer(token));
    expect(respuesta.status).toBe(200);
    const reportes = await prisma.reporte.count({ where: { autorId: 'usr_martin' } });
    const confirmaciones = await prisma.confirmacion.count({ where: { usuarioId: 'usr_martin' } });
    expect(respuesta.body).toMatchObject({ incidentesCount: reportes, alertasCount: confirmaciones, usuario: '@martin.m' });
    expect(respuesta.body.reportesSeguidos).toContain('rep_1');
  });

  it('actualiza los datos y la foto del perfil', async () => {
    const { token: tokenNuevo } = await registrarCiudadano();
    const respuesta = await request(app)
      .patch('/api/usuarios/yo')
      .set(...bearer(tokenNuevo))
      .field('nombre', 'Nombre Editado')
      .field('ciudad', 'Calarcá, Quindío')
      .field('biografia', 'Reporto huecos en mi barrio.')
      .attach('foto', PNG_MINIMO, { filename: 'perfil.png', contentType: 'image/png' });
    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({ nombre: 'Nombre Editado', ciudad: 'Calarcá, Quindío', biografia: 'Reporto huecos en mi barrio.' });
    expect(respuesta.body.foto).toMatch(/\/uploads\/perfiles\/.+\.png$/);
  });

  it('impide usar un nombre de usuario que ya existe', async () => {
    const { token: tokenNuevo } = await registrarCiudadano();
    const respuesta = await request(app).patch('/api/usuarios/yo').set(...bearer(tokenNuevo)).field('usuario', '@martin.m');
    expect(respuesta.status).toBe(409);
    expect(respuesta.body.error.codigo).toBe('USUARIO_EN_USO');
  });
});

describe('Comunidad (Social)', () => {
  it('lista ciudadanos con reportes, sin incluir al usuario actual ni exponer correos', async () => {
    const respuesta = await request(app).get('/api/usuarios/comunidad').set(...bearer(token));
    const ids = respuesta.body.map((u: { id: string }) => u.id);
    expect(ids).toEqual(expect.arrayContaining(['usr_curtis', 'usr_michelle', 'usr_valentina']));
    expect(ids).not.toContain('usr_martin');
    expect(respuesta.body.every((u: { correo: string }) => u.correo === '')).toBe(true);
  });

  it('seguir a un ciudadano lo notifica una sola vez y no permite seguirse a sí mismo', async () => {
    const nuevo = await registrarCiudadano('Andrés Toro');
    const seguir = () => request(app).post('/api/usuarios/usr_valentina/seguimiento').set(...bearer(nuevo.token));
    expect((await seguir()).body).toContain('usr_valentina');
    await seguir();
    expect(await prisma.notificacion.count({ where: { usuarioId: 'usr_valentina', tipo: 'seguidor', titulo: 'Andrés empezó a seguirte' } })).toBe(1);

    const dejar = await request(app).delete('/api/usuarios/usr_valentina/seguimiento').set(...bearer(nuevo.token));
    expect(dejar.body).not.toContain('usr_valentina');

    const propio = await request(app).post(`/api/usuarios/${nuevo.id}/seguimiento`).set(...bearer(nuevo.token));
    expect(propio.status).toBe(400);
  });
});
