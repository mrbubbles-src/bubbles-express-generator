import { sql } from 'drizzle-orm';
import { boolean, check, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * Database enum for user roles used by persistence and JWT claims.
 *
 * Usage: reference in table definitions that store authorization roles.
 * Returns a `pgEnum` factory used by schema columns.
 */
export const role = pgEnum('role', ['admin', 'user']);

/**
 * Defines the `users` table plus integrity constraints for auth data.
 *
 * Usage: imported by migrations and query builders for user persistence.
 * Expects SQL helpers and role enum wiring; returns a typed table definition
 * with username/password/email guardrails.
 */
export const usersTable = pgTable(
  'users',
  {
    id: text()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    username: text().notNull().unique(),
    email: text().notNull().unique(),
    password: text().notNull(),
    role: role().default('user'),
    verified: boolean().default(false),
    createdAt: timestamp({ precision: 3, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ precision: 3, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    check('password_min_length', sql`char_length(${table.password}) >= 8`),
    check('username_min_length', sql`char_length(${table.username}) >= 3`),
    check(
      'email_format',
      sql`${table.email} ~* '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'`,
    ),
  ],
);
