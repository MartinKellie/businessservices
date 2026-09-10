import 'dotenv/config';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import * as schema from '../src/db/schema';

/**
 * Bootstraps or updates an admin allow-list entry. Needed because sign-in only
 * works for emails already in `admin_users`.
 *
 *   npm run admin:add -- someone@example.com owner
 *   npm run admin:add -- someone@example.com          (defaults to editor)
 */
async function main() {
  const [emailArg, roleArg = 'editor'] = process.argv.slice(2);
  if (!emailArg) throw new Error('Usage: npm run admin:add -- <email> [owner|editor]');
  if (roleArg !== 'owner' && roleArg !== 'editor') {
    throw new Error(`Invalid role "${roleArg}" (expected owner or editor)`);
  }
  const email = emailArg.toLowerCase().trim();

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set');
  const pool = new pg.Pool({ connectionString, max: 1 });
  const db = drizzle(pool, { schema });

  const [row] = await db
    .insert(schema.adminUsers)
    .values({ email, role: roleArg })
    .onConflictDoUpdate({
      target: schema.adminUsers.email,
      set: { role: roleArg, isActive: true, updatedAt: sql`now()` },
    })
    .returning();

  console.log(`Admin ready: ${row.email} (${row.role}), active=${row.isActive}`);
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
