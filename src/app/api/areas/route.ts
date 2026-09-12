import { NextResponse } from 'next/server';
import { handle } from '@/lib/http';
import { assertNotInMaintenance } from '@/lib/maintenance';
import { listActiveAreas } from '@/lib/services/public';

export const dynamic = 'force-dynamic';

export const GET = handle(async () => {
  await assertNotInMaintenance();
  return NextResponse.json({ areas: await listActiveAreas() });
});
