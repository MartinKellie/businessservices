import { NextResponse, type NextRequest } from 'next/server';

/**
 * Proxy (formerly "middleware" — renamed in Next.js 16). Runs on the server
 * before a route is rendered.
 *
 * Phase 0: pass-through skeleton.
 * Phase 2: redirect unauthenticated `/admin` requests to Google sign-in.
 * Phase 5: enforce Maintenance Mode for public routes (settings read from a
 *          cached source; `/admin` and `/api/auth` always exempt).
 */
export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
