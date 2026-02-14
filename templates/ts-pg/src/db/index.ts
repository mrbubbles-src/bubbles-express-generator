import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { env } from '../config/env.js';
import * as schema from './schema.js';

/**
 * Shared postgres client used across Drizzle queries and health checks.
 */
const client = postgres(env.DATABASE_URL, { prepare: false, max: 5 });

/**
 * Drizzle query interface bound to the project schema.
 */
export const db = drizzle(client, {
  schema: {
    ...schema,
  },
});

/**
 * Lightweight readiness probe for container and load balancer checks.
 */
export const pingDatabase = async (): Promise<void> => {
  await client`select 1`;
};

/**
 * Gracefully closes the postgres client during shutdown.
 */
export const closeDatabase = async (): Promise<void> => {
  await client.end();
};
