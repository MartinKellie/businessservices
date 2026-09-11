import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { searchAddress } from '@/lib/geocode';
import { HttpError, handle } from '@/lib/http';
import { assertNotInMaintenance } from '@/lib/maintenance';
import { requestMeta } from '@/lib/request-meta';

export const dynamic = 'force-dynamic';

const querySchema = z.object({ q: z.string().trim().min(3).max(200) });

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 30;
const requestLog = new Map<string, number[]>();

// ponytail: in-memory, single-instance only — see src/lib/geocode.ts. Fine for MVP
// traffic; move to a shared store if this needs to hold under multi-instance abuse.
function assertWithinRateLimit(ipHash: string | null): void {
  if (!ipHash) return;
  const now = Date.now();
  const recent = (requestLog.get(ipHash) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    throw new HttpError(429, 'rate_limited', 'Demasiadas solicitudes. Inténtalo más tarde.');
  }
  recent.push(now);
  requestLog.set(ipHash, recent);
}

/** Public address/area lookup for "Near me" (scope §10). Proxies Nominatim. */
export const GET = handle(async (request: NextRequest) => {
  await assertNotInMaintenance();
  const { q } = querySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
  assertWithinRateLimit(requestMeta(request).ipHash);
  return NextResponse.json({ results: await searchAddress(q) });
});
