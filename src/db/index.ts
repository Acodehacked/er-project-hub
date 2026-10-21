import 'server-only';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { env } from '@/lib/env';
import * as schema from './schema';

/**
 * One connection pool for the whole server process.
 *
 * In development Next.js hot-reloads modules, which would create a new pool
 * on every edit and exhaust MySQL connections — so we cache it on globalThis.
 */
const globalForDb = globalThis as unknown as { erhubPool?: mysql.Pool };

const pool =
  globalForDb.erhubPool ??
  mysql.createPool({
    uri: env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 10,
  });

if (process.env.NODE_ENV !== 'production') globalForDb.erhubPool = pool;

/**
 * The Drizzle client every module uses. Passing `schema` (tables + relations)
 * enables the typed relational API: `db.query.projects.findMany({ with: ... })`.
 */
export const db = drizzle(pool, { schema, mode: 'default' });

export type Database = typeof db;
/** The transaction handle passed to `db.transaction(async (tx) => ...)`. */
export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
