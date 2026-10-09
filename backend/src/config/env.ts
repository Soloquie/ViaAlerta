import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().int().positive().default(4000),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRA_EN: z.string().default('7d'),
  CORS_ORIGIN: z.string().url(),
  MODO_DEMO: z.enum(['true', 'false']).default('true').transform((value) => value === 'true'),
  NOMINATIM_USER_AGENT: z.string().min(3),
  URL_PUBLICA_UPLOADS: z.string().url(),
});

export const env = envSchema.parse(process.env);
