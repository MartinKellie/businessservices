import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth-guards';
import { handle } from '@/lib/http';
import {
  createBusiness,
  createBusinessSchema,
  listBusinesses,
  listBusinessesQuerySchema,
} from '@/lib/services/businesses';

export const GET = handle(async (request: NextRequest) => {
  await requireAdmin();
  const query = listBusinessesQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
  return NextResponse.json({ businesses: await listBusinesses(query) });
});

export const POST = handle(async (request: NextRequest) => {
  const actor = await requireAdmin();
  const business = await createBusiness(createBusinessSchema.parse(await request.json()), actor);
  return NextResponse.json({ business }, { status: 201 });
});
