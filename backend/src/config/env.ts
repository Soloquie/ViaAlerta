import 'dotenv/config';
import { z } from 'zod';

const booleano = (porDefecto: 'true' | 'false') =>
  z.enum(['true', 'false']).default(porDefecto).transform((valor) => valor === 'true');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().int().positive().default(4000),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres.'),
  JWT_EXPIRA_EN: z.string().default('7d'),
  CORS_ORIGIN: z.string().min(1),
  MODO_DEMO: booleano('true'),
  NOMINATIM_USER_AGENT: z.string().min(3),
  NOMINATIM_URL: z.string().url().default('https://nominatim.openstreetmap.org'),
  GEOCODIFICACION_EXTERNA: booleano('true'),
  URL_PUBLICA_UPLOADS: z.string().url(),
  DIRECTORIO_UPLOADS: z.string().default('uploads'),
  LIMITE_LOGIN_POR_15_MIN: z.coerce.number().int().positive().default(10),
  LIMITE_REPORTES_POR_HORA: z.coerce.number().int().positive().default(20),
});

export type Entorno = z.infer<typeof envSchema>;

export const env: Entorno = envSchema.parse(process.env);

/** Orígenes permitidos por CORS (se admite una lista separada por comas). */
export const origenesCors = env.CORS_ORIGIN.split(',').map((origen) => origen.trim()).filter(Boolean);
