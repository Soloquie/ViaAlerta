import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { crearApp } from '../src/app.js';
import { alNorte, app, bearer, iniciarSesion, prisma, publicarReporte, registrarCiudadano, reiniciarBaseDatos } from './ayudantes.js';

// Punto libre de reportes semilla, al sur de Armenia.
const LAT = 4.5100;
const LNG = -75.7000;

let token: string;

beforeAll(async () => {
  await reiniciarBaseDatos();
  token = await iniciarSesion();
});

describe('Consulta de reportes', () => {
  it('lista los reportes con la forma que usa el frontend', async () => {
    const respuesta = await request(app).get('/api/reportes').set(...bearer(token));
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.length).toBeGreaterThanOrEqual(11);
    const rep1 = respuesta.body.find((r: { id: string }) => r.id === 'rep_1');
    expect(rep1).toMatchObject({
      categoria: 'hueco',
      autorUsuario: '@martin.m',
      ubicacion: { lat: 4.5362, lng: -75.6795 },
      confirmacionesSigue: 12,
      usuarioConfirmo: 'sigue',
    });
    expect(rep1.foto).toMatch(/^http:\/\/.+\/uploads\/seed\/bache\.svg$/);
  });

  it('responde 404 en español si el reporte no existe', async () => {
    const respuesta = await request(app).get('/api/reportes/no-existe');
    expect(respuesta.status).toBe(404);
    expect(respuesta.body.error).toEqual({ codigo: 'NO_ENCONTRADO', mensaje: 'El reporte no existe.' });
  });
});

describe('Creación de reportes', () => {
  it('exige la foto del daño', async () => {
    const respuesta = await publicarReporte(token, { categoria: 'hueco', lat: LAT, lng: LNG }, null);
    expect(respuesta.status).toBe(400);
    expect(respuesta.body.error.codigo).toBe('FOTO_REQUERIDA');
  });

  it('valida que el archivo sea realmente una imagen', async () => {
    const respuesta = await request(app)
      .post('/api/reportes')
      .set(...bearer(token))
      .field('categoria', 'hueco')
      .field('severidad', 'leve')
      .field('lat', String(LAT))
      .field('lng', String(LNG))
      .attach('foto', Buffer.from('esto no es una imagen'), { filename: 'falsa.png', contentType: 'image/png' });
    expect(respuesta.status).toBe(400);
    expect(respuesta.body.error.codigo).toBe('FORMATO_IMAGEN_INVALIDO');
  });

  it('rechaza subtipos que no pertenecen a la categoría', async () => {
    const respuesta = await publicarReporte(token, { categoria: 'hueco', subtipo: 'Árbol caído', lat: LAT, lng: LNG });
    expect(respuesta.status).toBe(400);
    expect(respuesta.body.error.codigo).toBe('SUBTIPO_INVALIDO');
  });

  it('publica el reporte: el autor lo sigue, confirma "sigue ahí" y queda en estado reportado', async () => {
    const respuesta = await publicarReporte(token, { categoria: 'hueco', severidad: 'critico', lat: LAT, lng: LNG, descripcion: 'Hueco profundo' });
    expect(respuesta.status).toBe(201);
    expect(respuesta.body).toMatchObject({
      categoria: 'hueco',
      severidad: 'critico',
      descripcion: 'Hueco profundo',
      estado: 'reportado',
      autorId: 'usr_martin',
      confirmacionesSigue: 1,
      confirmacionesReparado: 0,
      seguidores: ['usr_martin'],
      usuarioConfirmo: 'sigue',
    });
    expect(respuesta.body.historial).toHaveLength(1);
    expect(respuesta.body.foto).toMatch(/\/uploads\/reportes\/.+\.png$/);
    const guardado = await prisma.reporte.findUniqueOrThrow({ where: { id: respuesta.body.id } });
    expect(guardado.fotoUrl).toMatch(/^\/uploads\/reportes\//);
  });

  it('usa una descripción por defecto cuando no se escribe ninguna', async () => {
    const respuesta = await publicarReporte(token, { categoria: 'cierre_via', lat: LAT + 0.01, lng: LNG });
    expect(respuesta.status).toBe(201);
    expect(respuesta.body.descripcion).toBe('Reporte de daño vial registrado por la comunidad.');
  });
});

describe('Regla de duplicados (misma categoría, activo y a 30 m o menos)', () => {
  const lat = 4.5050;
  const lng = -75.7100;

  beforeAll(async () => {
    const base = await publicarReporte(token, { categoria: 'inundacion', subtipo: 'Calle inundada', lat, lng });
    expect(base.status).toBe(201);
  });

  it('detecta un duplicado a 20 metros y devuelve el reporte existente', async () => {
    const respuesta = await publicarReporte(token, { categoria: 'inundacion', lat: alNorte(lat, 20), lng });
    expect(respuesta.status).toBe(409);
    expect(respuesta.body.error.codigo).toBe('REPORTE_DUPLICADO');
    expect(respuesta.body.error.duplicado.categoria).toBe('inundacion');
  });

  it('expone la verificación previa en GET /reportes/duplicados', async () => {
    const cerca = await request(app).get('/api/reportes/duplicados').query({ categoria: 'inundacion', lat: alNorte(lat, 25), lng });
    expect(cerca.body.duplicado).not.toBeNull();
    const lejos = await request(app).get('/api/reportes/duplicados').query({ categoria: 'inundacion', lat: alNorte(lat, 45), lng });
    expect(lejos.body.duplicado).toBeNull();
  });

  it('no considera duplicado otra categoría ni un punto a más de 30 metros', async () => {
    expect((await publicarReporte(token, { categoria: 'via_deteriorada', lat: alNorte(lat, 10), lng })).status).toBe(201);
    expect((await publicarReporte(token, { categoria: 'inundacion', lat: alNorte(lat, 40), lng })).status).toBe(201);
  });

  it('ignora los reportes solucionados', async () => {
    const cercaDeSolucionado = await prisma.reporte.findUniqueOrThrow({ where: { id: 'rep_4' } });
    expect(cercaDeSolucionado.estado).toBe('solucionado');
    const respuesta = await publicarReporte(token, {
      categoria: cercaDeSolucionado.categoriaId,
      lat: Number(cercaDeSolucionado.latitud),
      lng: Number(cercaDeSolucionado.longitud),
    });
    expect(respuesta.status).toBe(201);
  });

  it('permite publicar de todos modos cuando el usuario lo decide (forzar)', async () => {
    const respuesta = await publicarReporte(token, { categoria: 'inundacion', lat: alNorte(lat, 5), lng, forzar: true });
    expect(respuesta.status).toBe(201);
  });
});

describe('Seguridad en la creación', () => {
  it('requiere sesión para publicar', async () => {
    const respuesta = await request(app).post('/api/reportes').field('categoria', 'hueco');
    expect(respuesta.status).toBe(401);
  });

  it('limita la cantidad de reportes por usuario', async () => {
    const appLimitada = crearApp({ limiteReportes: 1 });
    const { token: tokenNuevo } = await registrarCiudadano();
    const primero = await request(appLimitada).post('/api/reportes').set(...bearer(tokenNuevo)).field('categoria', 'hueco');
    expect(primero.status).toBe(400);
    const segundo = await request(appLimitada).post('/api/reportes').set(...bearer(tokenNuevo)).field('categoria', 'hueco');
    expect(segundo.status).toBe(429);
    expect(segundo.body.error.codigo).toBe('DEMASIADOS_REPORTES');
  });
});

describe('Aviso de reportes cercanos', () => {
  it('notifica a quienes han reportado a menos de 1 km, según su preferencia', async () => {
    const vecino = await registrarCiudadano('Vecina Cercana');
    const lejano = await registrarCiudadano('Vecino Lejano');
    expect((await publicarReporte(vecino.token, { categoria: 'hueco', lat: 4.4900, lng: -75.7300 })).status).toBe(201);
    expect((await publicarReporte(lejano.token, { categoria: 'hueco', lat: 4.4600, lng: -75.7300 })).status).toBe(201);

    const nuevo = await publicarReporte(token, { categoria: 'senalizacion', subtipo: 'Semáforo dañado', lat: alNorte(4.4900, 300), lng: -75.7300 });
    expect(nuevo.status).toBe(201);

    const avisosVecino = await prisma.notificacion.findMany({ where: { usuarioId: vecino.id, reporteId: nuevo.body.id } });
    expect(avisosVecino).toHaveLength(1);
    expect(avisosVecino[0].tipo).toBe('alerta');
    expect(await prisma.notificacion.count({ where: { usuarioId: lejano.id, reporteId: nuevo.body.id } })).toBe(0);
  });
});
