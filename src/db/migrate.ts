import 'dotenv/config';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

/**
 * Applies pending migrations from ./drizzle. Runs against any Postgres via
 * node-postgres (local, CI, or a Neon connection string). Invoked by
 * `npm run db:migrate` and by the deploy pipeline.
 */
async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const pool = new pg.Pool({ connectionString, max: 1 });
  const db = drizzle(pool);

  console.log('Running migrations…');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrations complete.');

  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
