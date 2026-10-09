import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { formatearDireccion } from '../src/services/geocodificacion.service.js';
import { distanciaMetros } from '../src/utils/geo.js';
import { app, bearer, iniciarSesion, prisma, reiniciarBaseDatos } from './ayudantes.js';

let token: string;

beforeAll(async () => {
  await reiniciarBaseDatos();
  token = await iniciarSesion();
});

describe('Salud y errores', () => {
  it('informa el estado de la API y de la base de datos', async () => {
    const respuesta = await request(app).get('/api/salud');
    expect(respuesta.body).toEqual({ estado: 'ok', baseDatos: 'conectada' });
  });

  it('responde en español para rutas inexistentes', async () => {
    const respuesta = await request(app).get('/api/no-existe');
    expect(respuesta.status).toBe(404);
    expect(respuesta.body.error.codigo).toBe('RUTA_NO_ENCONTRADA');
  });
});

describe('Distancias', () => {
  it('calcula distancias con Haversine', () => {
    const metros = distanciaMetros(4.5339, -75.6811, 4.5339 + 30 / 111_320, -75.6811);
    expect(metros).toBeGreaterThan(29.5);
    expect(metros).toBeLessThan(30.5);
  });
});

describe('Alertas viales (Noticias)', () => {
  it('lista las alertas con su ubicación', async () => {
    const respuesta = await request(app).get('/api/alertas');
    expect(respuesta.body).toHaveLength(2);
    expect(respuesta.body[0]).toMatchObject({ ubicacion: { lat: expect.any(Number), lng: expect.any(Number) } });
  });
});

describe('Geocodificación inversa', () => {
  it('usa la caché de MySQL cuando la coordenada ya fue consultada', async () => {
    await prisma.cacheGeocodificacion.create({ data: { clave: '4.5339,-75.6811', direccion: 'Carrera 14 #20, Armenia', fecha: new Date() } });
    const respuesta = await request(app).get('/api/geocodificacion/inversa').query({ lat: 4.53391, lng: -75.68112 });
    expect(respuesta.body).toEqual({ direccion: 'Carrera 14 #20, Armenia', desdeCache: true });
  });

  it('devuelve las coordenadas si el servicio externo no está disponible', async () => {
    const respuesta = await request(app).get('/api/geocodificacion/inversa').query({ lat: 4.6, lng: -75.7 });
    expect(respuesta.body).toEqual({ direccion: '4.6000, -75.7000', desdeCache: false });
  });

  it('valida las coordenadas', async () => {
    const respuesta = await request(app).get('/api/geocodificacion/inversa').query({ lat: 200, lng: -75.7 });
    expect(respuesta.status).toBe(400);
  });

  it('arma direcciones cortas al estilo colombiano', () => {
    expect(formatearDireccion({ address: { road: 'Carrera 15', house_number: '4N-20', city: 'Armenia' } })).toBe('Carrera 15 #4N-20, Armenia');
    expect(formatearDireccion({ display_name: 'Parque Sucre, Centro, Armenia, Quindío' })).toBe('Parque Sucre, Centro');
  });
});

describe('Eventos de uso (métricas)', () => {
  it('registra eventos anónimos o autenticados y los resume', async () => {
    await request(app).post('/api/eventos').send({ evento: 'mapa_abierto' }).expect(204);
    await request(app).post('/api/eventos').set(...bearer(token)).send({ evento: 'mapa_abierto', datos: { origen: 'qr' } }).expect(204);
    await request(app).post('/api/eventos').set(...bearer(token)).send({ evento: 'reporte_iniciado' }).expect(204);

    const resumen = await request(app).get('/api/eventos/resumen').set(...bearer(token));
    const mapa = resumen.body.find((fila: { evento: string }) => fila.evento === 'mapa_abierto');
    expect(mapa).toEqual({ evento: 'mapa_abierto', total: 2, usuariosDistintos: 1 });
  });

  it('rechaza eventos desconocidos', async () => {
    const respuesta = await request(app).post('/api/eventos').send({ evento: 'inventado' });
    expect(respuesta.status).toBe(400);
  });
});
