import 'dotenv/config';

import { z } from 'zod';

/**
 * Runtime env schema that validates required configuration at process start.
 *
 * Usage: extend this schema whenever new env variables are introduced.
 * Expects raw `process.env` input; returns parsed/coerced values through
 * `safeParse` so invalid setups fail fast before the server boots.
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
 * Parsed environment object consumed across app modules.
 *
 * Usage: import this object instead of reading `process.env` directly.
 * Expects schema validation to pass and returns normalized configuration data.
 */
export const env = parsed.data;
