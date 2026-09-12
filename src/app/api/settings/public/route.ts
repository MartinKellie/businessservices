import { NextResponse } from 'next/server';
import { handle } from '@/lib/http';
import { getPublicSettings } from '@/lib/services/settings';

export const dynamic = 'force-dynamic';

/** Public settings the site needs on every page. Served even during maintenance. */
export const GET = handle(async () => {
  return NextResponse.json(await getPublicSettings());
});
