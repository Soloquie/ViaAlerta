// Se ejecuta una vez antes de todas las pruebas: aplica las migraciones en la base de pruebas.
import 'dotenv/config';
import { execSync } from 'node:child_process';
import { rm } from 'node:fs/promises';

export async function setup() {
  const url = process.env.DATABASE_URL_TEST;
  if (!url) throw new Error('Define DATABASE_URL_TEST en backend/.env (ver README) para ejecutar las pruebas.');
  if (process.env.PRUEBAS_OMITIR_MIGRACION !== 'true') {
    execSync('npx prisma migrate deploy', { stdio: 'inherit', env: { ...process.env, DATABASE_URL: url } });
  }
}

export async function teardown() {
  await rm('uploads-test', { recursive: true, force: true });
}
