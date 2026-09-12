import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';

/**
 * Proxy (formerly "middleware" — renamed in Next.js 16).
 *
 * Auth.js gates the `/admin` area here using the edge-safe config: the
 * `authorized` callback redirects unauthenticated requests to the sign-in page.
 * The allow-list itself is enforced in the Node-runtime `signIn` callback.
 *
 * Phase 5 will also enforce Maintenance Mode for public routes here.
 */
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
