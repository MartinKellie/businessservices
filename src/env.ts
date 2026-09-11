import { z } from 'zod';

/**
 * Centralised environment-variable validation.
 *
 * Set `SKIP_ENV_VALIDATION=1` for lint/typecheck/build steps that do not need
 * real credentials (for example CI image builds). Runtime code paths that touch
 * the database, auth or integrations will still fail fast if a value is missing.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Database (Neon Postgres, PostGIS enabled).
  DATABASE_URL: z.string().url(),

  // Auth.js / Google OAuth.
  AUTH_SECRET: z.string().min(1),
  AUTH_GOOGLE_ID: z.string().min(1),
  AUTH_GOOGLE_SECRET: z.string().min(1),
  // Absolute URL of the deployment, used by Auth.js for callbacks.
  AUTH_URL: z.string().url().optional(),

  // Vercel Blob (business media + enquiry uploads).
  BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),

  // Transactional email for admin notifications (Resend).
  RESEND_API_KEY: z.string().min(1).optional(),
  ENQUIRY_NOTIFICATION_TO: z.string().email().optional(),
  ENQUIRY_NOTIFICATION_FROM: z.string().min(1).optional(),

  // MapLibre vector-tile style URL (provider-agnostic; see FRONTEND_HANDOFF.md).
  NEXT_PUBLIC_MAP_STYLE_URL: z.string().url().optional(),

  // Secret required to invoke scheduled maintenance endpoints (Vercel Cron).
  CRON_SECRET: z.string().min(1).optional(),
});

export type Env = z.infer<typeof schema>;

function loadEnv(): Env {
  if (process.env.SKIP_ENV_VALIDATION) {
    return process.env as unknown as Env;
  }
  const cleaned = Object.fromEntries(
    Object.entries(process.env).map(([key, value]) => [key, value === '' ? undefined : value]),
  );
  const parsed = schema.safeParse(cleaned);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  return parsed.data;
}

export const env = loadEnv();
