// Se ejecuta antes de cada archivo de pruebas y antes de importar la app.
import 'dotenv/config';

const urlPruebas = process.env.DATABASE_URL_TEST;
if (!urlPruebas) {
  throw new Error('Define DATABASE_URL_TEST en backend/.env (ver README) para ejecutar las pruebas.');
}
if (urlPruebas === process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL_TEST debe apuntar a una base distinta de la de desarrollo: las pruebas borran datos.');
}
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = urlPruebas;
process.env.DIRECTORIO_UPLOADS = 'uploads-test';
process.env.GEOCODIFICACION_EXTERNA = 'false';
process.env.MODO_DEMO = 'true';
