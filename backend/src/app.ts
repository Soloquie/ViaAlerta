import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/error-handler.js';
import { healthRouter } from './routes/health.routes.js';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/api', healthRouter);
app.use(errorHandler);
