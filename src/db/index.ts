import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleNode } from 'drizzle-orm/node-postgres';
import { Pool as NeonPool } from '@neondatabase/serverless';
import pg from 'pg';
import { env } from '@/env';
import * as schema from './schema';

/**
 * Database client.
 *
 * Production/preview runs on Neon and uses the serverless (WebSocket) driver.
 * Local development, tests and CI run against a plain Postgres (see
 * `docker-compose.yml`) via node-postgres. Selection is automatic from the
 * connection string, and can be forced with `DB_DRIVER=node|neon`.
 */
const forced = process.env.DB_DRIVER;
const useNeon =
  forced === 'neon' || (forced !== 'node' && /neon\.tech|neon\.build/.test(env.DATABASE_URL ?? ''));

function createDb() {
  if (useNeon) {
    const pool = new NeonPool({ connectionString: env.DATABASE_URL });
    return drizzleNeon(pool, { schema });
  }
  const pool = new pg.Pool({ connectionString: env.DATABASE_URL });
  return drizzleNode(pool, { schema });
}

// Reuse the client across hot reloads in development.
const globalForDb = globalThis as unknown as { db?: ReturnType<typeof createDb> };

export const db = globalForDb.db ?? createDb();

if (env.NODE_ENV !== 'production') {
  globalForDb.db = db;
}

export { schema };
