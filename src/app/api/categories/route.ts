import { NextResponse, type NextRequest } from 'next/server';
import { handle } from '@/lib/http';
import { assertNotInMaintenance } from '@/lib/maintenance';
import { listPublicCategories } from '@/lib/services/public';

export const dynamic = 'force-dynamic';

export const GET = handle(async (request: NextRequest) => {
  await assertNotInMaintenance();
  const popularOnly = ['1', 'true'].includes(
    request.nextUrl.searchParams.get('popular')?.toLowerCase() ?? '',
  );
  return NextResponse.json({ categories: await listPublicCategories({ popularOnly }) });
});
