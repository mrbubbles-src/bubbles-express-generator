import path from 'node:path';
import { fileURLToPath } from 'node:url';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';

import { env } from './config/env.js';
import { closeDatabase, pingDatabase } from './db/index.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';
import { router as userRouter } from './routes/user.js';

/**
 * Normalizes CORS origins from env and fails closed in production.
 *
 * Usage: called during app bootstrap to produce a value accepted by
 * the `cors` middleware `origin` option.
 */
const resolveAllowedOrigins = () => {
  const configuredOrigins =
    env.CORS_ORIGIN?.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean) ?? [];

  if (env.NODE_ENV === 'production' && configuredOrigins.length === 0) {
    throw new Error('CORS_ORIGIN must be set in production');
  }

  if (configuredOrigins.length > 0) {
    return configuredOrigins;
  }

  return ['http://localhost:3000'];
};

/**
 * Creates and configures the Express app without starting the server.
 *
 * Usage: import in tests to get a fully wired app instance without
 * opening a network port.
 */
export const createApp = () => {
  const app = express();
  const allowedOrigins = resolveAllowedOrigins();

  if (env.TRUST_PROXY === '1') {
    app.set('trust proxy', 1);
  }

  app.use(
    pinoHttp({
      transport:
        env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: { colorize: true, translateTime: 'SYS:standard' },
            }
          : undefined,
    }),
  );
  app.use(helmet());
  app.use(express.json());
  app.use(
    cors({
      origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
      credentials: true,
    }),
  );
  app.use(cookieParser());

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.get('/ready', async (_req, res) => {
    try {
      await pingDatabase();
      res.status(200).json({ status: 'ready' });
    } catch {
      res.status(503).json({ status: 'not_ready' });
    }
  });

  app.get('/', (_req, res) => {
    res.send('Hello, World!');
  });

  app.use('/users', userRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export const app = createApp();

/**
 * Starts the HTTP server after required runtime dependencies are ready.
 *
 * Usage: invoked only when this module is executed directly.
 */
export const startServer = () => {
  return app.listen(env.PORT, () => {
    console.log(`🫡 Server is running at: http://localhost:${env.PORT}`);
  });
};

/**
 * Performs graceful shutdown by closing database resources first.
 *
 * Usage: bound to process signals to avoid dropping in-flight work.
 */
const shutdown = async (signal) => {
  try {
    console.log(`\n${signal} received. Closing database connection...`);
    await closeDatabase();
    process.exit(0);
  } catch (error) {
    console.error('Error while shutting down server:', error);
    process.exit(1);
  }
};

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  startServer();

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
}
