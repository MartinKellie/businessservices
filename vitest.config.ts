import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    env: {
      // Tests never need the full runtime env; DB-backed tests read DATABASE_URL
      // directly and are skipped when it is absent.
      SKIP_ENV_VALIDATION: '1',
      DB_DRIVER: 'node',
    },
  },
});
