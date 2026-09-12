import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth-guards';
import { handle } from '@/lib/http';
import {
  createCategory,
  createCategorySchema,
  listCategories,
  taxonomyListQuerySchema,
} from '@/lib/services/taxonomy';

export const GET = handle(async (request: NextRequest) => {
  await requireAdmin();
  const query = taxonomyListQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
  return NextResponse.json({ categories: await listCategories(query) });
});

export const POST = handle(async (request: NextRequest) => {
  const actor = await requireAdmin();
  const input = createCategorySchema.parse(await request.json());
  const category = await createCategory(input, actor);
  return NextResponse.json({ category }, { status: 201 });
});
