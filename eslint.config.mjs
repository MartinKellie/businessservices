import next from 'eslint-config-next';
import prettier from 'eslint-config-prettier';

/** @type {import('eslint').Linter.Config[]} */
const config = [
  ...next,
  prettier,
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'drizzle/**', 'coverage/**', 'next-env.d.ts'],
  },
];

export default config;
