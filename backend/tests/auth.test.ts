import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { crearApp } from '../src/app.js';
import { CONTRASENA_DEMO, CORREO_MARTIN, app, bearer, iniciarSesion, registrarCiudadano, reiniciarBaseDatos } from './ayudantes.js';

beforeAll(reiniciarBaseDatos);

describe('Autenticación', () => {
  it('registra un ciudadano y devuelve un token con su perfil', async () => {
    const respuesta = await request(app)
      .post('/api/auth/registro')
      .send({ nombre: 'Laura Gómez', usuario: '@Laura.G', correo: 'laura@prueba.co', contrasena: 'Segura2026', aceptoTratamientoDatos: true });
    expect(respuesta.status).toBe(201);
    expect(respuesta.body.token).toEqual(expect.any(String));
    expect(respuesta.body.usuario).toMatchObject({ nombre: 'Laura Gómez', usuario: '@laura.g', correo: 'laura@prueba.co', incidentesCount: 0 });
  });

  it('exige la autorización de tratamiento de datos (Ley 1581 de 2012)', async () => {
    const respuesta = await request(app)
      .post('/api/auth/registro')
      .send({ nombre: 'Sin Autorización', usuario: 'sin.autorizacion', correo: 'sin@prueba.co', contrasena: 'Segura2026', aceptoTratamientoDatos: false });
    expect(respuesta.status).toBe(400);
    expect(respuesta.body.error.codigo).toBe('DATOS_INVALIDOS');
    expect(respuesta.body.error.mensaje).toMatch(/tratamiento de tus datos/);
  });

  it('rechaza correos o usuarios repetidos', async () => {
    const correo = await request(app)
      .post('/api/auth/registro')
      .send({ nombre: 'Copia', usuario: 'otro.usuario', correo: CORREO_MARTIN, contrasena: 'Segura2026', aceptoTratamientoDatos: true });
    expect(correo.status).toBe(409);
    expect(correo.body.error.codigo).toBe('CORREO_EN_USO');

    const usuario = await request(app)
      .post('/api/auth/registro')
      .send({ nombre: 'Copia', usuario: 'martin.m', correo: 'copia@prueba.co', contrasena: 'Segura2026', aceptoTratamientoDatos: true });
    expect(usuario.status).toBe(409);
    expect(usuario.body.error.codigo).toBe('USUARIO_EN_USO');
  });

  it('exige una contraseña de al menos 8 caracteres con letras y números', async () => {
    const respuesta = await request(app)
      .post('/api/auth/registro')
      .send({ nombre: 'Débil', usuario: 'clave.debil', correo: 'debil@prueba.co', contrasena: 'corta', aceptoTratamientoDatos: true });
    expect(respuesta.status).toBe(400);
  });

  it('inicia sesión con correo o con nombre de usuario', async () => {
    const porCorreo = await request(app).post('/api/auth/login').send({ identificador: CORREO_MARTIN, contrasena: CONTRASENA_DEMO });
    expect(porCorreo.status).toBe(200);
    expect(porCorreo.body.usuario.id).toBe('usr_martin');

    const porUsuario = await request(app).post('/api/auth/login').send({ identificador: '@martin.m', contrasena: CONTRASENA_DEMO });
    expect(porUsuario.status).toBe(200);
  });

  it('rechaza credenciales incorrectas sin revelar cuál dato falló', async () => {
    const respuesta = await request(app).post('/api/auth/login').send({ identificador: CORREO_MARTIN, contrasena: 'incorrecta1' });
    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error.codigo).toBe('CREDENCIALES_INVALIDAS');
  });

  it('protege las rutas privadas con JWT', async () => {
    expect((await request(app).get('/api/auth/yo')).status).toBe(401);
    expect((await request(app).get('/api/auth/yo').set('Authorization', 'Bearer token-falso')).status).toBe(401);

    const token = await iniciarSesion();
    const yo = await request(app).get('/api/auth/yo').set(...bearer(token));
    expect(yo.status).toBe(200);
    expect(yo.body.correo).toBe(CORREO_MARTIN);
  });

  it('limita los intentos de inicio de sesión por IP', async () => {
    const appLimitada = crearApp({ limiteLogin: 2 });
    const intento = () => request(appLimitada).post('/api/auth/login').send({ identificador: CORREO_MARTIN, contrasena: 'mala12345' });
    expect((await intento()).status).toBe(401);
    expect((await intento()).status).toBe(401);
    const bloqueado = await intento();
    expect(bloqueado.status).toBe(429);
    expect(bloqueado.body.error.codigo).toBe('DEMASIADOS_INTENTOS');
  });

  it('permite cambiar la contraseña verificando la actual', async () => {
    const { token, usuario } = await registrarCiudadano();
    const incorrecta = await request(app).put('/api/auth/contrasena').set(...bearer(token)).send({ actual: 'NoEsLaClave1', nueva: 'NuevaClave99' });
    expect(incorrecta.status).toBe(400);
    expect(incorrecta.body.error.codigo).toBe('CONTRASENA_ACTUAL_INCORRECTA');

    const correcta = await request(app).put('/api/auth/contrasena').set(...bearer(token)).send({ actual: 'Clave12345', nueva: 'NuevaClave99' });
    expect(correcta.status).toBe(204);
    expect(await iniciarSesion(usuario, 'NuevaClave99')).toEqual(expect.any(String));
  });
});
