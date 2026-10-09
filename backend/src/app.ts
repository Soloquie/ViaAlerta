import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import path from 'node:path';
import { env, origenesCors } from './config/env.js';
import { errorHandler, rutaNoEncontrada } from './middlewares/error-handler.js';
import { crearRutas, type OpcionesRutas } from './routes/index.js';

export function crearApp(opciones: Partial<OpcionesRutas> = {}) {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  // Las imágenes se consumen desde el frontend (otro origen), por eso se permite su carga cruzada.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: origenesCors, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] }));
  app.use(express.json({ limit: '100kb' }));
  app.use('/uploads', express.static(path.resolve(env.DIRECTORIO_UPLOADS), { fallthrough: false, maxAge: '1d' }));
  app.use(
    '/api',
    crearRutas({
      limiteLogin: opciones.limiteLogin ?? env.LIMITE_LOGIN_POR_15_MIN,
      limiteReportes: opciones.limiteReportes ?? env.LIMITE_REPORTES_POR_HORA,
    }),
  );
  app.use(rutaNoEncontrada);
  app.use(errorHandler);
  return app;
}

export const app = crearApp();
