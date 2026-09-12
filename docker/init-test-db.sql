-- Runs once, only when the db-data volume is first initialised (postgres image
-- convention: everything in /docker-entrypoint-initdb.d runs on an empty data
-- dir). Gives the test suite its own database so `npm test` can truncate
-- freely without touching the dev database seeded via `npm run db:seed` /
-- `npm run seed:dummy`.
CREATE DATABASE directory_test;
