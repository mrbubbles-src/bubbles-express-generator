import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { env } from '../config/env.js';
import * as schema from './schema.js';

/**
 * Shared postgres client reused by Drizzle queries and health checks.
 *
 * Usage: keep module-scoped so all requests share one connection pool.
 * Expects a valid `env.DATABASE_URL` and returns a configured postgres client.
 */
const client = postgres(env.DATABASE_URL, { prepare: false, max: 5 });

/**
 * Drizzle database instance bound to local schema exports.
 *
 * Usage: import `db` for all SQL reads/writes in controllers or services.
 * Expects the shared postgres client and returns typed query builders.
 */
export const db = drizzle(client, {
  schema: {
    ...schema,
  },
});

/**
 * Executes a lightweight SQL ping for readiness checks.
 *
 * Usage: call from `/ready` handlers or startup diagnostics.
 * Expects an active postgres client and returns a promise that resolves when
 * the database can answer queries.
 */
export const pingDatabase = async (): Promise<void> => {
  await client`select 1`;
};

/**
 * Closes the shared postgres client during shutdown.
 *
 * Usage: call from process signal handlers before exiting the app.
 * Expects an initialized client and returns a promise that resolves when all
 * pooled connections are closed.
 */
export const closeDatabase = async (): Promise<void> => {
  await client.end();
};
