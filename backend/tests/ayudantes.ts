import request from 'supertest';
import { crearApp } from '../src/app.js';
import { env } from '../src/config/env.js';
import { prisma } from '../src/config/prisma.js';
import { ejecutarSemilla } from '../prisma/semilla/ejecutar.js';

export { prisma };

export const app = crearApp({ limiteLogin: 1000, limiteReportes: 1000 });

export const CONTRASENA_DEMO = 'ReporteVias2026!';
export const CORREO_MARTIN = 'martin.martinez@email.com';

/** PNG válido de 1×1 píxel. */
export const PNG_MINIMO = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

/** Restaura la base de pruebas al estado de la semilla. */
export async function reiniciarBaseDatos(): Promise<void> {
  await prisma.eventoUsoRegistro.deleteMany();
  await prisma.cacheGeocodificacion.deleteMany();
  // La semilla en modo "restablecer" elimina los reportes que no son de la semilla.
  await ejecutarSemilla(prisma, { directorioUploads: env.DIRECTORIO_UPLOADS, restablecerTodo: true });
  await prisma.usuario.deleteMany({ where: { correo: { endsWith: '@prueba.co' } } });
}

export async function iniciarSesion(identificador = CORREO_MARTIN, contrasena = CONTRASENA_DEMO): Promise<string> {
  const respuesta = await request(app).post('/api/auth/login').send({ identificador, contrasena });
  if (respuesta.status !== 200) throw new Error(`No se pudo iniciar sesión: ${respuesta.text}`);
  return respuesta.body.token as string;
}

let contador = 0;
/** Registra un ciudadano nuevo de prueba y devuelve su token e id. */
export async function registrarCiudadano(nombre = 'Ciudadano Prueba'): Promise<{ token: string; id: string; usuario: string }> {
  contador += 1;
  const sufijo = `${Date.now().toString(36)}${contador}`;
  const respuesta = await request(app)
    .post('/api/auth/registro')
    .send({ nombre, usuario: `prueba.${sufijo}`, correo: `prueba.${sufijo}@prueba.co`, contrasena: 'Clave12345', aceptoTratamientoDatos: true });
  if (respuesta.status !== 201) throw new Error(`No se pudo registrar: ${respuesta.text}`);
  return { token: respuesta.body.token, id: respuesta.body.usuario.id, usuario: respuesta.body.usuario.usuario };
}

export function bearer(token: string): [string, string] {
  return ['Authorization', `Bearer ${token}`];
}

/** Publica un reporte con foto mediante la API. */
export function publicarReporte(
  token: string,
  campos: { categoria: string; severidad?: string; lat: number; lng: number; subtipo?: string; descripcion?: string; forzar?: boolean; direccion?: string },
  foto: Buffer | null = PNG_MINIMO,
) {
  let prueba = request(app)
    .post('/api/reportes')
    .set(...bearer(token))
    .field('categoria', campos.categoria)
    .field('severidad', campos.severidad ?? 'moderado')
    .field('lat', String(campos.lat))
    .field('lng', String(campos.lng))
    .field('direccion', campos.direccion ?? 'Calle de prueba, Armenia');
  if (campos.subtipo) prueba = prueba.field('subtipo', campos.subtipo);
  if (campos.descripcion) prueba = prueba.field('descripcion', campos.descripcion);
  if (campos.forzar) prueba = prueba.field('forzar', 'true');
  if (foto) prueba = prueba.attach('foto', foto, { filename: 'foto.png', contentType: 'image/png' });
  return prueba;
}

/** Desplaza una coordenada hacia el norte una cantidad de metros. */
export function alNorte(lat: number, metros: number): number {
  return lat + metros / 111_320;
}
