import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth-guards';
import { handle } from '@/lib/http';
import { followUpDashboardQuerySchema, listOpenFollowUps } from '@/lib/services/business-ops';

export const GET = handle(async (request: NextRequest) => {
  await requireAdmin();
  const query = followUpDashboardQuerySchema.parse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  return NextResponse.json({ followUps: await listOpenFollowUps(query) });
});
