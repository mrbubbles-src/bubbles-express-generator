import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import { Request, Response } from 'express';
import db from './db/db.js';
import { errorHandler } from './middleware/error-handler.js';
import { router as userRouter } from './routes/user.js';

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const configuredOrigins =
  process.env.CORS_ORIGIN?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];
const allowedOrigins =
  configuredOrigins.length > 0
    ? configuredOrigins
    : isProduction
      ? []
      : ['http://localhost:3000'];

if (isProduction && allowedOrigins.length === 0) {
  throw new Error('CORS_ORIGIN must be set in production');
}

if (process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

app.use(express.json());

app.use(
  cors({
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    credentials: true,
  }),
);

app.use(cookieParser());

const PORT = process.env.PORT || 3001;

app.get('/', (_: Request, res: Response) => {
  res.send('Hello, World!');
});

app.use('/users', userRouter);

app.use(errorHandler);

const startServer = async (): Promise<void> => {
  try {
    await db.connect();
    app.listen(PORT, () => {
      console.log(`🫡 Server is running at: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error while starting server:', error);
    process.exit(1);
  }
};

const shutdown = async (signal: string): Promise<void> => {
  try {
    console.log(`\n${signal} received. Closing database connection...`);
    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('Error while shutting down server:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

void startServer();
