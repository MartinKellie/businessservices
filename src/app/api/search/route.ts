import { NextResponse, type NextRequest } from 'next/server';
import { handle } from '@/lib/http';
import { assertNotInMaintenance } from '@/lib/maintenance';
import { search, searchQuerySchema } from '@/lib/services/search';

export const dynamic = 'force-dynamic';

/** Public directory search (scope §6). Wraps the Phase 4 engine. */
export const GET = handle(async (request: NextRequest) => {
  await assertNotInMaintenance();
  const input = searchQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
  return NextResponse.json(await search(input));
});
