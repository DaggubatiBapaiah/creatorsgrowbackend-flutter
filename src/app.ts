import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import authRouter from './routes/auth.routes';
import healthRouter from './routes/health.routes';
import socialRouter from './routes/social.routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));

app.use('/health', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/social', socialRouter);

app.use(errorHandler);

export default app;