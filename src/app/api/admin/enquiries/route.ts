import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth-guards';
import { handle } from '@/lib/http';
import { listEnquiries, listEnquiriesQuerySchema } from '@/lib/services/enquiries';

export const GET = handle(async (request: NextRequest) => {
  await requireAdmin();
  const query = listEnquiriesQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
  return NextResponse.json({ enquiries: await listEnquiries(query) });
});
