import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
  // Extensions (postgis, pg_trgm, unaccent, fuzzystrmatch) and the immutable
  // f_unaccent wrapper are managed by hand-written SQL migrations in ./drizzle.
  verbose: true,
  strict: true,
});
