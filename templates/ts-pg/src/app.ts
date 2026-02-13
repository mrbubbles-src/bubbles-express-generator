import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import { Request, Response } from 'express';
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

app.listen(PORT, () => {
  console.log(`🫡 Server is running at: http://localhost:${PORT}`);
});
