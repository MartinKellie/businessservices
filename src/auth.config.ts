import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

export const SIGN_IN_PATH = '/admin/iniciar-sesion';
export const ADMIN_ROOT = '/admin';

/**
 * Edge-safe Auth.js configuration. No database access here so it can run in the
 * proxy (middleware). The allow-list is enforced in the Node-runtime `signIn`
 * callback in `src/auth.ts`; a rejected account never receives a session, so
 * gating on session presence here is sufficient.
 */
export const authConfig = {
  providers: [Google],
  pages: {
    signIn: SIGN_IN_PATH,
    error: SIGN_IN_PATH,
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const { pathname } = nextUrl;
      const isAdminArea = pathname.startsWith(ADMIN_ROOT) && pathname !== SIGN_IN_PATH;
      if (!isAdminArea) return true;
      return Boolean(auth?.user);
    },
  },
} satisfies NextAuthConfig;
