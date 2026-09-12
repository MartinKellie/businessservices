// Default to the dedicated test database so `npm test` can never truncate
// dev data by accident. CI sets DATABASE_URL itself (its Postgres is
// ephemeral), so this only kicks in for local runs that haven't overridden it.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://directory:directory@localhost:5432/directory_test';
}
