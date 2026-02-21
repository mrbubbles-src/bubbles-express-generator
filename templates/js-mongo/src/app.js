import path from 'node:path';
import { fileURLToPath } from 'node:url';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';

import { env } from './config/env.js';
import db from './db/db.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';
import { router as userRouter } from './routes/user.js';

/**
 * Builds the CORS allowlist and enforces a fail-closed default in production.
 *
 * Usage: call during app bootstrap before registering the `cors` middleware.
 * Expects `env.CORS_ORIGIN` as a comma-separated string; returns a normalized
 * origin array with a localhost fallback for local development.
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
 * Builds the fully wired Express instance without binding a network port.
 *
 * Usage: call once at startup or from tests to reuse one middleware stack.
 * Expects validated env values and route modules; returns an Express app ready
 * for `listen()` in runtime and `supertest` in tests.
 */
export const createApp = () => {
  const app = express();
  const allowedOrigins = resolveAllowedOrigins();

  if (env.TRUST_PROXY === '1') {
    app.set('trust proxy', 1);
  }

  const pinoOptions =
    env.NODE_ENV === 'development'
      ? {
          transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'SYS:standard' },
          },
        }
      : {};

  app.use(pinoHttp(pinoOptions));
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
      await db.ping();
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
 * Starts the HTTP server on the configured port after startup prerequisites.
 *
 * Usage: invoke only in direct-run mode, not when importing for tests.
 * Expects validated configuration and initialized dependencies; returns the
 * startup completion signal for the current template variant.
 */
export const startServer = async () => {
  await db.connect();
  return app.listen(env.PORT, () => {
    console.log(`🫡 Server is running at: http://localhost:${env.PORT}`);
  });
};

/**
 * Handles termination signals by closing database resources before exit.
 *
 * Usage: bind to `SIGINT` and `SIGTERM` during direct-run startup.
 * Expects the received signal label for logging and returns a promise that
 * ends the process with a success or failure exit code.
 */
const shutdown = async (signal) => {
  try {
    console.log(`\n${signal} received. Closing database connection...`);
    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('Error while shutting down server:', error);
    process.exit(1);
  }
};

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  startServer().catch((error) => {
    console.error('Error while starting server:', error);
    process.exit(1);
  });

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
}
