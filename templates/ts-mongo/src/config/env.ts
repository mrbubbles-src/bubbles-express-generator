import 'dotenv/config';

import { z } from 'zod';

/**
 * Central contract for required runtime configuration.
 *
 * Usage: update this schema whenever a new env var is introduced so
 * invalid setups fail fast during startup.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET must be set'),
  MONGO_DB_URI: z.string().min(1, 'MONGO_DB_URI must be set'),
  CORS_ORIGIN: z.string().optional(),
  TRUST_PROXY: z.enum(['0', '1']).default('0'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid environment variables:\n${issues}`);
}

/**
 * Typed and validated environment values for the rest of the app.
 */
export const env = parsed.data;
