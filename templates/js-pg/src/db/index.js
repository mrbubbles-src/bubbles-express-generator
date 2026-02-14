import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../config/env.js';
import * as schema from './schema.js';

const client = postgres(env.DATABASE_URL, { prepare: false, max: 5 });

export const db = drizzle(client, {
  schema: {
    ...schema,
  },
});

export const pingDatabase = async () => {
  await client`select 1`;
};

export const closeDatabase = async () => {
  await client.end();
};
